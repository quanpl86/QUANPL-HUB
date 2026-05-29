'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  ChevronRight, FileCode2, ImagePlus, FileDown, Layers, 
  Scissors, GripVertical, Trash2, CheckCircle2, FileUp, Loader2, FilePlus, RotateCw,
  LayoutGrid, List, ZoomIn, ZoomOut, CheckSquare, Square, Eye, X
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';

// --- Sortable Components ---
function SortableImageItem({ id, file, url, rotation, onRemove, onRotate, index }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 mb-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-300 group">
      <div className="flex items-center space-x-4">
        <button {...attributes} {...listeners} className="text-gray-400 hover:text-blue-500 cursor-grab active:cursor-grabbing p-1">
          <GripVertical size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs">
          {index + 1}
        </div>
        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50 flex items-center justify-center relative">
          <img 
            src={url} 
            alt={file.name} 
            className="max-w-full max-h-full object-contain transition-transform duration-300"
            style={{ transform: `rotate(${rotation || 0}deg)` }} 
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-sm truncate max-w-[120px] sm:max-w-[250px]">{file.name}</span>
          <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      </div>
      <div className="flex space-x-1 sm:space-x-2">
        <button onClick={() => onRotate(id)} className="text-gray-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Xoay ảnh 90 độ">
          <RotateCw size={18} />
        </button>
        <button onClick={() => onRemove(id)} className="text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

function SortablePdfItem({ id, file, onRemove, index }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-4 mb-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-300 group">
      <div className="flex items-center space-x-4">
        <button {...attributes} {...listeners} className="text-gray-400 hover:text-indigo-500 cursor-grab active:cursor-grabbing p-1">
          <GripVertical size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs">
          {index + 1}
        </div>
        <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
          <FileCode2 size={24} />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-sm truncate max-w-[150px] sm:max-w-[400px]">{file.name}</span>
          <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      </div>
      <button onClick={() => onRemove(id)} className="text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
        <Trash2 size={18} />
      </button>
    </div>
  );
}

