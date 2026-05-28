'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Archive, UploadCloud, FileImage, Settings, Download, Trash2, CheckCircle2, Loader2, MousePointer2 } from 'lucide-react';
import JSZip from 'jszip';

interface AssetItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  selected: boolean;
  
  // Per-asset config
  baseName: string;
  presetIndex: number;
  fitMode: 'blur' | 'color' | 'cover';
  padColor: string;
  autoColor: boolean;
  format: 'webp' | 'jpeg' | 'png';
  quality: number;
}

const PRESET_SIZES = [
  { label: 'Giữ nguyên gốc (Original)', width: 0, height: 0 },
  { label: 'Slide Máy chiếu (16:9)', width: 1920, height: 1080 },
  { label: 'Bài viết Blog / Facebook (OG)', width: 1200, height: 630 },
  { label: 'Instagram / Vuông (1:1)', width: 1080, height: 1080 },
];

export default function AssetPackagerPage() {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Global Config UI State (Reflects the currently selected items)
  const [uiBaseName, setUiBaseName] = useState('project-asset');
  const [uiPresetIndex, setUiPresetIndex] = useState(1);
  const [uiFitMode, setUiFitMode] = useState<'blur' | 'color' | 'cover'>('blur');
  const [uiPadColor, setUiPadColor] = useState('#ffffff');
  const [uiAutoColor, setUiAutoColor] = useState(true);
  const [uiFormat, setUiFormat] = useState<'webp' | 'jpeg' | 'png'>('webp');
  const [uiQuality, setUiQuality] = useState(80);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Apply UI changes to all selected assets
  const updateSelectedAssets = (key: keyof AssetItem, value: any) => {
    setAssets(prev => prev.map(a => a.selected ? { ...a, [key]: value } : a));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, [uiBaseName, uiPresetIndex, uiFitMode, uiPadColor, uiAutoColor, uiFormat, uiQuality]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const newAssets: AssetItem[] = imageFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      selected: true, // Default select new files
      
      // Assign current UI config as default
      baseName: uiBaseName,
      presetIndex: uiPresetIndex,
      fitMode: uiFitMode,
      padColor: uiPadColor,
      autoColor: uiAutoColor,
      format: uiFormat,
      quality: uiQuality
    }));
    setAssets(prev => [...prev, ...newAssets]);
  };

  const toggleSelectAsset = (id: string) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));
  };

  const removeAsset = (id: string) => {
    setAssets(prev => {
      const filtered = prev.filter(a => a.id !== id);
      const toRemove = prev.find(a => a.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.previewUrl);
      return filtered;
    });
  };

  // Convert to slug
  const slugify = (text: string) => {
    return text.toString().toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
      .replace(/[èéẹẻẽêềếệểễ]/g, "e")
      .replace(/[ìíịỉĩ]/g, "i")
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
      .replace(/[ùúụủũưừứựửữ]/g, "u")
      .replace(/[ỳýỵỷỹ]/g, "y")
      .replace(/đ/g, "d")
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const processImage = async (asset: AssetItem, index: number, zip: JSZip): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return reject('No canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No ctx');

        let targetW = PRESET_SIZES[asset.presetIndex].width;
        let targetH = PRESET_SIZES[asset.presetIndex].height;

        // Custom or Original
        if (asset.presetIndex === 0) {
          targetW = img.width;
          targetH = img.height;
        }

        canvas.width = targetW;
        canvas.height = targetH;

        const imgRatio = img.width / img.height;
        const targetRatio = targetW / targetH;

        if (asset.presetIndex === 0) {
          // Just draw original
          ctx.drawImage(img, 0, 0, targetW, targetH);
        } else {
          if (asset.fitMode === 'cover') {
            // Cắt xén
            let drawW = targetW;
            let drawH = targetH;
            let offsetX = 0;
            let offsetY = 0;

            if (imgRatio > targetRatio) {
              drawW = img.height * targetRatio;
              offsetX = (img.width - drawW) / 2;
              ctx.drawImage(img, offsetX, 0, drawW, img.height, 0, 0, targetW, targetH);
            } else {
              drawH = img.width / targetRatio;
              offsetY = (img.height - drawH) / 2;
              ctx.drawImage(img, 0, offsetY, img.width, drawH, 0, 0, targetW, targetH);
            }
          } else {
            // Contain (Bù viền)
            let drawW = targetW;
            let drawH = targetH;
            let offsetX = 0;
            let offsetY = 0;

            if (imgRatio > targetRatio) {
              drawH = targetW / imgRatio;
              offsetY = (targetH - drawH) / 2;
            } else {
              drawW = targetH * imgRatio;
              offsetX = (targetW - drawW) / 2;
            }

            // Draw Background
            if (asset.fitMode === 'blur') {
              // Draw scaled up background with blur
              let bgW = targetW;
              let bgH = targetH;
              let bgOffsetX = 0;
              let bgOffsetY = 0;

              if (imgRatio > targetRatio) {
                bgW = targetH * imgRatio;
                bgOffsetX = (targetW - bgW) / 2;
              } else {
                bgH = targetW / imgRatio;
                bgOffsetY = (targetH - bgH) / 2;
              }

              ctx.filter = 'blur(30px)';
              ctx.drawImage(img, bgOffsetX, bgOffsetY, bgW, bgH);
              ctx.filter = 'none';
              
              // Darken overlay
              ctx.fillStyle = 'rgba(0,0,0,0.3)';
              ctx.fillRect(0, 0, targetW, targetH);
            } else if (asset.fitMode === 'color') {
              let appliedColor = asset.padColor;
              
              if (asset.autoColor) {
                // Auto edge color detection: Sample top-left corner
                ctx.drawImage(img, 0, 0, 1, 1);
                const p = ctx.getImageData(0, 0, 1, 1).data;
                appliedColor = `rgba(${p[0]}, ${p[1]}, ${p[2]}, ${p[3] / 255})`;
                ctx.clearRect(0, 0, targetW, targetH); // clear
              }

              ctx.fillStyle = appliedColor;
              ctx.fillRect(0, 0, targetW, targetH);
            }

            // Draw foreground image
            ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
          }
        }

        // Export to Blob
        const mimeType = `image/${asset.format}`;
        const q = asset.quality / 100;
        
        canvas.toBlob((blob) => {
          if (blob) {
            const safeName = slugify(asset.baseName) || 'asset';
            const num = (index + 1).toString().padStart(2, '0');
            const ext = asset.format === 'jpeg' ? 'jpg' : asset.format;
            const fileName = `${safeName}-${num}.${ext}`;
            
            zip.file(fileName, blob);
            resolve();
          } else {
            reject('Blob failed');
          }
        }, mimeType, q);
      };
      
      img.onerror = () => reject('Image load error');
      img.src = asset.previewUrl;
    });
  };

  const handleProcessAndDownload = async () => {
    const selectedAssets = assets.filter(a => a.selected);
    if (selectedAssets.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    const zip = new JSZip();

    for (let i = 0; i < selectedAssets.length; i++) {
      const asset = selectedAssets[i];
      try {
        setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, status: 'processing' } : a));
        await processImage(asset, i, zip);
        setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, status: 'done' } : a));
      } catch (err) {
        console.error(err);
        setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, status: 'error' } : a));
      }
      setProgress(Math.round(((i + 1) / selectedAssets.length) * 100));
    }

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assets_packaged_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP Error", err);
      alert("Đã xảy ra lỗi khi tạo file ZIP");
    }

    setIsProcessing(false);
  };

  const selectedCount = assets.filter(a => a.selected).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link href="/utility-hub" className="hover:text-cyan-600 transition-colors">Utility Hub</Link>
            <ChevronRight size={16} />
            <span className="text-gray-900 font-medium">Asset Packager</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600">
                  <Archive size={24} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Asset Packager</h1>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl">
                Tự động hóa toàn diện. Chọn từng ảnh để áp dụng cấu hình riêng biệt, tự động nhận diện màu viền, và đóng gói hàng loạt ra file ZIP.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI: Dropzone & Files (7/12) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Dropzone */}
            <div 
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer
                ${isDragging ? 'border-cyan-500 bg-cyan-50' : 'border-gray-300 bg-white hover:border-cyan-400 hover:bg-gray-50'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                id="file-upload" type="file" multiple accept="image/*" className="hidden"
                onChange={handleFileInput}
              />
              <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kéo thả ảnh vào đây</h3>
              <p className="text-gray-500 text-sm">Hỗ trợ JPG, PNG, WebP. Chọn từng ảnh để áp dụng cấu hình riêng.</p>
            </div>

            {/* File List */}
            {assets.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <h3 className="font-semibold text-gray-700 flex items-center">
                      <FileImage size={18} className="mr-2" />
                      Danh sách Ảnh ({assets.length})
                    </h3>
                    <button 
                      onClick={() => {
                        const allSelected = assets.every(a => a.selected);
                        setAssets(prev => prev.map(a => ({ ...a, selected: !allSelected })));
                      }}
                      className="text-sm font-medium text-cyan-600 hover:text-cyan-700"
                    >
                      {assets.every(a => a.selected) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setAssets([])}
                    className="text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    Xóa tất cả
                  </button>
                </div>
                
                <div className="p-3 max-h-[500px] overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {assets.map((asset, i) => (
                      <div 
                        key={asset.id} 
                        onClick={() => toggleSelectAsset(asset.id)}
                        className={`relative group rounded-xl border-2 overflow-hidden aspect-square cursor-pointer transition-all
                          ${asset.selected ? 'border-cyan-500 shadow-md' : 'border-transparent hover:border-gray-300 opacity-60 hover:opacity-100'}`}
                      >
                        <img src={asset.previewUrl} alt="preview" className="w-full h-full object-cover bg-gray-100" />
                        
                        {/* Checkbox indicator */}
                        <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                          ${asset.selected ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-white/70 bg-black/20'}`}>
                          {asset.selected && <CheckCircle2 size={16} />}
                        </div>
                        
                        {/* Status Overlay */}
                        {asset.status !== 'pending' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                            {asset.status === 'processing' && <Loader2 className="animate-spin text-white" size={24} />}
                            {asset.status === 'done' && <CheckCircle2 className="text-green-400" size={32} />}
                          </div>
                        )}

                        {/* Delete Button */}
                        {asset.status === 'pending' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}

                        {/* Mini tag showing config */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                          <p className="text-white text-[10px] font-medium truncate">
                            {asset.format.toUpperCase()} • {asset.fitMode}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: Configuration (5/12) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative">
              
              {/* Overlay if nothing selected */}
              {selectedCount === 0 && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-center p-6">
                  <MousePointer2 className="text-gray-400 mb-3" size={32} />
                  <h4 className="text-gray-900 font-semibold mb-1">Chưa chọn ảnh nào</h4>
                  <p className="text-gray-500 text-sm">Tick chọn các ảnh bên trái để áp dụng cấu hình này.</p>
                </div>
              )}

              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Settings size={20} className="mr-2 text-cyan-600" />
                  Cấu hình Đóng gói
                </h3>
                <span className="text-sm font-medium bg-cyan-100 text-cyan-700 px-2 py-1 rounded-md">
                  Đang sửa: {selectedCount} ảnh
                </span>
              </div>
              
              <div className="space-y-6">
                
                {/* 1. Tên File */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Công thức Tên File (SEO-friendly)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value={uiBaseName}
                      onChange={(e) => {
                        setUiBaseName(e.target.value);
                        updateSelectedAssets('baseName', e.target.value);
                      }}
                      placeholder="VD: bai-giang-stem"
                      className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-cyan-500 text-sm"
                    />
                    <span className="text-gray-500 font-mono text-sm">-01.{uiFormat}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">Áp dụng cho tất cả ảnh đang được tích chọn.</p>
                </div>

                <div className="border-t border-gray-100"></div>

                {/* 2. Kích thước */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kích thước chuẩn (Resize)
                  </label>
                  <select 
                    value={uiPresetIndex}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setUiPresetIndex(val);
                      updateSelectedAssets('presetIndex', val);
                    }}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-cyan-500 text-sm mb-3"
                  >
                    {PRESET_SIZES.map((s, i) => (
                      <option key={i} value={i}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Thuật toán Fit (chỉ hiện khi resize) */}
                {uiPresetIndex !== 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thuật toán Bù lấp (Smart Fitting)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => { setUiFitMode('blur'); updateSelectedAssets('fitMode', 'blur'); }}
                        className={`px-3 py-2 border rounded-lg text-xs font-medium text-center ${uiFitMode === 'blur' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        Bù viền mờ (Blur)
                      </button>
                      <button 
                        onClick={() => { setUiFitMode('color'); updateSelectedAssets('fitMode', 'color'); }}
                        className={`px-3 py-2 border rounded-lg text-xs font-medium text-center ${uiFitMode === 'color' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        Bù nền màu
                      </button>
                      <button 
                        onClick={() => { setUiFitMode('cover'); updateSelectedAssets('fitMode', 'cover'); }}
                        className={`px-3 py-2 border rounded-lg text-xs font-medium text-center ${uiFitMode === 'cover' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        Cắt xén (Crop)
                      </button>
                    </div>

                    {uiFitMode === 'color' && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={uiAutoColor}
                            onChange={(e) => {
                              setUiAutoColor(e.target.checked);
                              updateSelectedAssets('autoColor', e.target.checked);
                            }}
                            className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                          />
                          <span className="text-sm font-medium text-gray-900">Tự động nhận diện màu viền ảnh</span>
                        </label>
                        
                        {!uiAutoColor && (
                          <div className="flex items-center space-x-3 pt-2 border-t border-gray-200">
                            <input 
                              type="color" 
                              value={uiPadColor}
                              onChange={(e) => {
                                setUiPadColor(e.target.value);
                                updateSelectedAssets('padColor', e.target.value);
                              }}
                              className="w-8 h-8 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-600">Hoặc chọn màu thủ công</span>
                          </div>
                        )}
                        
                        {uiAutoColor && (
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Máy sẽ tự động dùng "ống hút" lấy màu tại <b>điểm góc (0,0)</b> của bức ảnh để đổ màu nền. Đảm bảo tông xuyệt tông 100%!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-100"></div>

                {/* 4. Định dạng */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Định dạng & Nén
                  </label>
                  <div className="flex space-x-2 mb-3">
                    {['webp', 'jpeg', 'png'].map(f => (
                      <button 
                        key={f}
                        onClick={() => {
                          setUiFormat(f as any);
                          updateSelectedAssets('format', f);
                        }}
                        className={`flex-1 py-2 border rounded-lg text-sm font-medium ${uiFormat === f ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm text-gray-600 mb-1">
                    Chất lượng (Quality): {uiQuality}%
                  </label>
                  <input 
                    type="range" min="10" max="100" step="5" 
                    value={uiQuality} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setUiQuality(val);
                      updateSelectedAssets('quality', val);
                    }}
                    className="w-full accent-cyan-600"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleProcessAndDownload}
              disabled={selectedCount === 0 || isProcessing}
              className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-2 font-bold text-lg shadow-lg transition-all
                ${selectedCount === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-cyan-600 text-white hover:bg-cyan-700 active:scale-95'}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Đang xử lý {selectedCount} ảnh... {progress}%</span>
                </>
              ) : (
                <>
                  <Download size={24} />
                  <span>Xử lý & Tải về ZIP ({selectedCount})</span>
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
