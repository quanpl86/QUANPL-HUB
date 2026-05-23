import React, { useState, useCallback, useEffect } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { CyberButton } from '../../ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crop as CropIcon, ZoomIn, ZoomOut } from 'lucide-react';

export const ImageCropModal = ({
  isOpen, src, onConfirm, onCancel
}: {
  isOpen: boolean; src: string; onConfirm: (blob: Blob) => void; onCancel: () => void;
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [isOpen]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || !src) {
      onCancel();
      return;
    }
    setIsProcessing(true);

    try {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = src;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('No 2d context');

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.toBlob((blob) => {
        setIsProcessing(false);
        if (blob) onConfirm(blob);
      }, 'image/jpeg', 0.95);
    } catch (e) {
      setIsProcessing(false);
      console.error(e);
      onCancel();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl h-[85vh] flex flex-col bg-cyber-black border border-brand-orange/30 shadow-[0_0_50px_rgba(255,87,34,0.15)] overflow-hidden"
          >
            <div className="bg-brand-orange/10 px-4 py-2 border-b border-brand-orange/20 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-brand-orange">
                <CropIcon size={14} />
                <span className="font-orbitron text-[10px] font-bold tracking-[0.2em] uppercase">CROP HÌNH ẢNH CAO CẤP</span>
              </div>
              <button onClick={onCancel} className="text-muted-foreground hover:text-brand-orange transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="relative flex-grow bg-black/50 overflow-hidden">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={undefined}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                classes={{ containerClassName: "absolute inset-0" }}
              />
            </div>

            <div className="p-4 border-t border-brand-orange/20 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 bg-cyber-black">
              {/* Zoom Controls */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <ZoomOut size={16} className="text-muted-foreground" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full sm:w-48 h-1 bg-brand-orange/20 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                />
                <ZoomIn size={16} className="text-muted-foreground" />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button 
                  type="button" 
                  onClick={onCancel}
                  disabled={isProcessing}
                  className="px-6 py-2 font-mono text-[10px] text-red-500/80 hover:text-red-700 uppercase tracking-widest transition-colors font-bold border border-transparent hover:border-red-500/20 disabled:opacity-50"
                >
                  [ HỦY BỎ ]
                </button>
                <CyberButton 
                  type="button" 
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  variant="primary" 
                  className="px-8 h-10 text-[10px]"
                >
                  {isProcessing ? 'ĐANG XỬ LÝ...' : 'LƯU HÌNH ẢNH'}
                </CyberButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