// --- Main Page ---
export default function PdfStudioPage() {
  const [activeTab, setActiveTab] = useState<'img2pdf' | 'merge' | 'split'>('img2pdf');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Image to PDF State ---
  const [images, setImages] = useState<{ id: string; file: File; url: string; rotation: number }[]>([]);
  const [pdfMargin, setPdfMargin] = useState(10); // in mm
  
  // --- Merge PDF State ---
  const [mergeFiles, setMergeFiles] = useState<{ id: string; file: File }[]>([]);

  // --- Split PDF State ---
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitPages, setSplitPages] = useState<{ pageNumber: number, dataUrl: string }[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [splitViewMode, setSplitViewMode] = useState<'grid' | 'list'>('grid');
  const [gridSize, setGridSize] = useState<number>(150); // width in px
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [previewPage, setPreviewPage] = useState<{pageNumber: number, dataUrl: string} | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Handlers: Image to PDF ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        url: URL.createObjectURL(file),
        rotation: 0
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRotateImage = (id: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
    ));
  };

  const handleDragEndImage = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const generateImagePdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();

        const imgData = images[i].url;
        
        // Cần lấy kích thước thật của ảnh để tính toán scale
        const img = new Image();
        const imgProps = await new Promise<{width: number, height: number}>((resolve) => {
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.src = imgData;
        });

        let finalDataUrl = imgData;
        let finalWidth = imgProps.width;
        let finalHeight = imgProps.height;
        
        if (images[i].rotation !== 0) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (images[i].rotation === 90 || images[i].rotation === 270) {
            canvas.width = imgProps.height;
            canvas.height = imgProps.width;
            finalWidth = imgProps.height;
            finalHeight = imgProps.width;
          } else {
            canvas.width = imgProps.width;
            canvas.height = imgProps.height;
          }
          
          if (ctx) {
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((images[i].rotation * Math.PI) / 180);
            ctx.drawImage(img, -imgProps.width / 2, -imgProps.height / 2);
            finalDataUrl = canvas.toDataURL('image/jpeg', 0.95);
          }
        }

        const maxWidth = pageWidth - (pdfMargin * 2);
        const maxHeight = pageHeight - (pdfMargin * 2);

        let renderWidth = maxWidth;
        let renderHeight = (finalHeight * renderWidth) / finalWidth;

        if (renderHeight > maxHeight) {
          renderHeight = maxHeight;
          renderWidth = (finalWidth * renderHeight) / finalHeight;
        }

        const x = (pageWidth - renderWidth) / 2;
        const y = (pageHeight - renderHeight) / 2;

        pdf.addImage(finalDataUrl, 'JPEG', x, y, renderWidth, renderHeight);
      }

      pdf.save(`QuanPL_Images_${Date.now()}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi tạo PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Handlers: Merge PDF ---
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPdfs = Array.from(e.target.files).filter(f => f.type === 'application/pdf').map(file => ({
        id: Math.random().toString(36).substring(7),
        file
      }));
      setMergeFiles(prev => [...prev, ...newPdfs]);
    }
  };

  const handleDragEndMerge = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMergeFiles((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const generateMergedPdf = async () => {
    if (mergeFiles.length < 2) {
      alert("Cần ít nhất 2 file PDF để gộp!");
      return;
    }
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of mergeFiles) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QuanPL_Merged_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi gộp file PDF. File có thể bị hỏng hoặc có mật khẩu.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Handlers: Split PDF ---
  const handleSplitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSplitFile(file);
      setSplitPages([]);
      setSelectedPages(new Set());
      setIsRenderingPdf(true);

      try {
        // Dynamically import pdfjs-dist to prevent SSR crashes (DOMMatrix is not defined in Node.js)
        const pdfjsLib = await import('pdfjs-dist');
        // Setup worker dynamically
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        const pagesData = [];

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 }); // High-res for clear reading in modal
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport } as any).promise;
            pagesData.push({
              pageNumber: i,
              dataUrl: canvas.toDataURL('image/jpeg', 0.7)
            });
          }
        }
        setSplitPages(pagesData);
        // Default select all
        setSelectedPages(new Set(Array.from({length: totalPages}, (_, i) => i + 1)));
      } catch (err) {
        console.error('Error rendering PDF:', err);
        alert('Có lỗi khi đọc file PDF để hiển thị trước.');
      } finally {
        setIsRenderingPdf(false);
      }
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPages.size === splitPages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(splitPages.map(p => p.pageNumber)));
    }
  };

  const generateSplitPdf = async () => {
    if (!splitFile || selectedPages.size === 0) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await splitFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);

      const newPdf = await PDFDocument.create();
      const sortedIndices = Array.from(selectedPages).sort((a, b) => a - b).map(n => n - 1);
      const copiedPages = await newPdf.copyPages(pdf, sortedIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QuanPL_Extracted_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi cắt PDF. Định dạng không hợp lệ.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-8 relative z-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link href="/utility-hub" className="hover:text-rose-600 transition-colors">Utility Hub</Link>
            <ChevronRight size={16} />
            <span className="text-gray-900 font-medium">PDF Studio</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
                  <FileCode2 size={24} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">PDF Studio</h1>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl">
                Trạm xử lý PDF nội bộ tốc độ cao. Đóng gói ảnh, gộp và cắt file hoàn toàn bằng mã nhị phân <b>chạy offline trên trình duyệt</b>, không tải lên bất kỳ máy chủ nào.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('img2pdf')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center transition-colors ${
                activeTab === 'img2pdf' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ImagePlus size={18} className="mr-2" />
              Tạo PDF từ Ảnh (Kéo thả)
            </button>
            <button
              onClick={() => setActiveTab('merge')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center transition-colors ${
                activeTab === 'merge' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Layers size={18} className="mr-2" />
              Gộp nhiều PDF
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center transition-colors ${
                activeTab === 'split' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Scissors size={18} className="mr-2" />
              Cắt & Trích xuất trang
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: IMAGE TO PDF */}
        {activeTab === 'img2pdf' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Đóng gói Hình ảnh thành PDF</h2>
                  <p className="text-gray-500 text-sm">Tải lên các file JPG/PNG và kéo thả để sắp xếp thứ tự trang. Tuyệt vời để nộp bài hoặc làm portfolio.</p>
                </div>
                <div className="flex items-center space-x-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <span className="text-sm font-semibold text-gray-700 px-2">Căn lề (Margin):</span>
                  <select 
                    value={pdfMargin} 
                    onChange={e => setPdfMargin(Number(e.target.value))}
                    className="p-2 border border-gray-200 rounded-lg outline-none focus:border-rose-500 text-sm font-bold bg-white"
                  >
                    <option value={0}>0 mm (Tràn viền)</option>
                    <option value={10}>10 mm (Chuẩn)</option>
                    <option value={20}>20 mm (Rộng)</option>
                  </select>
                </div>
              </div>

              {/* Upload Area */}
              <label className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-rose-50 hover:border-rose-300 transition-colors group mb-8">
                <input type="file" multiple accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageUpload} />
                <div className="w-16 h-16 bg-gray-100 group-hover:bg-rose-100 rounded-full flex items-center justify-center text-gray-400 group-hover:text-rose-600 mb-4 transition-colors">
                  <FileUp size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Click để tải ảnh lên</h3>
                <p className="text-sm text-gray-500">Hỗ trợ JPG, PNG, WEBP. Chọn nhiều file cùng lúc.</p>
              </label>

              {/* Sortable List */}
              {images.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-gray-700 flex items-center">
                      <Layers size={18} className="mr-2" />
                      Danh sách trang ({images.length} ảnh)
                    </h3>
                    <p className="text-xs text-gray-500 italic">Kéo thả để sắp xếp thứ tự</p>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndImage}>
                      <SortableContext items={images} strategy={verticalListSortingStrategy}>
                        {images.map((img, index) => (
                          <SortableImageItem 
                            key={img.id} 
                            id={img.id} 
                            file={img.file} 
                            url={img.url}
                            rotation={img.rotation}
                            index={index}
                            onRotate={handleRotateImage}
                            onRemove={(id: string) => setImages(prev => prev.filter(i => i.id !== id))}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={generateImagePdf}
                      disabled={isProcessing}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-xl font-bold flex items-center transition-all active:scale-95 shadow-md shadow-rose-500/20 disabled:opacity-50 disabled:active:scale-100"
                    >
                      {isProcessing ? <Loader2 className="animate-spin mr-2" size={20} /> : <FileDown size={20} className="mr-2" />}
                      {isProcessing ? 'Đang xuất PDF...' : 'Tạo & Xuất file PDF'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MERGE PDF */}
        {activeTab === 'merge' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Gộp nhiều file PDF</h2>
                <p className="text-gray-500 text-sm">Tải lên các file PDF riêng lẻ và trộn chúng lại thành 1 file duy nhất. Giữ nguyên chất lượng 100%.</p>
              </div>

              {/* Upload Area */}
              <label className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors group mb-8">
                <input type="file" multiple accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
                <div className="w-16 h-16 bg-gray-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center text-gray-400 group-hover:text-indigo-600 mb-4 transition-colors">
                  <FilePlus size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Click để nạp các file PDF</h3>
                <p className="text-sm text-gray-500">Chỉ hỗ trợ định dạng .pdf (Tối đa kích thước RAM máy bạn có thể chịu được)</p>
              </label>

              {/* Sortable List */}
              {mergeFiles.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-gray-700 flex items-center">
                      <Layers size={18} className="mr-2" />
                      Thứ tự các file sẽ gộp ({mergeFiles.length} file)
                    </h3>
                    <p className="text-xs text-gray-500 italic">Kéo thả để sắp xếp thứ tự</p>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndMerge}>
                      <SortableContext items={mergeFiles} strategy={verticalListSortingStrategy}>
                        {mergeFiles.map((item, index) => (
                          <SortablePdfItem 
                            key={item.id} 
                            id={item.id} 
                            file={item.file} 
                            index={index}
                            onRemove={(id: string) => setMergeFiles(prev => prev.filter(i => i.id !== id))}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={generateMergedPdf}
                      disabled={isProcessing || mergeFiles.length < 2}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold flex items-center transition-all active:scale-95 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:active:scale-100"
                    >
                      {isProcessing ? <Loader2 className="animate-spin mr-2" size={20} /> : <FileDown size={20} className="mr-2" />}
                      {isProcessing ? 'Đang hợp nhất...' : 'Tiến hành Gộp PDF'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SPLIT PDF */}
        {activeTab === 'split' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Cắt / Trích xuất trang PDF</h2>
                <p className="text-gray-500 text-sm">Lấy ra những trang quan trọng từ một file PDF lớn (VD: Lấy trang 1, 3, và từ 5 đến 10).</p>
              </div>

              <div className="flex flex-col gap-8">
                {/* Upload Section */}
                <div>
                  {!splitFile ? (
                    <label className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-colors h-48">
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleSplitUpload} />
                      <FileUp size={32} className="text-gray-400 mb-3" />
                      <h3 className="text-lg font-bold text-gray-800 mb-1">Click để nạp file PDF gốc</h3>
                      <p className="text-sm font-semibold text-gray-700">Hỗ trợ hiển thị trực quan từng trang để bạn dễ dàng chọn lọc.</p>
                    </label>
                  ) : (
                    <div className="border border-orange-200 bg-orange-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between relative group">
                      <div className="flex items-center space-x-4">
                        <FileCode2 size={40} className="text-orange-500 flex-shrink-0" />
                        <div>
                           <h4 className="font-bold text-gray-900 truncate pr-8 max-w-[300px]">{splitFile.name}</h4>
                           <p className="text-sm text-gray-500">{(splitFile.size / 1024 / 1024).toFixed(2)} MB • {splitPages.length} trang</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSplitFile(null)}
                        className="text-orange-500 hover:text-white border border-orange-500 hover:bg-orange-500 px-4 py-2 rounded-lg transition-colors font-bold text-sm mt-4 sm:mt-0"
                      >
                        Đổi File Khác
                      </button>
                    </div>
                  )}
                </div>

                {/* Range Selection Section */}
                <div className={`transition-opacity ${!splitFile ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  {isRenderingPdf ? (
                    <div className="py-20 flex flex-col items-center justify-center text-orange-600">
                       <Loader2 className="animate-spin mb-4" size={40} />
                       <p className="font-bold">Đang đọc file PDF và tạo ảnh xem trước...</p>
                    </div>
                  ) : splitPages.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                      {/* Toolbar */}
                      <div className="bg-white p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                           <button onClick={() => setSplitViewMode('grid')} className={`p-2 rounded-lg ${splitViewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Xem dạng lưới"><LayoutGrid size={20}/></button>
                           <button onClick={() => setSplitViewMode('list')} className={`p-2 rounded-lg ${splitViewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Xem dạng danh sách"><List size={20}/></button>
                           <div className="w-px h-6 bg-gray-300 mx-2"></div>
                           <button onClick={toggleSelectAll} className="flex items-center space-x-2 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                             {selectedPages.size === splitPages.length ? <CheckSquare size={18} className="text-orange-500"/> : <Square size={18} className="text-gray-400"/>}
                             <span>Chọn tất cả</span>
                           </button>
                        </div>
                        {splitViewMode === 'grid' && (
                          <div className="flex items-center space-x-2">
                            <ZoomOut size={16} className="text-gray-400"/>
                            <input 
                              type="range" 
                              min="100" max="300" 
                              value={gridSize} 
                              onChange={(e) => setGridSize(Number(e.target.value))} 
                              className="w-32 accent-orange-500"
                            />
                            <ZoomIn size={16} className="text-gray-400"/>
                          </div>
                        )}
                      </div>

                      {/* View Area */}
                      <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar bg-gray-100/50">
                        {splitViewMode === 'grid' ? (
                          <div className="flex flex-wrap gap-4" style={{ justifyContent: 'center' }}>
                            {splitPages.map((page) => {
                              const isSelected = selectedPages.has(page.pageNumber);
                              return (
                                <div 
                                  key={page.pageNumber}
                                  onClick={() => togglePageSelection(page.pageNumber)}
                                  className={`relative cursor-pointer transition-all duration-200 ${isSelected ? 'ring-4 ring-orange-500 rounded-lg scale-[1.02]' : 'hover:scale-[1.02] hover:shadow-md hover:ring-2 hover:ring-orange-200 rounded-lg'}`}
                                  style={{ width: gridSize }}
                                >
                                  <img src={page.dataUrl} alt={`Trang ${page.pageNumber}`} className="w-full h-auto bg-white border border-gray-200 rounded-lg shadow-sm" />
                                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-black/70 text-white font-bold rounded-full flex items-center justify-center text-xs border-2 border-white">
                                    {page.pageNumber}
                                  </div>
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setPreviewPage(page); }}
                                      className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                      title="Xem trước lớn"
                                    >
                                      <Eye size={20} />
                                    </button>
                                  </div>
                                  {isSelected && (
                                    <div className="absolute top-2 left-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-md">
                                      <CheckCircle2 size={20} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-2">
                             {splitPages.map((page) => {
                              const isSelected = selectedPages.has(page.pageNumber);
                              return (
                                <div 
                                  key={page.pageNumber}
                                  onClick={() => togglePageSelection(page.pageNumber)}
                                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-200 hover:border-orange-200'}`}
                                >
                                  <div className="flex items-center space-x-4">
                                     {isSelected ? <CheckSquare size={24} className="text-orange-500"/> : <Square size={24} className="text-gray-300"/>}
                                     <div className="w-12 h-auto bg-white border border-gray-200 shadow-sm rounded flex-shrink-0 relative group">
                                       <img src={page.dataUrl} alt={`Trang ${page.pageNumber}`} className="w-full h-auto" />
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); setPreviewPage(page); }}
                                         className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 text-white transition-opacity rounded"
                                         title="Xem trước"
                                       >
                                         <Eye size={16} />
                                       </button>
                                     </div>
                                     <span className="font-bold text-gray-800">Trang {page.pageNumber}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="font-bold text-gray-700">
                          Đã chọn để trích xuất: <span className="text-orange-600 text-xl">{selectedPages.size}</span> / {splitPages.length} trang
                        </div>
                        <button 
                          onClick={generateSplitPdf}
                          disabled={isProcessing || selectedPages.size === 0}
                          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:active:scale-100"
                        >
                          {isProcessing ? <Loader2 className="animate-spin mr-2" size={20} /> : <Scissors size={20} className="mr-2" />}
                          {isProcessing ? 'Đang xử lý...' : 'Trích xuất thành PDF mới'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Modal */}
                {previewPage && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPreviewPage(null)}>
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => setPreviewPage(null)}
                        className="absolute -top-12 right-0 text-white hover:text-orange-400 p-2 transition-colors"
                        title="Đóng"
                      >
                        <X size={32} />
                      </button>
                      <div className="bg-white p-2 rounded-xl w-full h-[85vh] flex items-center justify-center overflow-hidden">
                         <img src={previewPage.dataUrl} alt={`Trang ${previewPage.pageNumber}`} className="w-full h-full object-contain rounded-lg" />
                      </div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full font-bold">
                        Trang {previewPage.pageNumber}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
