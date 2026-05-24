'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sliders, Download, RefreshCw, Layers as LayersIcon, Eye, EyeOff, FlipHorizontal, FileDown } from 'lucide-react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Center } from '@react-three/drei';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

export default function ImageTo3DRelief() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [svgString, setSvgString] = useState<string | null>(null);
  
  // Layer Management
  const [colorLayers, setColorLayers] = useState<{ color: string, hex: string, visible: boolean }[]>([]);
  
  // Settings
  const [baseDepth, setBaseDepth] = useState<number>(1.5);
  const [extrusionDepth, setExtrusionDepth] = useState<number>(2.0);
  const [colorsCount, setColorsCount] = useState<number>(8);
  const [simplify, setSimplify] = useState<number>(0.2);
  const [isMirrored, setIsMirrored] = useState<boolean>(true); // Default true for stamp making

  // Scene references
  const groupRef = useRef<THREE.Group>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setSvgString(null);
      setColorLayers([]);
    }
  };

  const processImage = async () => {
    if (!imageUrl) return;
    setIsProcessing(true);
    
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

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
      
      // Tô nền trắng để xử lý lỗi ảnh PNG trong suốt bị thuật toán hiểu nhầm là màu đen (rgb 0 0 0)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      // Lật ngược hình ảnh TRƯỚC KHI trace màu nếu tùy chọn Mirror đang bật.
      // Giải pháp này giúp bóc tách mã SVG ngược hoàn hảo ngay từ đầu, 
      // tránh hoàn toàn lỗi đảo vector pháp tuyến (normals) khi xuất file STL.
      if (isMirrored) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);

      setTimeout(async () => {
        try {
          const ImageTracer = (await import('imagetracerjs')).default || await import('imagetracerjs');
          
          const options = {
            colorquantcycles: 15,
            numberofcolors: colorsCount,
            mincolorratio: 0,
            strokewidth: 0,
            viewbox: true,
            scale: 1,
            ltres: simplify,
            qtres: simplify,
            pathomit: 0
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

  // Parse SVG to extract unique color layers
  useEffect(() => {
    if (svgString) {
      try {
        const loader = new SVGLoader();
        const svgData = loader.parse(svgString);
        const uniqueColors = new Map<string, string>();
        
        svgData.paths.forEach(p => {
          const hex = '#' + p.color.getHexString().toUpperCase();
          uniqueColors.set(hex, p.color.getStyle());
        });
        
        const layers = Array.from(uniqueColors.entries()).map(([hex, style]) => ({
          hex,
          color: style,
          visible: true
        }));
        
        setColorLayers(layers);
      } catch (err) {
        console.error("Error parsing SVG for layers", err);
      }
    } else {
      setColorLayers([]);
    }
  }, [svgString]);

  const toggleLayer = (hex: string) => {
    setColorLayers(prev => prev.map(l => l.hex === hex ? { ...l, visible: !l.visible } : l));
  };

  const toggleAllLayers = (visible: boolean) => {
    setColorLayers(prev => prev.map(l => ({ ...l, visible })));
  };

  const downloadBlob = (stlString: string, filename: string) => {
    const blob = new Blob([stlString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCurrentView = () => {
    if (!sceneRef.current) return;
    const exporter = new STLExporter();
    const stlString = exporter.parse(sceneRef.current);
    downloadBlob(stlString, 'khuon_in_hien_tai.stl');
  };

  const exportAllLayers = async () => {
    if (!sceneRef.current) return;
    const exporter = new STLExporter();
    
    // Save current state
    const originalVisibility = new Map();
    colorLayers.forEach(l => originalVisibility.set(l.hex, l.visible));

    alert("Hệ thống sẽ tải xuống từng file STL. Vui lòng cho phép trình duyệt tải nhiều file (Multiple Downloads) nếu có hộp thoại hiện lên.");

    // Loop through each layer, isolate it, and export
    for (let i = 0; i < colorLayers.length; i++) {
      const layer = colorLayers[i];
      // Isolate
      setColorLayers(prev => prev.map(l => ({ ...l, visible: l.hex === layer.hex })));
      
      // Wait for React to re-render the 3D scene with the new visibility
      await new Promise(r => setTimeout(r, 150)); 
      
      const stlString = exporter.parse(sceneRef.current);
      downloadBlob(stlString, `khuon_${layer.hex.replace('#','')}.stl`);
    }

    // Restore original visibility
    setColorLayers(prev => prev.map(l => ({ ...l, visible: originalVisibility.get(l.hex) ?? true })));
  };

  return (
    <div className="grid lg:grid-cols-[350px_1fr] gap-6 items-start">
      
      {/* Controls Sidebar */}
      <div className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-6 space-y-8 h-full max-h-[800px] overflow-y-auto custom-scrollbar">
        
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
                  onClick={() => { setImageUrl(null); setSvgString(null); setColorLayers([]); }}
                  className="flex-1 py-2 text-xs font-bold bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors"
                >
                  Xóa ảnh
                </button>
                <button 
                  onClick={processImage}
                  disabled={isProcessing}
                  className="flex-[2] py-2 text-xs font-bold bg-brand-orange text-white hover:bg-brand-orange/90 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <LayersIcon size={14} />}
                  Tạo mặt nổi 3D
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Layers Section */}
        {colorLayers.length > 0 && (
          <section className="pt-6 border-t border-foreground/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/50 flex items-center gap-2">
                <LayersIcon size={16} /> Mảng Màu (Khuôn)
              </h3>
              <div className="flex gap-2">
                <button onClick={() => toggleAllLayers(true)} className="text-[10px] bg-foreground/5 px-2 py-1 rounded hover:bg-foreground/10">Bật hết</button>
                <button onClick={() => toggleAllLayers(false)} className="text-[10px] bg-foreground/5 px-2 py-1 rounded hover:bg-foreground/10">Tắt hết</button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {colorLayers.map((layer, idx) => (
                <div key={layer.hex} className="flex items-center justify-between p-2 rounded-lg bg-background border border-foreground/5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md shadow-inner border border-foreground/10" style={{ backgroundColor: layer.color }}></div>
                    <span className="text-xs font-mono text-foreground/70">{layer.hex}</span>
                  </div>
                  <button 
                    onClick={() => toggleLayer(layer.hex)}
                    className={`p-1.5 rounded-md transition-colors ${layer.visible ? 'text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/20' : 'text-foreground/40 bg-foreground/5 hover:bg-foreground/10'}`}
                  >
                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Parameters Section */}
        <section className={colorLayers.length > 0 ? "pt-6 border-t border-foreground/10" : ""}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/50 mb-4 flex items-center gap-2">
            <Sliders size={16} /> Thông số đùn khối
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-orange/5 border border-brand-orange/20">
              <div className="flex items-center gap-2">
                <FlipHorizontal size={18} className="text-brand-orange" />
                <span className="text-sm font-bold text-brand-orange">Lật ngược khuôn (Mirror)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isMirrored} onChange={(e) => setIsMirrored(e.target.checked)} />
                <div className="w-9 h-5 bg-foreground/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-orange"></div>
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/80 font-medium">Độ dày đế khuôn (Base)</span>
                <span className="text-brand-orange font-bold">{baseDepth} mm</span>
              </div>
              <input 
                type="range" 
                min="0.5" max="5" step="0.5" 
                value={baseDepth} 
                onChange={(e) => setBaseDepth(parseFloat(e.target.value))}
                className="w-full accent-brand-orange"
              />
              <p className="text-[10px] text-foreground/50 mt-1">Đế được tính toán bao trọn ảnh để dễ canh lề (Registration) khi in.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/80 font-medium">Độ nổi chi tiết (Relief)</span>
                <span className="text-brand-orange font-bold">{extrusionDepth} mm</span>
              </div>
              <input 
                type="range" 
                min="0.5" max="50" step="0.5" 
                value={extrusionDepth} 
                onChange={(e) => setExtrusionDepth(parseFloat(e.target.value))}
                className="w-full accent-brand-orange"
              />
            </div>

            <div className="space-y-2 pt-4 border-t border-foreground/10">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/80 font-medium">Giới hạn số màu (Palette)</span>
                <span className="text-foreground font-bold">{colorsCount}</span>
              </div>
              <input 
                type="range" 
                min="2" max="32" step="1" 
                value={colorsCount} 
                onChange={(e) => setColorsCount(parseInt(e.target.value))}
                className="w-full accent-brand-orange"
              />
              <p className="text-[10px] text-foreground/50 mt-1">Kéo lên cao (8-16) nếu ảnh bị mất các mảng màu nhỏ (như nét viền đen). Sau đó tự ẩn các mảng màu không cần thiết.</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/80 font-medium">Làm mượt nét (Chống răng cưa)</span>
                <span className="text-foreground font-bold">{simplify}</span>
              </div>
              <input 
                type="range" 
                min="0.1" max="1.5" step="0.1" 
                value={simplify} 
                onChange={(e) => setSimplify(parseFloat(e.target.value))}
                className="w-full accent-brand-orange"
              />
              <p className="text-[10px] text-foreground/50 mt-1">Lưu ý: Kéo chỉ số này quá cao sẽ làm đường nét bị biến dạng, cắt chéo vào nhau, dẫn đến việc **TinkerCAD bị rỗng ruột** khi import. Khuyên dùng: 0.1 - 0.5.</p>
            </div>
          </div>
        </section>

      </div>

      {/* 3D Preview Canvas */}
      <div className="h-[700px] rounded-2xl border border-foreground/10 bg-black/5 overflow-hidden relative shadow-inner flex flex-col">
        {isProcessing && (
          <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <RefreshCw className="w-10 h-10 text-brand-orange animate-spin" />
            <p className="font-bold text-lg animate-pulse">Đang tính toán mảng màu & đùn khối...</p>
            <p className="text-sm text-foreground/50">Quá trình này tốn vài giây tùy theo độ phức tạp của ảnh.</p>
          </div>
        )}

        {!svgString && !isProcessing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-foreground/40 pointer-events-none">
            <LayersIcon className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium text-lg">Upload ảnh và bấm "Tạo mặt nổi 3D" để xem trước</p>
          </div>
        )}

        <div className="flex-1 relative">
          <Canvas camera={{ position: [0, 0, 150], fov: 45 }} onCreated={({ scene }) => { sceneRef.current = scene; }}>
            <color attach="background" args={['#f4f4f5']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
            <directionalLight position={[-10, -10, -10]} intensity={0.5} />
            
            <Stage environment="city" intensity={0.5}>
              <Center>
                <group ref={groupRef} rotation={[Math.PI, 0, 0]}>
                  {svgString && <SvgTo3D svgString={svgString} baseDepth={baseDepth} extrusionDepth={extrusionDepth} colorLayers={colorLayers} />}
                </group>
              </Center>
            </Stage>
            
            <OrbitControls makeDefault />
          </Canvas>
        </div>

        {/* Action Bar */}
        {svgString && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-background/90 backdrop-blur-md border-t border-foreground/10 flex items-center justify-between px-6 z-30">
            <div className="text-sm font-medium text-foreground/60">
              Đang hiển thị: <span className="text-foreground font-bold">{colorLayers.filter(l => l.visible).length} / {colorLayers.length}</span> khuôn màu
            </div>
            <div className="flex gap-3">
              <button 
                onClick={exportCurrentView}
                className="flex items-center gap-2 bg-foreground/5 text-foreground px-5 py-2.5 rounded-xl font-bold hover:bg-foreground/10 transition-colors"
              >
                <Download size={16} /> Xuất khuôn đang xem
              </button>
              <button 
                onClick={exportAllLayers}
                className="flex items-center gap-2 bg-brand-orange text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-orange/20 hover:bg-brand-orange/90 hover:scale-105 transition-all"
              >
                <FileDown size={16} /> Xuất TẤT CẢ khuôn (Batch)
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// Sub-component to parse SVG and render ExtrudeGeometries
function SvgTo3D({ 
  svgString, 
  baseDepth, 
  extrusionDepth,
  colorLayers
}: { 
  svgString: string, 
  baseDepth: number, 
  extrusionDepth: number,
  colorLayers: { hex: string, visible: boolean }[]
}) {
  const meshes: React.ReactNode[] = [];
  
  try {
    const loader = new SVGLoader();
    const svgData = loader.parse(svgString);
    
    // Compute total bounding box for a UNIFIED base plate
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

    // We render the extruded meshes per color layer
    const pathsByColor = new Map<string, typeof svgData.paths>();
    svgData.paths.forEach(p => {
      const hex = '#' + p.color.getHexString().toUpperCase();
      if (!pathsByColor.has(hex)) pathsByColor.set(hex, []);
      pathsByColor.get(hex)!.push(p);
    });

    colorLayers.forEach((layer) => {
      if (!layer.visible) return; // Skip if layer is disabled
      
      const layerPaths = pathsByColor.get(layer.hex) || [];
      const layerMeshes: React.ReactNode[] = [];

      // 1. Unified Base Plate (Rendered for EACH visible color layer so it exports with the stamp)
      if (width > 0 && height > 0) {
        const baseShape = new THREE.Shape();
        const margin = Math.max(width, height) * 0.05; // 5% registration margin
        baseShape.moveTo(minX - margin, minY - margin);
        baseShape.lineTo(maxX + margin, minY - margin);
        baseShape.lineTo(maxX + margin, maxY + margin);
        baseShape.lineTo(minX - margin, maxY + margin);
        baseShape.lineTo(minX - margin, minY - margin);

        layerMeshes.push(
          <mesh key={`base-${layer.hex}`} position={[0, 0, 0]}>
            <extrudeGeometry args={[baseShape, { depth: baseDepth, bevelEnabled: false }]} />
            <meshStandardMaterial color="#eeeeee" roughness={0.8} />
          </mesh>
        );
      }

      // 2. Extruded Details
      layerPaths.forEach((path, pathIdx) => {
        const shapes = SVGLoader.createShapes(path);
        shapes.forEach((shape, shapeIdx) => {
          layerMeshes.push(
            <mesh key={`shape-${layer.hex}-${pathIdx}-${shapeIdx}`} position={[0, 0, baseDepth]}>
              <extrudeGeometry 
                args={[
                  shape, 
                  { depth: extrusionDepth > 0.1 ? extrusionDepth : 0.1, bevelEnabled: false }
                ]} 
              />
              <meshStandardMaterial 
                color={path.color} 
                roughness={0.4} 
                metalness={0.1}
                side={THREE.DoubleSide} 
              />
            </mesh>
          );
        });
      });

      // Group meshes for this specific color layer
      meshes.push(
        <group key={`group-${layer.hex}`}>
          {layerMeshes}
        </group>
      );
    });

  } catch (error) {
    console.error("Error parsing SVG string to 3D", error);
  }

  return <>{meshes}</>;
}
