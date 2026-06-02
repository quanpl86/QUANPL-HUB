'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Bounds, useBounds } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export type CameraAngle = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso1' | 'iso2' | 'iso3' | 'iso4';

interface GLBViewerProps {
  fileUrl: string;
  assetUrls?: Record<string, string>;
  cameraAngle: CameraAngle;
  backgroundColor: string;
}

export interface GLBViewerRef {
  captureImage: (size: number) => Promise<string | null>;
}

function normalizeAssetPath(path: string) {
  return decodeURIComponent(path)
    .split(/[?#]/)[0]
    .replace(/^\.?\//, '')
    .replace(/\\/g, '/');
}

function Model({ url, assetUrls = {} }: { url: string; assetUrls?: Record<string, string> }) {
  const [scene, setScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let cancelled = false;
    const manager = new THREE.LoadingManager();

    manager.setURLModifier((requestedUrl) => {
      const cleanUrl = normalizeAssetPath(requestedUrl);
      const fileName = cleanUrl.split('/').pop() || cleanUrl;
      return assetUrls[cleanUrl] || assetUrls[fileName] || requestedUrl;
    });

    const loader = new GLTFLoader(manager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/vendor/draco/gltf/');
    dracoLoader.setDecoderConfig({ type: 'wasm' });
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      url,
      (gltf) => {
        if (!cancelled) setScene(gltf.scene);
      },
      undefined,
      (error) => {
        console.error('GLB thumbnail loader error:', error);
        if (!cancelled) setScene(null);
      }
    );

    return () => {
      cancelled = true;
      dracoLoader.dispose();
      setScene(null);
    };
  }, [url, assetUrls]);

  if (!scene) return null;

  return <primitive object={scene} />;
}

type CustomCameraState = {
  direction: THREE.Vector3;
  distanceRatio: number;
  targetOffsetRatio: THREE.Vector3;
};

type MinimalOrbitControls = {
  target: THREE.Vector3;
  update: () => void;
  addEventListener: (type: 'end', listener: () => void) => void;
  removeEventListener: (type: 'end', listener: () => void) => void;
};

function CameraController({ angle, fileUrl }: { angle: CameraAngle, fileUrl: string }) {
  const { camera, controls } = useThree();
  const bounds = useBounds();
  
  const customStateRef = useRef<CustomCameraState | null>(null);
  const prevAngleRef = useRef<CameraAngle>(angle);

  // 1. Reset custom state nếu user chọn góc quay mới từ dropdown
  useEffect(() => {
    if (prevAngleRef.current !== angle) {
      customStateRef.current = null;
      prevAngleRef.current = angle;
    }
  }, [angle]);

  // 2. Lắng nghe hành vi xoay thủ công của user để lưu lại Custom State
  useEffect(() => {
    if (!controls) return;
    const ctrl = controls as unknown as MinimalOrbitControls;
    
    const handleEnd = () => {
      bounds.refresh();
      const { center, box } = bounds.getSize();
      
      // Tính toán khoảng cách chuẩn (baseDist) bằng Bounding Sphere
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      if (sphere.radius === 0) return;
      
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      const baseDist = sphere.radius / Math.sin(fov / 2);
      
      // Tính toán toạ độ tương đối dựa trên baseDist
      const direction = new THREE.Vector3().subVectors(camera.position, ctrl.target).normalize();
      const distanceRatio = camera.position.distanceTo(ctrl.target) / baseDist;
      const targetOffsetRatio = new THREE.Vector3().subVectors(ctrl.target, center).divideScalar(baseDist);
      
      customStateRef.current = { direction, distanceRatio, targetOffsetRatio };
    };

    ctrl.addEventListener('end', handleEnd);
    return () => {
      ctrl.removeEventListener('end', handleEnd);
    };
  }, [camera, controls, bounds]);
  
  // 3. Thực thi việc xếp đặt vị trí camera khi đổi file hoặc đổi góc
  useEffect(() => {
    if (!controls) return;
    const ctrl = controls as unknown as MinimalOrbitControls;
    
    // Yêu cầu tính toán lại bounding box
    bounds.refresh();
    const { center, box } = bounds.getSize();
    
    // Tính khoảng cách baseDist chuẩn xác bao trọn 100% bằng hình cầu
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const baseDist = sphere.radius / Math.sin(fov / 2);
    
    if (customStateRef.current) {
      // TRƯỜNG HỢP A: Tồn tại góc nhìn xoay thủ công -> Giải mã và áp dụng
      const { direction, distanceRatio, targetOffsetRatio } = customStateRef.current;
      
      const absoluteTargetOffset = targetOffsetRatio.clone().multiplyScalar(baseDist);
      const newTarget = center.clone().add(absoluteTargetOffset);
      const newCameraPos = newTarget.clone().add(direction.clone().multiplyScalar(baseDist * distanceRatio));
      
      camera.position.copy(newCameraPos);
      ctrl.target.copy(newTarget);
      camera.lookAt(newTarget);
      ctrl.update();
      
    } else {
      // TRƯỜNG HỢP B: Góc toán học tự động mặc định
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
      
      // Khoảng cách an toàn (margin = 1.3 đối với bounding sphere là rất dư dả)
      const safeDist = baseDist * 1.3;
      camera.position.copy(center).add(dir.multiplyScalar(safeDist));
      ctrl.target.copy(center);
      camera.lookAt(center);
      
      // Áp dụng bù trừ quang học (Visual Weight Offset)
      let shiftX = 0;
      let shiftY = 0;
      const offsetMagX = 0.05; // 5%
      const offsetMagY = 0.04; // 4%

      switch (angle) {
        case 'iso1':
          shiftX = -offsetMagX * safeDist;
          shiftY = -offsetMagY * safeDist;
          break;
        case 'iso2':
          shiftX = offsetMagX * safeDist;
          shiftY = -offsetMagY * safeDist;
          break;
        case 'iso3':
          shiftX = -offsetMagX * safeDist;
          shiftY = offsetMagY * safeDist;
          break;
        case 'iso4':
          shiftX = offsetMagX * safeDist;
          shiftY = offsetMagY * safeDist;
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
    }
  }, [angle, camera, controls, bounds, fileUrl]);

  return null;
}

const GLBViewer = forwardRef<GLBViewerRef, GLBViewerProps>(({ fileUrl, assetUrls, cameraAngle, backgroundColor }, ref) => {
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
            <Model url={fileUrl} assetUrls={assetUrls} />
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
