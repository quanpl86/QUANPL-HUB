'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Upload, Box, Image as ImageIcon, Download, Loader2, FileArchive, CheckCircle2, AlertCircle, Sparkles, Eye
} from 'lucide-react';
import { WebIO, Document, Node, Texture } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import JSZip from 'jszip';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type ExtractedNode = {
  index: number;
  name: string;
  meshName: string;
  triangleCount: number;
};

type ExtractedTexture = {
  index: number;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
};

export default function GLBSplitterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const [nodes, setNodes] = useState<ExtractedNode[]>([]);
  const [textures, setTextures] = useState<ExtractedTexture[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // THREE.js preview
  const [previewScene, setPreviewScene] = useState<THREE.Group | null>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.glb') || droppedFile.name.endsWith('.gltf'))) {
      loadFile(droppedFile);
    } else {
      setError('Vui lòng chọn file .glb hoặc .gltf');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadFile(e.target.files[0]);
    }
  };

  const loadFile = async (selectedFile: File) => {
    setIsLoading(true);
    setError(null);
    setFile(selectedFile);
    setNodes([]);
    setTextures([]);
    setPreviewScene(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      
      // Khởi tạo WebIO
      const io = new WebIO().registerExtensions(KHRONOS_EXTENSIONS);
      const document = await io.readBinary(new Uint8Array(buffer));
      setDoc(document);

      const root = document.getRoot();
      
      // Trích xuất danh sách Nodes có chứa Mesh
      const extractedNodes: ExtractedNode[] = [];
      root.listNodes().forEach((node, index) => {
        const mesh = node.getMesh();
        if (mesh) {
          let triangles = 0;
          mesh.listPrimitives().forEach(prim => {
            const indices = prim.getIndices();
            if (indices) {
              triangles += indices.getCount() / 3;
            } else {
              const position = prim.getAttribute('POSITION');
              if (position) triangles += position.getCount() / 3;
            }
          });
          
          extractedNodes.push({
            index,
            name: node.getName() || `Object ${index}`,
            meshName: mesh.getName() || `Mesh ${index}`,
            triangleCount: Math.round(triangles)
          });
        }
      });
      setNodes(extractedNodes);

      // Trích xuất danh sách Textures
      const extractedTextures: ExtractedTexture[] = [];
      root.listTextures().forEach((tex, index) => {
        const image = tex.getImage();
        if (image) {
          const size = tex.getSize();
          extractedTextures.push({
            index,
            name: tex.getName() || `Texture_${index}`,
            mimeType: tex.getMimeType(),
            width: size ? size[0] : 0,
            height: size ? size[1] : 0,
            sizeBytes: image.byteLength
          });
        }
      });
      setTextures(extractedTextures);

      // Load 3D preview bằng Three.js
      const url = URL.createObjectURL(selectedFile);
      const loader = new GLTFLoader();
      loader.load(url, (gltf) => {
        setPreviewScene(gltf.scene);
        URL.revokeObjectURL(url);
      }, undefined, (err) => {
        console.error("Three.js preview error", err);
      });

    } catch (err: any) {
      console.error(err);
      setError(`Lỗi khi đọc file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExtractNode = async (nodeData: ExtractedNode) => {
    if (!doc) return;
    setIsExtracting(true);
    try {
      const io = new WebIO().registerExtensions(KHRONOS_EXTENSIONS);
      
      // Clone document để không ảnh hưởng document gốc
      const cloneDoc = (doc as any).clone() as Document;
      const root = cloneDoc.getRoot();
      const scene = root.getDefaultScene() || root.listScenes()[0];
      
      // Tìm node tương ứng trong cloneDoc
      const targetNode = root.listNodes()[nodeData.index];
      
      // Xóa tất cả các node con khỏi scene
      scene.listChildren().forEach((child: any) => scene.removeChild(child));
      
      // Thêm node cần trích xuất vào scene
      scene.addChild(targetNode);
      
      // Xóa các tài nguyên (mesh, material, texture...) không được sử dụng
      await cloneDoc.transform(prune());
      
      // Chuyển thành file GLB
      const glbBuffer = await io.writeBinary(cloneDoc);
      const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' });
      
      const safeName = (nodeData.name || `object_${nodeData.index}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      downloadBlob(blob, `${safeName}.glb`);
      
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi trích xuất: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractTexture = (texData: ExtractedTexture) => {
    if (!doc) return;
    const tex = doc.getRoot().listTextures()[texData.index];
    const imageBuffer = tex.getImage();
    if (!imageBuffer) return;
    
    const extension = texData.mimeType === 'image/jpeg' ? 'jpg' : 
                      texData.mimeType === 'image/webp' ? 'webp' : 'png';
                      
    const blob = new Blob([imageBuffer], { type: texData.mimeType });
    const safeName = (texData.name || `texture_${texData.index}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadBlob(blob, `${safeName}.${extension}`);
  };

  const handleExtractAll = async () => {
    if (!doc || !file) return;
    setIsExtracting(true);
    
    try {
      const zip = new JSZip();
      const io = new WebIO().registerExtensions(KHRONOS_EXTENSIONS);
      
      const objectsFolder = zip.folder("objects");
      const texturesFolder = zip.folder("textures");
      
      // Export all nodes
      for (const nodeData of nodes) {
        const cloneDoc = (doc as any).clone() as Document;
        const root = cloneDoc.getRoot();
        const scene = root.getDefaultScene() || root.listScenes()[0];
        const targetNode = root.listNodes()[nodeData.index];
        
        scene.listChildren().forEach((child: any) => scene.removeChild(child));
        scene.addChild(targetNode);
        await cloneDoc.transform(prune());
        
        const glbBuffer = await io.writeBinary(cloneDoc);
        const safeName = (nodeData.name || `object_${nodeData.index}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        objectsFolder?.file(`${safeName}.glb`, glbBuffer);
      }
      
      // Export all textures
      for (const texData of textures) {
        const tex = doc.getRoot().listTextures()[texData.index];
        const imageBuffer = tex.getImage();
        if (imageBuffer) {
          const extension = texData.mimeType === 'image/jpeg' ? 'jpg' : 
                            texData.mimeType === 'image/webp' ? 'webp' : 'png';
          const safeName = (texData.name || `texture_${texData.index}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
          texturesFolder?.file(`${safeName}.${extension}`, imageBuffer);
        }
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `${file.name.replace(/\.[^/.]+$/, "")}_extracted.zip`);
      
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi trích xuất toàn bộ: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/utility-hub" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center">
                <Box className="w-6 h-6 mr-2 text-indigo-600" />
                Trích xuất Model GLB
              </h1>
              <p className="text-xs text-gray-500">Tách đối tượng & Texture từ file GLB/GLTF</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {!doc && !isLoading && (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-2xl bg-white p-16 text-center cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition-all"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept=".glb,.gltf"
              onChange={handleFileChange}
            />
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tải lên file GLB/GLTF</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Kéo thả file 3D của bạn vào đây hoặc click để chọn file từ máy tính.
            </p>
            <span className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Chọn File
            </span>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Đang phân tích cấu trúc 3D...</h3>
          </div>
        )}

        {doc && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cột trái: Preview & Thông tin */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <Eye className="w-4 h-4 mr-2 text-indigo-500" />
                    Bản xem trước
                  </h3>
                  <span className="text-xs font-medium bg-white px-2 py-1 rounded text-gray-600 border border-gray-200">
                    {file?.name}
                  </span>
                </div>
                <div className="h-64 bg-gray-100 w-full relative">
                  {previewScene ? (
                    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }}>
                      <Suspense fallback={null}>
                        <Stage preset="rembrandt" intensity={1} environment="city">
                          <primitive object={previewScene} />
                        </Stage>
                        <OrbitControls makeDefault autoRotate autoRotateSpeed={2} />
                      </Suspense>
                    </Canvas>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      Không có bản xem trước
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                <h3 className="font-bold text-indigo-900 mb-2 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                  Sẵn sàng trích xuất
                </h3>
                <p className="text-sm text-indigo-700 mb-6">
                  Tìm thấy <strong>{nodes.length}</strong> đối tượng 3D và <strong>{textures.length}</strong> textures bên trong file này.
                </p>
                <button
                  onClick={handleExtractAll}
                  disabled={isExtracting}
                  className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-colors shadow-sm"
                >
                  {isExtracting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <FileArchive className="w-5 h-5 mr-2" />
                  )}
                  Tải toàn bộ (.zip)
                </button>
                <button
                  onClick={() => setDoc(null)}
                  className="w-full mt-3 py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium border border-gray-200 transition-colors"
                >
                  Chọn file khác
                </button>
              </div>
            </div>

            {/* Cột phải: Danh sách Objects & Textures */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Objects List */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <Box className="w-5 h-5 mr-2 text-blue-500" />
                    Đối tượng 3D ({nodes.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {nodes.length === 0 ? (
                    <p className="p-6 text-center text-gray-500">Không tìm thấy đối tượng hình học nào.</p>
                  ) : (
                    nodes.map((node, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Box className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{node.name}</h4>
                            <p className="text-xs text-gray-500">
                              Mesh: {node.meshName} &bull; {node.triangleCount.toLocaleString()} triangles
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleExtractNode(node)}
                          disabled={isExtracting}
                          className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4 mr-1.5" />
                          Tách .glb
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Textures List */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-emerald-500" />
                    Textures ({textures.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {textures.length === 0 ? (
                    <p className="p-6 text-center text-gray-500">Không tìm thấy texture nào.</p>
                  ) : (
                    textures.map((tex, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{tex.name}</h4>
                            <p className="text-xs text-gray-500">
                              {tex.width}x{tex.height} px &bull; {formatBytes(tex.sizeBytes)} &bull; {tex.mimeType}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleExtractTexture(tex)}
                          disabled={isExtracting}
                          className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4 mr-1.5" />
                          Tải ảnh
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
