import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { CyberButton } from '../../ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crop as CropIcon } from 'lucide-react';

export const ImageCropModal = ({
  isOpen, src, onConfirm, onCancel
}: {
  isOpen: boolean; src: string; onConfirm: (blob: Blob) => void; onCancel: () => void;
}) => {
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCrop({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
      setCompletedCrop(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) {
      onCancel();
      return;
    }
    setIsProcessing(true);
    
    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    // Set actual size in memory (scaled to original resolution)
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      canvas.width, canvas.height
    );

    canvas.toBlob(blob => {
      setIsProcessing(false);
      if (blob) onConfirm(blob);
    }, 'image/jpeg', 0.95);
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
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-cyber-black border border-brand-orange/30 shadow-[0_0_50px_rgba(255,87,34,0.15)] overflow-hidden"
          >
            <div className="bg-brand-orange/10 px-4 py-2 border-b border-brand-orange/20 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-brand-orange">
                <CropIcon size={14} />
                <span className="font-orbitron text-[10px] font-bold tracking-[0.2em] uppercase">CROP HÌNH ẢNH</span>
              </div>
              <button onClick={onCancel} className="text-muted-foreground hover:text-brand-orange transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-auto flex-grow flex justify-center bg-black/50">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
              >
                <img
                  ref={imgRef}
                  src={src}
                  alt="Crop preview"
                  crossOrigin="anonymous"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </ReactCrop>
            </div>

            <div className="p-4 border-t border-brand-orange/20 flex justify-end gap-3 shrink-0 bg-cyber-black">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
