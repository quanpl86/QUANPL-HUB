'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, UploadCloud, Download, Image as ImageIcon, Trash2, Camera, Settings2, Box } from 'lucide-react';
import JSZip from 'jszip';
import GLBViewer, { CameraAngle, GLBViewerRef } from './components/GLBViewer';

interface FileItem {
  id: string;
  file: File;
  url: string;
}

export default function GLBToImagePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>('iso1');
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');
  const [exportSize, setExportSize] = useState<number>(512);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const viewerRef = useRef<GLBViewerRef>(null);

  const processFiles = (fileList: FileList | null) => {
    if (fileList && fileList.length > 0) {
      const glbFiles = Array.from(fileList).filter(file => file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf'));
      if (glbFiles.length === 0) return;
      
      const newFiles = glbFiles.map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        url: URL.createObjectURL(file)
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      if (activeIndex >= newFiles.length) {
        setActiveIndex(Math.max(0, newFiles.length - 1));
      }
      return newFiles;
    });
  };

  const handleExportCurrent = async () => {
    if (!viewerRef.current || files.length === 0) return;
    const dataUrl = await viewerRef.current.captureImage(exportSize);
    if (!dataUrl) return;

    const currentFile = files[activeIndex];
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${currentFile.file.name.replace(/\.(glb|gltf)$/i, '')}.png`;
    link.click();
  };

  const handleBatchExport = async () => {
    if (!viewerRef.current || files.length === 0) return;
    
    setIsExporting(true);
    setExportProgress(0);
    const zip = new JSZip();
    
    const originalIndex = activeIndex;
    
    for (let i = 0; i < files.length; i++) {
      setActiveIndex(i);
      
      // Wait for model to load and render
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const dataUrl = await viewerRef.current.captureImage(exportSize);
      if (dataUrl) {
        const base64Data = dataUrl.split(',')[1];
        zip.file(`${files[i].file.name.replace(/\.(glb|gltf)$/i, '')}.png`, base64Data, { base64: true });
      }
      setExportProgress(Math.round(((i + 1) / files.length) * 100));
    }
    
    setActiveIndex(originalIndex);
    
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `thumbnails_${cameraAngle}.zip`;
    link.click();
    
    setIsExporting(false);
    setExportProgress(0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center gap-4">
          <Link href="/utility-hub" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Về Utility Hub
          </Link>
          <div className="h-4 w-[1px] bg-border" />
          <h1 className="text-sm font-semibold">GLB Thumbnail Generator</h1>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-border/40 bg-muted/20 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto shrink-0">
          <div className="p-4 space-y-6">
            
            {/* Upload */}
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tải file GLB</h2>
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-brand-orange bg-brand-orange/10' 
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                  <UploadCloud className={`w-8 h-8 mb-2 ${isDragging ? 'text-brand-orange' : 'text-muted-foreground'}`} />
                  <p className="text-sm text-muted-foreground"><span className="font-semibold">Click để chọn</span> hoặc kéo thả</p>
                  <p className="text-xs text-muted-foreground mt-1">Nhiều file .glb cùng lúc</p>
                </div>
                <input type="file" className="hidden" accept=".glb,.gltf" multiple onChange={handleFileUpload} />
              </label>
            </div>

            {/* Config */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Cấu hình Thumbnail
              </h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Góc chụp (Camera)</label>
                <select 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  value={cameraAngle}
                  onChange={(e) => setCameraAngle(e.target.value as CameraAngle)}
                >
                  <option value="iso1">Phối cảnh 1 (Đằng trước - Phải)</option>
                  <option value="iso2">Phối cảnh 2 (Đằng trước - Trái)</option>
                  <option value="iso3">Phối cảnh 3 (Đằng sau - Phải)</option>
                  <option value="iso4">Phối cảnh 4 (Đằng sau - Trái)</option>
                  <option value="front">Mặt trước (Front)</option>
                  <option value="back">Mặt sau (Back)</option>
                  <option value="left">Cạnh trái (Left)</option>
                  <option value="right">Cạnh phải (Right)</option>
                  <option value="top">Từ trên xuống (Top)</option>
                  <option value="bottom">Từ dưới lên (Bottom)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kích thước ảnh vuông</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportSize(512)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${exportSize === 512 ? 'bg-brand-orange text-white border-brand-orange' : 'bg-background border-border text-foreground/80 hover:bg-muted'}`}
                  >
                    512 x 512
                  </button>
                  <button
                    onClick={() => setExportSize(1024)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${exportSize === 1024 ? 'bg-brand-orange text-white border-brand-orange' : 'bg-background border-border text-foreground/80 hover:bg-muted'}`}
                  >
                    1024 x 1024
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Màu nền</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBackgroundColor('transparent')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${backgroundColor === 'transparent' ? 'bg-foreground text-background border-foreground' : 'bg-background border-border text-foreground/80 hover:bg-muted'}`}
                  >
                    Trong suốt
                  </button>
                  <button
                    onClick={() => setBackgroundColor('#ffffff')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 transition-colors ${backgroundColor === '#ffffff' ? 'bg-foreground text-background border-foreground' : 'bg-background border-border text-foreground/80 hover:bg-muted'}`}
                  >
                    <span className="w-3 h-3 rounded-full border border-gray-200 bg-white inline-block"></span>
                    Trắng
                  </button>
                </div>
              </div>
            </div>

            {/* List files */}
            {files.length > 0 && (
              <div className="space-y-2 pb-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Box className="w-4 h-4" /> Danh sách ({files.length})
                  </h2>
                </div>
                <div className="space-y-1">
                  {files.map((file, index) => (
                    <div
                      key={file.id}
                      onClick={() => !isExporting && setActiveIndex(index)}
                      className={`flex items-center justify-between p-2 rounded-lg text-sm cursor-pointer border transition-colors ${
                        activeIndex === index ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' : 'border-transparent hover:bg-muted text-foreground/80'
                      } ${isExporting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <span className="truncate flex-1" title={file.file.name}>{file.file.name}</span>
                      <button
                        onClick={(e) => removeFile(file.id, e)}
                        className="p-1 hover:text-red-500 rounded-md transition-colors ml-2"
                        disabled={isExporting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative p-8 flex flex-col items-center justify-center overflow-hidden">
          {/* subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          {files.length > 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6 relative z-10">
              {/* Checkered background pattern for transparent background preview */}
              <style dangerouslySetInnerHTML={{__html: `
                .bg-checkered {
                  background-color: #f8f9fa;
                  background-image: 
                    linear-gradient(45deg, #e5e7eb 25%, transparent 25%), 
                    linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #e5e7eb 75%), 
                    linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
                  background-size: 20px 20px;
                  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                }
                .dark .bg-checkered {
                  background-color: #1a1a1a;
                  background-image: 
                    linear-gradient(45deg, #2a2a2a 25%, transparent 25%), 
                    linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #2a2a2a 75%), 
                    linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
                }
              `}} />
              
              {/* Vùng viewer được làm vuông để đảm bảo tỷ lệ ảnh vuông khi chụp xuất ra */}
              <div className="relative w-full max-w-[550px] aspect-square rounded-2xl overflow-hidden border border-border/50 bg-checkered shadow-xl">
                {files[activeIndex] && (
                  <GLBViewer 
                    ref={viewerRef}
                    fileUrl={files[activeIndex].url}
                    cameraAngle={cameraAngle}
                    backgroundColor={backgroundColor}
                  />
                )}
                
                {isExporting && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mb-4"></div>
                    <p className="font-medium text-lg">Đang kết xuất ảnh...</p>
                    <p className="text-muted-foreground mt-1">{exportProgress}% ({activeIndex + 1}/{files.length})</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleExportCurrent}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-6 py-3 bg-background border border-border text-foreground font-medium rounded-xl shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  Chụp ảnh hiện tại
                </button>
                <button
                  onClick={handleBatchExport}
                  disabled={isExporting || files.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white font-medium rounded-xl shadow-md hover:bg-brand-orange/90 transition-colors disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                  Batch Export ZIP
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground text-center relative z-10">
              <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                <ImageIcon className="w-12 h-12 opacity-50" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Chưa có mô hình nào</h2>
              <p className="max-w-md">Vui lòng tải lên một hoặc nhiều file .glb ở sidebar để bắt đầu tạo thumbnail.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
