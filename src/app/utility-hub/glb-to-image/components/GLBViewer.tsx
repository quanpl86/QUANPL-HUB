'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Bounds, Center, useGLTF, useBounds } from '@react-three/drei';
import * as THREE from 'three';

export type CameraAngle = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso1' | 'iso2' | 'iso3' | 'iso4';

interface GLBViewerProps {
  fileUrl: string;
  cameraAngle: CameraAngle;
  backgroundColor: string;
}

export interface GLBViewerRef {
  captureImage: (size: number) => Promise<string | null>;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // Clone is not strictly necessary unless rendering same URL multiple times simultaneously, 
  // but just passing scene is fine for a single viewer.
  return <primitive object={scene} />;
}

function CameraController({ angle, fileUrl }: { angle: CameraAngle, fileUrl: string }) {
  const { camera, controls } = useThree();
  const bounds = useBounds();
  
  useEffect(() => {
    if (!controls) return;
    const ctrl = controls as any;
    

    // Yêu cầu tính toán lại bounding box
    bounds.refresh();
    const { center, distance: camDist } = bounds.getSize();
    
    // Tự code logic fit() để không bị phụ thuộc vào tự động hoá của thư viện
    // Vector chỉ hướng cho các góc (đã chuẩn hoá)
    const positions: Record<CameraAngle, [number, number, number]> = {
      front: [0, 0, -1],
      back: [0, 0, 1],
      left: [1, 0, 0],
      right: [-1, 0, 0],
      top: [0, 1, 0],
      bottom: [0, -1, 0],
      iso1: [-1, 0.8, -1],
      iso2: [1, 0.8, -1],
      iso3: [-1, 0.8, 1],
      iso4: [1, 0.8, 1],
    };

    const dir = new THREE.Vector3(...positions[angle]).normalize();
    
    // Đặt camera ở khoảng cách an toàn (margin = 1.1)
    camera.position.copy(center).add(dir.multiplyScalar(camDist * 1.1));
    ctrl.target.copy(center);
    camera.lookAt(center);
    
    // Áp dụng bù trừ quang học (Visual Weight Offset)
    let shiftX = 0;
    let shiftY = 0;
    const offsetMagX = 0.05; // Giảm nhẹ xuống 5% theo yêu cầu
    const offsetMagY = 0.04; // Giảm nhẹ xuống 4%

    // QUY TẮC TỊNH TIẾN CAMERA (NGƯỢC VỚI HƯỚNG HIỂN THỊ CỦA MODEL):
    // Muốn model sang PHẢI -> Di chuyển camera sang TRÁI (-X)
    // Muốn model lên TRÊN -> Di chuyển camera xuống DƯỚI (-Y)
    switch (angle) {
      case 'iso1': // Ép model LÊN TRÊN và SANG PHẢI => Cam DƯỚI (-Y) và TRÁI (-X)
        shiftX = -offsetMagX * camDist;
        shiftY = -offsetMagY * camDist;
        break;
      case 'iso2': // Ép model LÊN TRÊN và SANG TRÁI => Cam DƯỚI (-Y) và PHẢI (+X)
        shiftX = offsetMagX * camDist;
        shiftY = -offsetMagY * camDist;
        break;
      case 'iso3': // Ép model XUỐNG DƯỚI và SANG PHẢI => Cam TRÊN (+Y) và TRÁI (-X)
        shiftX = -offsetMagX * camDist;
        shiftY = offsetMagY * camDist;
        break;
      case 'iso4': // Ép model XUỐNG DƯỚI và SANG TRÁI => Cam TRÊN (+Y) và PHẢI (+X)
        shiftX = offsetMagX * camDist;
        shiftY = offsetMagY * camDist;
        break;
      default:
        break;
    }
    
    // Lưu vị trí cũ
    const oldPos = camera.position.clone();
    
    // Dịch camera
    camera.translateX(shiftX);
    camera.translateY(shiftY);
    
    // Áp dụng dịch chuyển cho target
    const diff = camera.position.clone().sub(oldPos);
    ctrl.target.add(diff);
    ctrl.update();
    
  }, [angle, camera, controls, bounds, fileUrl]);

  return null;
}

const GLBViewer = forwardRef<GLBViewerRef, GLBViewerProps>(({ fileUrl, cameraAngle, backgroundColor }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    captureImage: async (size: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = size;
      tempCanvas.height = size;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return null;
      
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, size, size);
      }
      
      // Source canvas may not be exactly the same square size due to responsive layout,
      // but assuming the container is square, it will map 1:1 nicely.
      // If the container is not square, this will stretch it. We should ensure the container is square.
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, size, size);
      
      return tempCanvas.toDataURL('image/png');
    }
  }));

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor }}>
      <Canvas 
        ref={canvasRef}
        gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
        camera={{ position: [5, 5, 5], fov: 45 }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <Environment preset="city" />
        
        <React.Suspense fallback={null}>
          <Bounds margin={1.0}>
            <Model url={fileUrl} />
            <CameraController angle={cameraAngle} fileUrl={fileUrl} />
          </Bounds>
        </React.Suspense>
        
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
});

GLBViewer.displayName = 'GLBViewer';

export default GLBViewer;
