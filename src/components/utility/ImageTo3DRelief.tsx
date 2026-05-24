'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sliders, Download, RefreshCw, Layers } from 'lucide-react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Center } from '@react-three/drei';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

export default function ImageTo3DRelief() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [svgString, setSvgString] = useState<string | null>(null);
  
  // Settings
  const [baseDepth, setBaseDepth] = useState<number>(1.5);
  const [extrusionDepth, setExtrusionDepth] = useState<number>(2.0);
  const [colorsCount, setColorsCount] = useState<number>(4);
  const [simplify, setSimplify] = useState<number>(0.2); // curve optimization

  // Scene references
  const groupRef = useRef<THREE.Group>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setSvgString(null);
    }
  };

  const processImage = async () => {
    if (!imageUrl) return;
    setIsProcessing(true);
    
    try {
      // 1. Load Image into Canvas to get ImageData
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Resize down if too large to prevent freezing
      const MAX_SIZE = 600;
      let width = img.width;
      let height = img.height;
      
      if (width > MAX_SIZE || height > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
        width *= ratio;
        height *= ratio;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context not available");
      
      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);

      // 2. Trace using ImageTracer
      // Run in a small timeout to allow UI to update to "Processing..."
      setTimeout(async () => {
        try {
          // Dynamically import imagetracerjs to avoid SSR issues
          const ImageTracer = (await import('imagetracerjs')).default || await import('imagetracerjs');
          
          const options = {
            colorquantcycles: 3,
            numberofcolors: colorsCount,
            strokewidth: 0,
            viewbox: true,
            scale: 1,
            ltres: simplify,
            qtres: simplify,
            pathomit: 8 // omit very small paths
          };
          
          const svgStr = ImageTracer.imagedataToSVG(imgData, options);
          setSvgString(svgStr);
        } catch (err) {
          console.error("ImageTracer error:", err);
          alert("Lỗi thuật toán xử lý ảnh.");
        } finally {
          setIsProcessing(false);
        }
      }, 50);

    } catch (error) {
      console.error("Error processing image:", error);
      alert("Đã có lỗi xảy ra khi xử lý ảnh. Vui lòng thử ảnh nhỏ hơn.");
      setIsProcessing(false);
    }
  };

  const exportSTL = () => {
    if (!sceneRef.current) return;
    
    // Create an exporter instance
    const exporter = new STLExporter();
    
    // We only want to export the group containing our geometry, not lights/cameras from the Stage
    if (groupRef.current) {
      const stlString = exporter.parse(sceneRef.current); // STLExporter requires Scene or Object3D
      
      const blob = new Blob([stlString], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = 'relief_3d.stl';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
      
      {/* Controls Sidebar */}
      <div className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-6 space-y-8">
        
        {/* Upload Section */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/50 mb-4 flex items-center gap-2">
            <Upload size={16} /> Nhập ảnh
          </h3>
          
          {!imageUrl ? (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-brand-orange/30 rounded-xl cursor-pointer hover:bg-brand-orange/5 hover:border-brand-orange/60 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <Upload className="w-8 h-8 mb-3 text-brand-orange/70" />
                <p className="text-sm text-foreground/80 font-medium">Bấm để tải ảnh lên</p>
                <p className="text-xs text-foreground/50 mt-1">PNG, JPG (Tối ưu nhất với ảnh mảng màu phẳng, logo)</p>
              </div>
              <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageUpload} />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="relative w-full h-40 rounded-xl border border-foreground/10 overflow-hidden bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Uploaded" className="w-full h-full object-contain" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setImageUrl(null); setSvgString(null); }}
                  className="flex-1 py-2 text-xs font-bold bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors"
                >
                  Xóa ảnh
                </button>
                <button 
                  onClick={processImage}
                  disabled={isProcessing}
                  className="flex-[2] py-2 text-xs font-bold bg-brand-orange text-white hover:bg-brand-orange/90 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Layers size={14} />}
                  Tạo mặt nổi 3D
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Parameters Section */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/50 mb-4 flex items-center gap-2">
            <Sliders size={16} /> Thông số đùn khối
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/80 font-medium">Độ dày đế (Base)</span>
                <span className="text-brand-orange font-bold">{baseDepth} mm</span>
              </div>
              <input 
                type="range" 
                min="0.5" max="5" step="0.5" 
                value={baseDepth} 
                onChange={(e) => setBaseDepth(parseFloat(e.target.value))}
                className="w-full accent-brand-orange"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/80 font-medium">Độ nổi tối đa (Relief)</span>
                <span className="text-brand-orange font-bold">{extrusionDepth} mm</span>
              </div>
              <input 
                type="range" 
                min="0.5" max="10" step="0.5" 
                value={extrusionDepth} 
                onChange={(e) => setExtrusionDepth(parseFloat(e.target.value))}
                className="w-full accent-brand-orange"
              />
            </div>

            <div className="space-y-2 pt-4 border-t border-foreground/10">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/80 font-medium">Số lượng màu</span>
                <span className="text-foreground font-bold">{colorsCount}</span>
              </div>
              <input 
                type="range" 
                min="2" max="16" step="1" 
                value={colorsCount} 
                onChange={(e) => setColorsCount(parseInt(e.target.value))}
                className="w-full accent-brand-orange"
              />
              <p className="text-[10px] text-foreground/50 mt-1">Nhiều màu = nhiều lớp nổi. Gây nặng máy.</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/80 font-medium">Làm mượt nét</span>
                <span className="text-foreground font-bold">{simplify}</span>
              </div>
              <input 
                type="range" 
                min="0.1" max="5" step="0.1" 
                value={simplify} 
                onChange={(e) => setSimplify(parseFloat(e.target.value))}
                className="w-full accent-brand-orange"
              />
            </div>
          </div>
        </section>

      </div>

      {/* 3D Preview Canvas */}
      <div className="h-[600px] rounded-2xl border border-foreground/10 bg-black/5 overflow-hidden relative shadow-inner">
        {isProcessing && (
          <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <RefreshCw className="w-10 h-10 text-brand-orange animate-spin" />
            <p className="font-bold text-lg animate-pulse">Đang tính toán vector & đùn khối...</p>
            <p className="text-sm text-foreground/50">Quá trình này tốn vài giây tùy theo độ phức tạp của ảnh.</p>
          </div>
        )}

        {!svgString && !isProcessing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-foreground/40 pointer-events-none">
            <Layers className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium text-lg">Upload ảnh và bấm "Tạo mặt nổi 3D" để xem trước</p>
          </div>
        )}

        <Canvas camera={{ position: [0, 0, 150], fov: 45 }} onCreated={({ scene }) => { sceneRef.current = scene; }}>
          <color attach="background" args={['#f0f0f0']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
          <directionalLight position={[-10, -10, -10]} intensity={0.5} />
          
          <Stage environment="city" intensity={0.5}>
            <Center>
              <group ref={groupRef} rotation={[Math.PI, 0, 0]}>
                {svgString && <SvgTo3D svgString={svgString} baseDepth={baseDepth} extrusionDepth={extrusionDepth} />}
              </group>
            </Center>
          </Stage>
          
          <OrbitControls makeDefault />
        </Canvas>

        {svgString && (
          <div className="absolute bottom-6 right-6 z-20">
            <button 
              onClick={exportSTL}
              className="flex items-center gap-2 bg-brand-orange text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-brand-orange/20 hover:bg-brand-orange/90 hover:scale-105 transition-all"
            >
              <Download size={18} /> Xuất file STL
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

// Sub-component to parse SVG and render ExtrudeGeometries
function SvgTo3D({ svgString, baseDepth, extrusionDepth }: { svgString: string, baseDepth: number, extrusionDepth: number }) {
  const meshes: JSX.Element[] = [];
  
  try {
    const loader = new SVGLoader();
    const svgData = loader.parse(svgString);
    
    // Compute total bounding box to generate a base plate
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    svgData.paths.forEach((path) => {
      const shapes = SVGLoader.createShapes(path);
      shapes.forEach((shape) => {
        shape.getPoints().forEach((p) => {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        });
      });
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const maxSteps = svgData.paths.length;

    // 1. Create Base Plate
    if (width > 0 && height > 0) {
      const baseShape = new THREE.Shape();
      // Add a slight margin (2%)
      const margin = Math.max(width, height) * 0.02;
      baseShape.moveTo(minX - margin, minY - margin);
      baseShape.lineTo(maxX + margin, minY - margin);
      baseShape.lineTo(maxX + margin, maxY + margin);
      baseShape.lineTo(minX - margin, maxY + margin);
      baseShape.lineTo(minX - margin, minY - margin);

      meshes.push(
        <mesh key="base-plate" position={[0, 0, 0]}>
          <extrudeGeometry args={[baseShape, { depth: baseDepth, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2 }]} />
          <meshStandardMaterial color="#cccccc" roughness={0.7} />
        </mesh>
      );
    }

    // 2. Create Extruded Shapes
    svgData.paths.forEach((path, i) => {
      const fillColor = path.color;
      // Calculate depth based on layer index to create a "stepped" relief effect
      // If we only have 1 layer, depth is max. If multiple, we distribute.
      const normalizedDepth = maxSteps > 1 ? (i / (maxSteps - 1)) * extrusionDepth : extrusionDepth;
      // Start extrusion on top of the base plate
      const zOffset = baseDepth;

      // Extract shapes from path
      const shapes = SVGLoader.createShapes(path);
      
      shapes.forEach((shape, j) => {
        meshes.push(
          <mesh key={`shape-${i}-${j}`} position={[0, 0, zOffset]}>
            <extrudeGeometry 
              args={[
                shape, 
                { 
                  depth: normalizedDepth > 0.1 ? normalizedDepth : 0.1, 
                  bevelEnabled: false 
                }
              ]} 
            />
            <meshStandardMaterial 
              color={fillColor} 
              roughness={0.4} 
              metalness={0.1}
              side={THREE.DoubleSide} 
            />
          </mesh>
        );
      });
    });

  } catch (error) {
    console.error("Error parsing SVG string to 3D", error);
  }

  return <>{meshes}</>;
}
