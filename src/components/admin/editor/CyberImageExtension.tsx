import { NodeViewWrapper, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import React, { useCallback, useRef, useState } from 'react';

const ImageNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  
  const handleMouseDown = useCallback((e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = imageRef.current?.offsetWidth || 0;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const diff = currentX - startX;
      const newWidth = corner.includes('right') ? startWidth + diff : startWidth - diff;
      updateAttributes({ width: Math.max(50, newWidth) });
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [updateAttributes]);

  return (
    <NodeViewWrapper 
      className={`relative group cyber-image-node clear-both inline-block max-w-full`}
      style={{ 
        display: node.attrs.align === 'center' ? 'block' : 'inline-block',
        float: node.attrs.align === 'left' ? 'left' : node.attrs.align === 'right' ? 'right' : 'none',
        margin: node.attrs.align === 'center' ? '1rem auto' : '1rem 0',
      }}
    >
      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt}
        title={node.attrs.title}
        className={`w-auto h-auto max-w-full shadow-lg ${node.attrs.shape === 'circle' ? 'rounded-full aspect-square object-cover' : node.attrs.shape === 'rounded' ? 'rounded-2xl' : ''}`}
        style={{ width: node.attrs.width ? `${node.attrs.width}px` : 'auto' }}
      />
      
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-brand-orange/50 transition-colors pointer-events-none z-10" />
      
      {/* Handles */}
      <div className="absolute top-0 left-0 w-3 h-3 bg-brand-orange border border-white cursor-nwse-resize opacity-0 group-hover:opacity-100 z-20" onMouseDown={e => handleMouseDown(e, 'top-left')} />
      <div className="absolute top-0 right-0 w-3 h-3 bg-brand-orange border border-white cursor-nesw-resize opacity-0 group-hover:opacity-100 z-20" onMouseDown={e => handleMouseDown(e, 'top-right')} />
      <div className="absolute bottom-0 left-0 w-3 h-3 bg-brand-orange border border-white cursor-nesw-resize opacity-0 group-hover:opacity-100 z-20" onMouseDown={e => handleMouseDown(e, 'bottom-left')} />
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-orange border border-white cursor-nwse-resize opacity-0 group-hover:opacity-100 z-20" onMouseDown={e => handleMouseDown(e, 'bottom-right')} />
    </NodeViewWrapper>
  );
};

export const CyberImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      align: { default: 'center' },
      shape: { default: 'default' },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
