import React, { useState, useEffect, useRef } from 'react';
import CropperJS from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { CyberButton } from '../../ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crop as CropIcon, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export const ImageCropModal = ({
  isOpen, src, onConfirm, onCancel
}: {
  isOpen: boolean; src: string; onConfirm: (blob: Blob) => void; onCancel: () => void;
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropper, setCropper] = useState<CropperJS | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && imageRef.current) {
      const cropperInstance = new CropperJS(imageRef.current, {
        viewMode: 1,
        autoCropArea: 1,
        background: true,
        responsive: true,
        checkOrientation: false,
        minCropBoxHeight: 10,
        minCropBoxWidth: 10,
        guides: true,
      });
      setCropper(cropperInstance);

      return () => {
        cropperInstance.destroy();
        setCropper(null);
      };
    }
  }, [isOpen, src]);

  const handleConfirm = () => {
    if (cropper) {
      setIsProcessing(true);
      const canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
      
      if (!canvas) {
        setIsProcessing(false);
        onCancel();
        return;
      }

      canvas.toBlob((blob: Blob | null) => {
        setIsProcessing(false);
        if (blob) onConfirm(blob);
        else onCancel();
      }, 'image/jpeg', 0.95);
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
            className="relative w-full max-w-5xl h-[90vh] flex flex-col bg-cyber-black border border-brand-orange/30 shadow-[0_0_50px_rgba(255,87,34,0.15)] overflow-hidden"
          >
            <div className="bg-brand-orange/10 px-4 py-3 border-b border-brand-orange/20 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-brand-orange">
                <CropIcon size={16} />
                <span className="font-orbitron text-[12px] font-bold tracking-[0.2em] uppercase">CROP HÌNH ẢNH CHUYÊN NGHIỆP</span>
              </div>
              <button onClick={onCancel} className="text-muted-foreground hover:text-brand-orange transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="relative flex-grow bg-black overflow-hidden p-4 flex items-center justify-center">
              <div className="w-full h-full max-h-full max-w-full">
                <img 
                  ref={imageRef} 
                  src={src} 
                  alt="Crop" 
                  crossOrigin="anonymous" 
                  style={{ display: 'block', maxWidth: '100%' }} 
                />
              </div>
            </div>

            <div className="p-4 border-t border-brand-orange/20 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 bg-cyber-black">
              {/* Controls */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded overflow-hidden">
                  <button type="button" onClick={() => cropper?.zoom(0.1)} className="p-2 hover:bg-brand-orange/20 text-white hover:text-brand-orange transition-colors" title="Phóng to">
                    <ZoomIn size={18} />
                  </button>
                  <div className="w-[1px] h-6 bg-white/10"></div>
                  <button type="button" onClick={() => cropper?.zoom(-0.1)} className="p-2 hover:bg-brand-orange/20 text-white hover:text-brand-orange transition-colors" title="Thu nhỏ">
                    <ZoomOut size={18} />
                  </button>
                </div>
                
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded overflow-hidden">
                  <button type="button" onClick={() => cropper?.rotate(90)} className="p-2 hover:bg-brand-orange/20 text-white hover:text-brand-orange transition-colors" title="Xoay phải 90 độ">
                    <RotateCw size={18} />
                  </button>
                </div>
                
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded overflow-hidden">
                  <button type="button" onClick={() => cropper?.reset()} className="px-3 py-2 hover:bg-brand-orange/20 text-white hover:text-brand-orange transition-colors font-mono text-[10px] uppercase tracking-widest" title="Đặt lại">
                    Reset
                  </button>
                </div>
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
                  className="px-8 h-10 text-[12px]"
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
