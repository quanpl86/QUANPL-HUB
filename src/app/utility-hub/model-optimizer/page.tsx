'use client';

import Link from 'next/link';
import { Suspense, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Box,
  ChevronDown,
  Download,
  Eye,
  FileArchive,
  FileUp,
  Gauge,
  Info,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Upload,
  X,
} from 'lucide-react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, Grid, OrbitControls, Stage } from '@react-three/drei';
import { WebIO, Document, Transform } from '@gltf-transform/core';
import { EXTMeshoptCompression, EXTTextureWebP, KHRMeshQuantization } from '@gltf-transform/extensions';
import {
  dedup,
  flatten,
  instance,
  join,
  meshopt,
  prune,
  quantize,
  reorder,
  simplify as gltfSimplify,
  weld,
} from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';

type Preset = 'web' | 'aggressive' | 'quality' | 'geometry';

type ModelStats = {
  meshes: number;
  vertices: number;
  triangles: number;
  materials: number;
  textures: number;
  sizeMb: string;
  dimensions: string;
};

type ExportedModel = {
  blob: Blob;
  url: string;
  name: string;
  stats: ModelStats;
};

type OptimizeOptions = {
  vertexRatio: number;
  maxTextureSize: number;
  minVerticesForSimplify: number;
  simplifyMaterials: boolean;
  keepTextures: boolean;
  weldVertices: boolean;
  preserveMultiMaterial: boolean;
  recomputeNormals: boolean;
  instanceMeshes: boolean;
  flattenNodes: boolean;
  joinMeshes: boolean;
  removeDuplicateVertices: boolean;
  removeDuplicateMeshes: boolean;
  removeDuplicateTextures: boolean;
  removeDuplicateMaterials: boolean;
  removeUnusedVertices: boolean;
  dracoCompression: boolean;
  simplifyGeometry: boolean;
};

type ModelJobStatus = 'pending' | 'loading' | 'compressed' | 'error';

type ModelJob = {
  id: string;
  file: File;
  status: ModelJobStatus;
  progress: number;
  originalModel: THREE.Object3D | null;
  optimizedModel: THREE.Object3D | null;
  originalStats: ModelStats | null;
  optimizedStats: ModelStats | null;
  exportedModel: ExportedModel | null;
  loadMs: number | null;
  optimizeMs: number | null;
  error: string | null;
};

type CompareData = {
  file: File;
  originalModel: THREE.Object3D;
  optimizedModel: THREE.Object3D;
  exportedModel: ExportedModel;
};

const MAX_FILE_SIZE = 120 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ['glb', 'gltf', 'glbx', 'stl', 'obj'];
let modelJobCounter = 0;

function getNowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function createModelJob(selectedFile: File): ModelJob {
  modelJobCounter += 1;
  return {
    id: `${selectedFile.name}-${selectedFile.size}-${selectedFile.lastModified}-${modelJobCounter}`,
    file: selectedFile,
    status: 'pending',
    progress: 0,
    originalModel: null,
    optimizedModel: null,
    originalStats: null,
    optimizedStats: null,
    exportedModel: null,
    loadMs: null,
    optimizeMs: null,
    error: null,
  };
}

const presetOptions: Array<{
  value: Preset;
  label: string;
  hint: string;
  options: OptimizeOptions;
}> = [
  {
    value: 'web',
    label: 'Web cân bằng',
    hint: 'Giảm mesh vừa phải, texture 1024px, giữ material chính.',
    options: {
      vertexRatio: 82,
      maxTextureSize: 1024,
      minVerticesForSimplify: 3000,
      simplifyMaterials: true,
      keepTextures: true,
      weldVertices: true,
      preserveMultiMaterial: true,
      recomputeNormals: true,
      removeDuplicateVertices: true,
      removeDuplicateMeshes: true,
      removeDuplicateTextures: true,
      removeDuplicateMaterials: true,
      removeUnusedVertices: true,
      dracoCompression: true,
      simplifyGeometry: true,
      instanceMeshes: true,
      flattenNodes: true,
      joinMeshes: true,
    },
  },
  {
    value: 'aggressive',
    label: 'Siêu nhẹ',
    hint: 'Ưu tiên tải nhanh cho web preview, gộp toàn bộ mesh.',
    options: {
      vertexRatio: 60,
      maxTextureSize: 512,
      minVerticesForSimplify: 1200,
      simplifyMaterials: true,
      keepTextures: true,
      weldVertices: true,
      preserveMultiMaterial: true,
      recomputeNormals: true,
      removeDuplicateVertices: true,
      removeDuplicateMeshes: true,
      removeDuplicateTextures: true,
      removeDuplicateMaterials: true,
      removeUnusedVertices: true,
      dracoCompression: true,
      simplifyGeometry: true,
      instanceMeshes: true,
      flattenNodes: true,
      joinMeshes: true,
    },
  },
  {
    value: 'quality',
    label: 'Giữ chất lượng',
    hint: 'Giảm nhẹ geometry, texture tối đa 2048px.',
    options: {
      vertexRatio: 92,
      maxTextureSize: 2048,
      minVerticesForSimplify: 5000,
      simplifyMaterials: false,
      keepTextures: true,
      weldVertices: false,
      preserveMultiMaterial: true,
      recomputeNormals: true,
      removeDuplicateVertices: true,
      removeDuplicateMeshes: false,
      removeDuplicateTextures: true,
      removeDuplicateMaterials: true,
      removeUnusedVertices: true,
      dracoCompression: false,
      simplifyGeometry: false,
      instanceMeshes: false,
      flattenNodes: false,
      joinMeshes: false,
    },
  },
  {
    value: 'geometry',
    label: 'Chỉ giảm mesh',
    hint: 'Không đụng texture/material, chỉ giảm polygon.',
    options: {
      vertexRatio: 75,
      maxTextureSize: 4096,
      minVerticesForSimplify: 1500,
      simplifyMaterials: false,
      keepTextures: true,
      weldVertices: false,
      preserveMultiMaterial: true,
      recomputeNormals: true,
      removeDuplicateVertices: false,
      removeDuplicateMeshes: false,
      removeDuplicateTextures: false,
      removeDuplicateMaterials: false,
      removeUnusedVertices: true,
      dracoCompression: true,
      simplifyGeometry: true,
      instanceMeshes: false,
      flattenNodes: false,
      joinMeshes: false,
    },
  },
];

const textureKeys = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
  'aoMap',
  'alphaMap',
] as const;

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function getExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function getBaseName(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'optimized-model';
}

function cloneModelForEditing(source: THREE.Object3D) {
  const clone = source.clone(true);

  clone.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.geometry = mesh.geometry.clone();
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((material) => material.clone());
    } else {
      mesh.material = mesh.material.clone();
    }
  });

  return clone;
}

function getMaterialList(material: THREE.Material | THREE.Material[]) {
  return Array.isArray(material) ? material : [material];
}

function getTextureFromMaterial(material: THREE.Material, key: (typeof textureKeys)[number]) {
  return (material as THREE.MeshStandardMaterial & Record<typeof key, THREE.Texture | null>)[key] || null;
}

function setTextureToMaterial(material: THREE.Material, key: (typeof textureKeys)[number], texture: THREE.Texture | null) {
  (material as THREE.MeshStandardMaterial & Record<typeof key, THREE.Texture | null>)[key] = texture;
  material.needsUpdate = true;
}

function resizeTexture(texture: THREE.Texture, maxSize: number) {
  const image = texture.image as CanvasImageSource & { width?: number; height?: number };
  const width = Number(image?.width || 0);
  const height = Number(image?.height || 0);

  if (!image || !width || !height || Math.max(width, height) <= maxSize) return texture;

  const ratio = maxSize / Math.max(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));

  const context = canvas.getContext('2d');
  if (!context) return texture;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const nextTexture = new THREE.CanvasTexture(canvas);
  nextTexture.colorSpace = texture.colorSpace;
  nextTexture.wrapS = texture.wrapS;
  nextTexture.wrapT = texture.wrapT;
  nextTexture.flipY = texture.flipY;
  nextTexture.needsUpdate = true;

  return nextTexture;
}

function simplifyGeometry(geometry: THREE.BufferGeometry, options: OptimizeOptions) {
  const position = geometry.getAttribute('position');
  const shouldPreserveGroups = options.preserveMultiMaterial && geometry.groups.length > 0 && !options.weldVertices;

  if (
    !position ||
    options.vertexRatio >= 98 ||
    position.count < options.minVerticesForSimplify ||
    shouldPreserveGroups ||
    Boolean(geometry.attributes.skinIndex) ||
    Object.keys(geometry.morphAttributes).length > 0
  ) {
    return geometry;
  }

  try {
    const targetCount = Math.max(
      Math.floor(options.minVerticesForSimplify * 0.65),
      Math.floor(position.count * (options.vertexRatio / 100)),
    );
    const removeCount = Math.max(0, position.count - targetCount);
    if (removeCount <= 0) return geometry;

    const modifier = new SimplifyModifier();
    const simplified = modifier.modify(geometry, removeCount);
    simplified.computeVertexNormals();
    simplified.computeBoundingBox();
    simplified.computeBoundingSphere();
    return simplified;
  } catch {
    return geometry;
  }
}

function simplifyMaterial(material: THREE.Material, keepTextures: boolean, maxTextureSize: number) {
  const standard = material as THREE.MeshStandardMaterial;
  const next = new THREE.MeshStandardMaterial({
    name: material.name,
    color: standard.color?.clone?.() || new THREE.Color('#d8d8d8'),
    roughness: Number.isFinite(standard.roughness) ? standard.roughness : 0.75,
    metalness: Number.isFinite(standard.metalness) ? standard.metalness : 0,
    transparent: material.transparent,
    opacity: material.opacity,
    side: material.side,
  });

  if (keepTextures && standard.map) {
    next.map = resizeTexture(standard.map, maxTextureSize);
  }

  return next;
}

function optimizeModel(source: THREE.Object3D, options: OptimizeOptions) {
  const optimized = cloneModelForEditing(source);

  optimized.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;

    if (mesh.geometry) {
      mesh.geometry = simplifyGeometry(mesh.geometry, options);
      if (options.recomputeNormals) {
        mesh.geometry.computeVertexNormals();
      }
    }

    const materials = getMaterialList(mesh.material);
    const nextMaterials = materials.map((material) => {
      if (options.simplifyMaterials) {
        return simplifyMaterial(material, options.keepTextures, options.maxTextureSize);
      }

      if (!options.keepTextures) {
        textureKeys.forEach((key) => setTextureToMaterial(material, key, null));
        return material;
      }

      textureKeys.forEach((key) => {
        const texture = getTextureFromMaterial(material, key);
        if (texture) setTextureToMaterial(material, key, resizeTexture(texture, options.maxTextureSize));
      });
      return material;
    });

    mesh.material = Array.isArray(mesh.material) ? nextMaterials : nextMaterials[0];
  });

  return optimized;
}

function getModelStats(model: THREE.Object3D, fileSize = 0): ModelStats {
  let meshes = 0;
  let vertices = 0;
  let triangles = 0;
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  model.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;

    meshes += 1;
    const position = mesh.geometry.getAttribute('position');
    if (position) vertices += position.count;

    const index = mesh.geometry.getIndex();
    if (index) {
      triangles += Math.floor(index.count / 3);
    } else if (position) {
      triangles += Math.floor(position.count / 3);
    }

    getMaterialList(mesh.material).forEach((material) => {
      materials.add(material);
      textureKeys.forEach((key) => {
        const texture = getTextureFromMaterial(material, key);
        if (texture) textures.add(texture);
      });
    });
  });

  return {
    meshes,
    vertices,
    triangles,
    materials: materials.size,
    textures: textures.size,
    sizeMb: fileSize ? formatFileSize(fileSize) : '--',
    dimensions: `${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`,
  };
}

function customWebPCompress(options: { maxTextureSize: number; quality: number }): Transform {
  return async (doc: Document) => {
    for (const texture of doc.getRoot().listTextures()) {
      const imageBytes = texture.getImage();
      if (!imageBytes) continue;

      const mimeType = texture.getMimeType() || 'image/png';
      try {
        const blob = new Blob([imageBytes], { type: mimeType });
        const imageBitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' });

        let width = imageBitmap.width;
        let height = imageBitmap.height;

        const ratio = Math.min(1, options.maxTextureSize / Math.max(width, height));
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
          ctx.drawImage(imageBitmap, 0, 0, width, height);
          imageBitmap.close();
          const webpBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', options.quality));
          
          if (webpBlob) {
            const webpArrayBuffer = await webpBlob.arrayBuffer();
            texture.setImage(new Uint8Array(webpArrayBuffer));
            texture.setMimeType('image/webp');
          }
        }
      } catch (e) {
        console.warn('Could not compress texture to WebP:', e);
      }
    }
  };
}

function createGltfLoader() {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/vendor/draco/gltf/');
  dracoLoader.setDecoderConfig({ type: 'wasm' });

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  loader.setMeshoptDecoder(MeshoptDecoder);

  return loader;
}

async function optimizeGltfBinary(file: File, options: OptimizeOptions) {
  const extension = getExtension(file.name);
  if (!['glb', 'glbx'].includes(extension)) return null;

  await Promise.all([
    MeshoptEncoder.ready,
    MeshoptDecoder.ready,
    MeshoptSimplifier.ready,
  ]);

  const io = new WebIO()
    .registerExtensions([EXTMeshoptCompression, EXTTextureWebP, KHRMeshQuantization])
    .registerDependencies({
      'meshopt.encoder': MeshoptEncoder,
      'meshopt.decoder': MeshoptDecoder,
    });

  const document = await io.readBinary(new Uint8Array(await file.arrayBuffer()));
  const propertyTypes: ('Accessor' | 'Mesh' | 'Texture' | 'Material')[] = [];
  if (options.removeDuplicateVertices) propertyTypes.push('Accessor');
  if (options.removeDuplicateMeshes) propertyTypes.push('Mesh');
  if (options.removeDuplicateTextures) propertyTypes.push('Texture');
  if (options.removeDuplicateMaterials) propertyTypes.push('Material');

  const transforms: any[] = [];
  if (propertyTypes.length > 0) transforms.push(dedup({ propertyTypes }));
  if (options.removeUnusedVertices) transforms.push(prune());
  if (options.weldVertices) transforms.push(weld({ overwrite: true }));
  
  transforms.push(reorder({ encoder: MeshoptEncoder }));

  if (options.simplifyGeometry && options.vertexRatio < 100) {
    transforms.push(gltfSimplify({
      simplifier: MeshoptSimplifier,
      ratio: options.vertexRatio / 100,
      error: options.weldVertices ? 0.02 : 0.005,
      lockBorder: !options.weldVertices,
    }));
  }

  if (options.keepTextures) {
    transforms.push(customWebPCompress({
      maxTextureSize: options.maxTextureSize,
      quality: options.vertexRatio < 65 ? 0.70 : 0.82,
    }));
  }

  if (options.flattenNodes) transforms.push(flatten());
  if (options.joinMeshes) transforms.push(join());
  if (options.instanceMeshes) transforms.push(instance({ min: 2 }));

  transforms.push(
    quantize({
      quantizePosition: options.vertexRatio < 65 ? 10 : 14,
      quantizeNormal: 8,
      quantizeTexcoord: options.vertexRatio < 65 ? 10 : 12,
      quantizeColor: 8,
      quantizeWeight: 8,
    }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
    prune(),
  );

  await document.transform(...transforms);

  return new Blob([await io.writeBinary(document)], { type: 'model/gltf-binary' });
}

async function loadModel(file: File) {
  const extension = getExtension(file.name);

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    throw new Error('Chỉ hỗ trợ GLB, GLTF, GLBX, STL và OBJ.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Model vượt quá giới hạn 120MB.');
  }

  if (['glb', 'glbx'].includes(extension)) {
    const buffer = await file.arrayBuffer();
    await MeshoptDecoder.ready;
    const loader = createGltfLoader();
    const gltf = await new Promise<Awaited<ReturnType<GLTFLoader['parseAsync']>>>((resolve, reject) => {
      loader.parse(buffer, '', resolve, reject);
    });
    return gltf.scene;
  }

  if (extension === 'gltf') {
    const text = await file.text();
    const loader = createGltfLoader();
    const gltf = await new Promise<Awaited<ReturnType<GLTFLoader['parseAsync']>>>((resolve, reject) => {
      loader.parse(text, '', resolve, reject);
    });
    return gltf.scene;
  }

  if (extension === 'stl') {
    const buffer = await file.arrayBuffer();
    const geometry = new STLLoader().parse(buffer);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: '#d6d6d6', roughness: 0.72, metalness: 0.05 }),
    );
    const group = new THREE.Group();
    group.name = getBaseName(file.name);
    group.add(mesh);
    return group;
  }

  const text = await file.text();
  return new OBJLoader().parse(text);
}

function exportGlb(model: THREE.Object3D) {
  const exporter = new GLTFExporter();

  return new Promise<Blob>((resolve, reject) => {
    exporter.parse(
      model,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(new Blob([result], { type: 'model/gltf-binary' }));
          return;
        }
        resolve(new Blob([JSON.stringify(result)], { type: 'model/gltf+json' }));
      },
      (error) => reject(error),
      {
        binary: true,
        onlyVisible: true,
        trs: false,
        embedImages: true,
        animations: [],
      },
    );
  });
}

function ModelViewer({ model, background = '#f4f4f4' }: { model: THREE.Object3D | null; background?: string }) {
  const scene = useMemo(() => (model ? model.clone(true) : null), [model]);

  return (
    <Canvas camera={{ position: [3, 2.5, 4], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={[background]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <Suspense fallback={null}>
        <Stage adjustCamera={false} environment="city" intensity={0.45} shadows={false}>
          {scene ? (
            <Bounds fit clip observe margin={1.25}>
              <Center>
                <primitive object={scene} />
              </Center>
            </Bounds>
          ) : null}
        </Stage>
      </Suspense>
      <Grid args={[8, 8]} cellSize={0.5} cellThickness={0.6} cellColor="#d6d6d6" sectionColor="#ff6b1a" fadeDistance={18} />
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}

export default function ModelOptimizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalModel, setOriginalModel] = useState<THREE.Object3D | null>(null);
  const [optimizedModel, setOptimizedModel] = useState<THREE.Object3D | null>(null);
  const [exportedModel, setExportedModel] = useState<ExportedModel | null>(null);
  const [jobs, setJobs] = useState<ModelJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [options, setOptions] = useState<OptimizeOptions>(presetOptions[0].options);
  const [showDuplicateOptions, setShowDuplicateOptions] = useState(true);
  const [loadMs, setLoadMs] = useState<number | null>(null);
  const [optimizeMs, setOptimizeMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [isCompareLightMode, setIsCompareLightMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const originalStats = useMemo(() => (
    originalModel && file ? getModelStats(originalModel, file.size) : null
  ), [originalModel, file]);

  const optimizedStats = useMemo(() => (
    optimizedModel ? getModelStats(optimizedModel, exportedModel?.blob.size || 0) : null
  ), [optimizedModel, exportedModel]);

  const sizeReduction = useMemo(() => {
    if (!file || !exportedModel) return null;
    return Math.round(100 - (exportedModel.blob.size / file.size) * 100);
  }, [file, exportedModel]);

  const clearExportedModel = () => {
    if (exportedModel?.url) URL.revokeObjectURL(exportedModel.url);
    setExportedModel(null);
  };

  const resetTool = () => {
    clearExportedModel();
    setFile(null);
    setOriginalModel(null);
    setOptimizedModel(null);
    setLoadMs(null);
    setOptimizeMs(null);
    setError(null);
    jobs.forEach((job) => {
      if (job.exportedModel?.url) URL.revokeObjectURL(job.exportedModel.url);
    });
    setJobs([]);
    setSelectedJobId(null);
    setOptions(presetOptions[0].options);
  };

  const updateOption = <T extends keyof OptimizeOptions>(key: T, value: OptimizeOptions[T]) => {
    setOptions((current) => ({ ...current, [key]: value }));
    setOptimizedModel(null);
    setOptimizeMs(null);
    clearExportedModel();
  };

  const loadPreviewFile = async (selectedFile: File, jobId?: string) => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    clearExportedModel();
    setOptimizedModel(null);
    setOptimizeMs(null);

    try {
      const start = getNowMs();
      const scene = await loadModel(selectedFile);
      scene.updateMatrixWorld(true);
      setFile(selectedFile);
      setOriginalModel(scene);
      const nextLoadMs = Math.round(getNowMs() - start);
      setLoadMs(nextLoadMs);
      if (jobId) {
        setSelectedJobId(jobId);
        setJobs((current) => current.map((job) => (
          job.id === jobId
            ? { ...job, originalModel: scene, originalStats: getModelStats(scene, selectedFile.size), loadMs: nextLoadMs }
            : job
        )));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể đọc model 3D.');
      setFile(null);
      setOriginalModel(null);
    } finally {
      setIsLoading(false);
    }
  };

  const addFiles = async (incomingFiles: File[]) => {
    const validFiles = incomingFiles.filter((incomingFile) => SUPPORTED_EXTENSIONS.includes(getExtension(incomingFile.name)));

    if (!validFiles.length) {
      setError('Chỉ hỗ trợ GLB, GLTF, GLBX, STL và OBJ.');
      return;
    }

    const nextJobs = validFiles.map(createModelJob);
    setJobs((current) => [...current, ...nextJobs]);

    if (!selectedJobId && nextJobs[0]) {
      await loadPreviewFile(nextJobs[0].file, nextJobs[0].id);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await addFiles(Array.from(event.target.files || []));
    event.target.value = '';
  };

  const processJob = async (job: ModelJob) => {
    setJobs((current) => current.map((item) => (
      item.id === job.id ? { ...item, status: 'loading', progress: 12, error: null } : item
    )));
    setIsOptimizing(true);
    setError(null);

    try {
      const loadStart = getNowMs();
      const scene = await loadModel(job.file);
      scene.updateMatrixWorld(true);
      const nextLoadMs = Math.round(getNowMs() - loadStart);
      const nextOriginalStats = getModelStats(scene, job.file.size);

      setJobs((current) => current.map((item) => (
        item.id === job.id ? { ...item, progress: 42, originalStats: nextOriginalStats, loadMs: nextLoadMs } : item
      )));

      const optimizeStart = getNowMs();
      await new Promise((resolve) => window.setTimeout(resolve, 40));
      const transformBlob = await optimizeGltfBinary(job.file, options);
      const optimized = transformBlob
        ? await loadModel(new File([transformBlob], `${getBaseName(job.file.name)}-web-optimized.glb`, { type: 'model/gltf-binary' }))
        : optimizeModel(scene, options);
      optimized.updateMatrixWorld(true);
      const blob = transformBlob || await exportGlb(optimized);
      const url = URL.createObjectURL(blob);
      const stats = getModelStats(optimized, blob.size);
      const nextOptimizeMs = Math.round(getNowMs() - optimizeStart);
      const nextExportedModel = {
        blob,
        url,
        name: `${getBaseName(job.file.name)}-web-optimized.glb`,
        stats,
      };

      setJobs((current) => current.map((item) => {
        if (item.id !== job.id) return item;
        if (item.exportedModel?.url) URL.revokeObjectURL(item.exportedModel.url);
        return {
          ...item,
          status: 'compressed',
          progress: 100,
          originalModel: scene,
          optimizedModel: optimized,
          originalStats: nextOriginalStats,
          optimizedStats: stats,
          exportedModel: nextExportedModel,
          loadMs: nextLoadMs,
          optimizeMs: nextOptimizeMs,
        };
      }));

      setSelectedJobId(job.id);
      setFile(job.file);
      setOriginalModel(scene);
      setOptimizedModel(optimized);
      setExportedModel(nextExportedModel);
      setLoadMs(nextLoadMs);
      setOptimizeMs(nextOptimizeMs);
    } catch (optimizeError) {
      const message = optimizeError instanceof Error ? optimizeError.message : 'Không thể tối ưu model.';
      setError(message);
      setJobs((current) => current.map((item) => (
        item.id === job.id ? { ...item, status: 'error', progress: 0, error: message } : item
      )));
    } finally {
      setIsOptimizing(false);
    }
  };

  const processAllJobs = async () => {
    for (const job of jobs) {
      if (job.status !== 'compressed') {
        await processJob(job);
      }
    }
  };

  const removeJob = (jobId: string) => {
    setJobs((current) => {
      const target = current.find((job) => job.id === jobId);
      if (target?.exportedModel?.url) URL.revokeObjectURL(target.exportedModel.url);
      return current.filter((job) => job.id !== jobId);
    });

    if (selectedJobId === jobId) {
      setSelectedJobId(null);
      setFile(null);
      setOriginalModel(null);
      setOptimizedModel(null);
      setLoadMs(null);
      setOptimizeMs(null);
      clearExportedModel();
    }
  };

  const selectJob = async (job: ModelJob) => {
    setSelectedJobId(job.id);
    setFile(job.file);
    setOriginalModel(job.originalModel);
    setOptimizedModel(job.optimizedModel);
    setExportedModel(job.exportedModel);
    setLoadMs(job.loadMs);
    setOptimizeMs(job.optimizeMs);
    if (job.originalModel) {
      return;
    }
    await loadPreviewFile(job.file, job.id);
  };

  const downloadModel = () => {
    if (!exportedModel) return;

    const link = document.createElement('a');
    link.href = exportedModel.url;
    link.download = exportedModel.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJob = (job: ModelJob) => {
    if (!job.exportedModel) return;

    const link = document.createElement('a');
    link.href = job.exportedModel.url;
    link.download = job.exportedModel.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllJobs = () => {
    jobs.filter((job) => job.exportedModel).forEach(downloadJob);
  };

  const openCompare = (job?: ModelJob) => {
    if (job?.originalModel && job.optimizedModel && job.exportedModel) {
      setCompareData({
        file: job.file,
        originalModel: job.originalModel,
        optimizedModel: job.optimizedModel,
        exportedModel: job.exportedModel,
      });
      return;
    }

    if (!file || !originalModel || !optimizedModel || !exportedModel) return;
    setCompareData({ file, originalModel, optimizedModel, exportedModel });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b border-foreground/10 bg-foreground/[0.02]">
        <div className="container mx-auto px-6 py-8">
          <Link
            href="/utility-hub"
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 transition-colors hover:text-brand-orange"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Quay lại Utility Hub
          </Link>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/5 px-3 py-1">
                <Box size={14} className="text-brand-orange" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">3D Model Optimizer</span>
              </div>
              <h1 className="font-[family-name:var(--font-inter)] text-4xl font-black tracking-tight md:text-5xl">
                Tối ưu model 3D cho web
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/70">
                Tối ưu GLB/GLTF/STL/OBJ theo batch, giảm mesh, resize texture, nén meshopt và so sánh trực quan trước/sau.
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm sm:grid-cols-3 lg:min-w-[430px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">File gốc</p>
                <p className="mt-1 text-sm font-black">{file ? formatFileSize(file.size) : '--'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">GLB tối ưu</p>
                <p className="mt-1 text-sm font-black">{exportedModel ? formatFileSize(exportedModel.blob.size) : '--'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Giảm dung lượng</p>
                <p className="mt-1 text-sm font-black">
                  {sizeReduction === null ? '--' : sizeReduction > 0 ? `-${sizeReduction}%` : `+${Math.abs(sizeReduction)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="container mx-auto px-6 py-10">
          <div
            className={`flex min-h-[255px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-colors ${
              isDragging ? 'border-brand-orange bg-brand-orange/10' : 'border-foreground/20 bg-background'
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (event) => {
              event.preventDefault();
              setIsDragging(false);
              await addFiles(Array.from(event.dataTransfer.files || []));
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".glb,.gltf,.glbx,.stl,.obj,model/gltf-binary,model/gltf+json"
              className="sr-only"
              onChange={handleFileChange}
            />
            {isLoading ? (
              <Loader2 size={38} className="animate-spin text-brand-orange" aria-hidden="true" />
            ) : (
              <Upload size={38} className="text-foreground/35" aria-hidden="true" />
            )}
            <h1 className="mt-4 text-base font-black text-foreground">Kéo thả model 3D</h1>
            <p className="mt-1 text-sm text-foreground/50">GLB file(s), GLTF/STL/OBJ hoặc batch nhiều file</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-4 py-2 text-sm font-black text-foreground/70 transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                <FileUp size={16} aria-hidden="true" />
                Upload Files
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-4 py-2 text-sm font-black text-foreground/70 transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                <FileArchive size={16} aria-hidden="true" />
                Tải lên thư mục
              </button>
              <span className="inline-flex items-center text-foreground/40">
                <Info size={16} aria-hidden="true" />
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-6">
            <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <h2 className="text-base font-black text-foreground">Tuỳ chọn Texture</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="relative block">
                  <select
                    value={options.keepTextures ? 'webp' : 'none'}
                    onChange={(event) => updateOption('keepTextures', event.target.value !== 'none')}
                    className="h-11 w-full appearance-none rounded-xl border border-foreground/10 bg-background px-4 text-sm font-bold text-foreground outline-none focus:border-brand-orange"
                  >
                    <option value="webp">WebP</option>
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                    <option value="none">Không dùng textures</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 text-foreground/40" size={16} aria-hidden="true" />
                </label>
                <label className="relative block">
                  <select
                    value={options.maxTextureSize}
                    onChange={(event) => updateOption('maxTextureSize', Number(event.target.value))}
                    className="h-11 w-full appearance-none rounded-xl border border-foreground/10 bg-background px-4 text-sm font-bold text-foreground outline-none focus:border-brand-orange"
                  >
                    <option value={512}>512</option>
                    <option value={1024}>1024 (Khuyên dùng)</option>
                    <option value={2048}>2048</option>
                    <option value={4096}>4096</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 text-foreground/40" size={16} aria-hidden="true" />
                </label>
              </div>

              <h2 className="mt-6 text-base font-black text-foreground">Tuỳ chọn nâng cao</h2>
              <div className="mt-4 grid gap-3 pb-8">
                <label className="relative flex items-center gap-3 text-sm font-bold text-foreground/75 cursor-pointer hover:z-50 w-max">
                  <input
                    type="checkbox"
                    checked={
                      options.removeDuplicateVertices &&
                      options.removeDuplicateMeshes &&
                      options.removeDuplicateTextures &&
                      options.removeDuplicateMaterials
                    }
                    onChange={(event) => {
                      const val = event.target.checked;
                      updateOption('removeDuplicateVertices', val as never);
                      updateOption('removeDuplicateMeshes', val as never);
                      updateOption('removeDuplicateTextures', val as never);
                      updateOption('removeDuplicateMaterials', val as never);
                    }}
                    className="h-4 w-4 accent-brand-orange cursor-pointer"
                  />
                  Loại bỏ trùng lặp
                  <span className="group relative flex items-center cursor-help">
                    <Info size={14} className="text-foreground/40 hover:text-foreground/60 transition-colors" aria-hidden="true" />
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden w-max max-w-[280px] rounded-lg border border-foreground/10 bg-white p-2 text-xs font-medium leading-relaxed text-zinc-800 shadow-xl group-hover:block z-[999] dark:bg-zinc-800 dark:text-zinc-200">
                      Loại bỏ các thành phần trùng lặp để giảm kích thước file.
                    </div>
                  </span>
                </label>

                <div className="flex flex-col gap-2 pl-6 pb-4 border-b border-foreground/10">
                  <button 
                    type="button" 
                    onClick={() => setShowDuplicateOptions(prev => !prev)}
                    className="flex items-center justify-between gap-4 text-sm font-bold text-foreground/60 mb-2 hover:text-foreground/80 transition-colors text-left"
                  >
                    <span className="flex items-center gap-3">
                      <span>Các tuỳ chọn loại bỏ trùng lặp</span>
                      <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-[10px] font-black text-brand-orange">Mới</span>
                    </span>
                    <ChevronDown size={16} className={`text-foreground/40 transition-transform duration-200 ${showDuplicateOptions ? '' : '-rotate-90'}`} aria-hidden="true" />
                  </button>
                  {showDuplicateOptions && [
                    ['removeDuplicateVertices', 'Loại bỏ điểm ảnh (vertices) trùng lặp', 'Loại bỏ dữ liệu đỉnh (vertex) trùng lặp để giảm kích thước file.'],
                    ['removeDuplicateMeshes', 'Loại bỏ mesh trùng lặp', 'Loại bỏ dữ liệu mesh trùng lặp nhưng vẫn giữ nguyên materials.'],
                    ['removeDuplicateTextures', 'Loại bỏ texture trùng lặp', 'Loại bỏ các hình ảnh texture trùng lặp để giảm kích thước file.'],
                    ['removeDuplicateMaterials', 'Loại bỏ material trùng lặp', 'Loại bỏ dữ liệu material trùng lặp để giảm kích thước file.'],
                  ].map(([key, label, tooltip]) => (
                    <label key={key} className="relative flex items-center gap-3 text-sm font-bold text-foreground/75 cursor-pointer hover:z-50 w-max">
                      <input
                        type="checkbox"
                        checked={Boolean(options[key as keyof OptimizeOptions])}
                        onChange={(event) => updateOption(key as keyof OptimizeOptions, event.target.checked as never)}
                        className="h-4 w-4 accent-brand-orange cursor-pointer"
                      />
                      {label}
                      <span className="group relative flex items-center cursor-help">
                        <Info size={14} className="text-foreground/40 hover:text-foreground/60 transition-colors" aria-hidden="true" />
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden w-max max-w-[280px] rounded-lg border border-foreground/10 bg-white p-2 text-xs font-medium leading-relaxed text-zinc-800 shadow-xl group-hover:block z-[999] dark:bg-zinc-800 dark:text-zinc-200">
                          {tooltip}
                        </div>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex flex-col gap-3 py-2 border-b border-foreground/10">
                  {[
                    ['removeUnusedVertices', 'Loại bỏ điểm ảnh không dùng', 'Loại bỏ các đỉnh không được sử dụng.'],
                    ['dracoCompression', 'Nén Draco', 'Sử dụng thuật toán nén Draco để nén hình học hiệu quả.'],
                  ].map(([key, label, tooltip]) => (
                    <label key={key} className="relative flex items-center gap-3 text-sm font-bold text-foreground/75 cursor-pointer hover:z-50 w-max">
                      <input
                        type="checkbox"
                        checked={Boolean(options[key as keyof OptimizeOptions])}
                        onChange={(event) => updateOption(key as keyof OptimizeOptions, event.target.checked as never)}
                        className="h-4 w-4 accent-brand-orange cursor-pointer"
                      />
                      {label}
                      <span className="group relative flex items-center cursor-help">
                        <Info size={14} className="text-foreground/40 hover:text-foreground/60 transition-colors" aria-hidden="true" />
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden w-max max-w-[280px] rounded-lg border border-foreground/10 bg-white p-2 text-xs font-medium leading-relaxed text-zinc-800 shadow-xl group-hover:block z-[999] dark:bg-zinc-800 dark:text-zinc-200">
                          {tooltip}
                        </div>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="rounded-xl border border-foreground/10 bg-background p-4 text-sm leading-relaxed my-2">
                  <p className="font-black text-foreground">Lưu ý:</p>
                  <p className="text-foreground/60">
                    Hãy đảm bảo bạn đã import DRACOLoader vào GLTF loader (ví dụ: Three.js, Unity) nếu sử dụng tính năng nén Draco.
                  </p>
                </div>

                <label className="relative flex items-center justify-between gap-4 pt-4 border-t border-foreground/10 cursor-pointer hover:z-50 w-full">
                  <span className="flex items-center gap-3 text-sm font-bold text-foreground/75 w-max">
                    <span className={`relative h-6 w-11 rounded-full transition-colors shadow-inner ${options.simplifyGeometry ? 'bg-brand-orange' : 'bg-foreground/20'}`}>
                      <input
                        type="checkbox"
                        checked={options.simplifyGeometry}
                        onChange={(event) => updateOption('simplifyGeometry', event.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-sm" />
                    </span>
                    Đơn giản hoá hình học (Geometry)
                    <span className="group relative flex items-center cursor-help">
                      <Info size={14} className="text-foreground/40 hover:text-foreground/60 transition-colors" aria-hidden="true" />
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden w-max max-w-[280px] rounded-lg border border-foreground/10 bg-white p-2 text-xs font-medium leading-relaxed text-zinc-800 shadow-xl group-hover:block z-[999] dark:bg-zinc-800 dark:text-zinc-200">
                        Giảm số lượng tam giác trong khi vẫn giữ nguyên hình dạng tổng thể.
                      </div>
                    </span>
                  </span>
                  <span className="text-sm font-black text-foreground/60">{(options.vertexRatio / 100).toFixed(2)}</span>
                </label>

                {options.simplifyGeometry && (
                  <div className="pl-14 pr-4 pt-2 pb-2">
                    <label className="grid gap-2">
                      <div className="relative flex items-center gap-2 text-sm font-bold text-foreground/75 cursor-default w-max hover:z-50">
                        <span>Tỷ lệ tối giản</span>
                        <span className="group relative flex items-center cursor-help">
                          <Info size={14} className="text-foreground/40 hover:text-foreground/60 transition-colors" aria-hidden="true" />
                          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden w-max max-w-[280px] rounded-lg border border-foreground/10 bg-white p-2 text-xs font-medium leading-relaxed text-zinc-800 shadow-xl group-hover:block z-[999] dark:bg-zinc-800 dark:text-zinc-200">
                            Giá trị thấp hơn sẽ loại bỏ nhiều tam giác hơn. Thử mức 0.5 để cân bằng tốt giữa chất lượng và kích thước.
                          </div>
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={options.vertexRatio}
                        onChange={(event) => updateOption('vertexRatio', Number(event.target.value))}
                        className="w-full accent-brand-orange cursor-ew-resize"
                      />
                    </label>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  {[
                    ['instanceMeshes', 'Gộp meshes (Instance)', 'Nhận diện và gộp các mesh giống nhau để giảm dung lượng RAM.'],
                    ['flattenNodes', 'Làm phẳng nodes (Flatten)', 'Làm phẳng cây node để đơn giản hóa cấu trúc.'],
                    ['joinMeshes', 'Nối meshes (Join)', 'Gộp các mesh tương thích để giảm số lượng lệnh vẽ.'],
                    ['weldVertices', 'Hàn điểm ảnh (Weld)', 'Gộp các đỉnh gần nhau để giảm số lượng đỉnh.'],
                  ].map(([key, label, tooltip]) => (
                    <label key={key} className="relative flex items-center gap-3 text-sm font-bold text-foreground/75 cursor-pointer hover:z-50 w-max">
                      <input
                        type="checkbox"
                        checked={Boolean(options[key as keyof OptimizeOptions])}
                        onChange={(event) => updateOption(key as keyof OptimizeOptions, event.target.checked as never)}
                        className="h-4 w-4 accent-brand-orange cursor-pointer"
                      />
                      {label}
                      <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-[10px] font-black text-brand-orange">Mới</span>
                      <span className="group relative flex items-center cursor-help">
                        <Info size={14} className="text-foreground/40 hover:text-foreground/60 transition-colors" aria-hidden="true" />
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden w-max max-w-[280px] rounded-lg border border-foreground/10 bg-white p-2 text-xs font-medium leading-relaxed text-zinc-800 shadow-xl group-hover:block z-[999] dark:bg-zinc-800 dark:text-zinc-200">
                          {tooltip}
                        </div>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <p className="text-base font-bold text-foreground/60">Các file GLB đã chọn: {jobs.length}</p>
                <button
                  type="button"
                  onClick={resetTool}
                  disabled={!jobs.length}
                  className="rounded-full border border-foreground/10 px-4 py-2 text-sm font-black text-foreground/60 transition-colors hover:border-red-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Xoá tất cả
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-foreground/10 text-xs uppercase tracking-wider text-foreground/45">
                    <tr>
                      <th className="px-4 py-3">Tên file</th>
                      <th className="px-4 py-3">Gốc</th>
                      <th className="px-4 py-3">Nén</th>
                      <th className="px-4 py-3">Giảm</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Tiến độ</th>
                      <th className="px-4 py-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/10 text-foreground/60">
                    {jobs.length ? jobs.map((job) => {
                      const reduction = job.exportedModel
                        ? Math.round(100 - (job.exportedModel.blob.size / job.file.size) * 100)
                        : null;
                      return (
                        <tr
                          key={job.id}
                          className={`cursor-pointer transition-colors hover:bg-brand-orange/[0.04] ${selectedJobId === job.id ? 'bg-brand-orange/10' : ''}`}
                          onClick={() => void selectJob(job)}
                        >
                          <td className="max-w-[320px] truncate px-4 py-4 font-bold text-foreground">{job.file.name}</td>
                          <td className="px-4 py-4">{formatFileSize(job.file.size)}</td>
                          <td className="px-4 py-4">{job.exportedModel ? formatFileSize(job.exportedModel.blob.size) : '-'}</td>
                          <td className={`px-4 py-4 font-black ${reduction !== null && reduction > 0 ? 'text-emerald-600' : ''}`}>
                            {reduction === null ? '-' : `${reduction > 0 ? '-' : '+'}${Math.abs(reduction)}%`}
                          </td>
                          <td className="px-4 py-4">{job.status === 'compressed' ? 'hoàn thành' : job.status === 'loading' ? 'đang xử lý' : job.status}</td>
                          <td className="px-4 py-4">
                            <div className="h-3 w-28 overflow-hidden rounded-full bg-foreground/10">
                              <div
                                className={`h-full rounded-full ${job.status === 'compressed' ? 'bg-emerald-500' : 'bg-brand-orange'}`}
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {job.exportedModel ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      downloadJob(job);
                                    }}
                                    className="rounded-full border border-foreground/10 px-3 py-2 text-sm font-black text-foreground/70 transition-colors hover:border-brand-orange hover:text-brand-orange"
                                  >
                                    Tải xuống
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void selectJob(job);
                                      openCompare(job);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-3 py-2 text-sm font-black text-foreground/70 transition-colors hover:border-brand-orange hover:text-brand-orange"
                                  >
                                    <Eye size={14} aria-hidden="true" />
                                    So sánh
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void processJob(job);
                                  }}
                                  className="rounded-full border border-foreground/10 p-2 text-foreground/70 transition-colors hover:border-brand-orange hover:text-brand-orange"
                                  aria-label={`Process ${job.file.name}`}
                                >
                                  <Play size={14} aria-hidden="true" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeJob(job.id);
                                }}
                                className="rounded-full border border-foreground/10 p-2 text-foreground/70 transition-colors hover:border-red-400 hover:text-red-500"
                                aria-label={`Remove ${job.file.name}`}
                              >
                                <X size={14} aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-foreground/45">
                          Chưa có file. Kéo thả hoặc upload GLB/GLTF/STL/OBJ để bắt đầu.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <p className="font-bold text-emerald-600">Toàn bộ quá trình xử lý hoàn toàn miễn phí và chạy trực tiếp trên trình duyệt của bạn.</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={downloadAllJobs}
                    disabled={!jobs.some((job) => job.exportedModel)}
                    className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-5 py-3 text-sm font-black text-foreground/70 transition-colors hover:border-brand-orange hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download size={16} aria-hidden="true" />
                    Tải tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => void processAllJobs()}
                    disabled={!jobs.length || isOptimizing}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-orange/20 transition-colors hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isOptimizing ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                    Xử lý tất cả
                  </button>
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-bold text-red-600">
                {error}
              </div>
            )}
          </div>

          <div id="compare-view" className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="min-h-[520px] rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Before</p>
                    <h2 className="mt-1 text-xl font-black">Model gốc</h2>
                  </div>
                  <Box size={24} className="text-foreground/40" aria-hidden="true" />
                </div>
                <div className="h-[430px] overflow-hidden rounded-2xl border border-foreground/10 bg-background">
                  {originalModel ? (
                    <ModelViewer model={originalModel} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-center">
                      <div>
                        <Upload size={38} className="mx-auto text-foreground/30" aria-hidden="true" />
                        <p className="mt-4 text-sm font-black text-foreground/60">Chưa có model nguồn</p>
                        <p className="mt-2 text-xs text-foreground/45">Upload GLB, STL hoặc OBJ để preview.</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="min-h-[520px] rounded-2xl border border-brand-orange/20 bg-brand-orange/[0.03] p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">After</p>
                    <h2 className="mt-1 text-xl font-black">Model tối ưu</h2>
                  </div>
                  <Sparkles size={24} className="text-brand-orange" aria-hidden="true" />
                </div>
                <div className="h-[430px] overflow-hidden rounded-2xl border border-brand-orange/15 bg-background">
                  {optimizedModel ? (
                    <ModelViewer model={optimizedModel} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-center">
                      <div>
                        <Gauge size={38} className="mx-auto text-brand-orange/45" aria-hidden="true" />
                        <p className="mt-4 text-sm font-black text-foreground/60">Chưa có model tối ưu</p>
                        <p className="mt-2 text-xs text-foreground/45">Chọn preset rồi bấm Optimize model.</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <div className="flex flex-col gap-6">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Gauge size={20} className="text-brand-orange" aria-hidden="true" />
                    <h2 className="text-xl font-black">Báo cáo tối ưu</h2>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {[
                      {
                        label: 'Dung lượng',
                        before: originalStats?.sizeMb || '--',
                        after: exportedModel ? formatFileSize(exportedModel.blob.size) : '--',
                        accent: sizeReduction === null ? '--' : sizeReduction > 0 ? `-${sizeReduction}%` : `+${Math.abs(sizeReduction)}%`,
                      },
                      {
                        label: 'Triangles',
                        before: originalStats?.triangles.toLocaleString('vi-VN') || '--',
                        after: optimizedStats?.triangles.toLocaleString('vi-VN') || '--',
                        accent: 'faces',
                      },
                      {
                        label: 'Vertices',
                        before: originalStats?.vertices.toLocaleString('vi-VN') || '--',
                        after: optimizedStats?.vertices.toLocaleString('vi-VN') || '--',
                        accent: 'points',
                      },
                      {
                        label: 'Meshes',
                        before: originalStats?.meshes.toLocaleString('vi-VN') || '--',
                        after: optimizedStats?.meshes.toLocaleString('vi-VN') || '--',
                        accent: 'nodes',
                      },
                      {
                        label: 'Materials / Texture',
                        before: `${originalStats?.materials ?? '--'} / ${originalStats?.textures ?? '--'}`,
                        after: `${optimizedStats?.materials ?? '--'} / ${optimizedStats?.textures ?? '--'}`,
                        accent: 'slots',
                      },
                      {
                        label: 'Load / Optimize',
                        before: loadMs ? `${loadMs}ms` : '--',
                        after: optimizeMs ? `${optimizeMs}ms` : '--',
                        accent: 'timing',
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-foreground/10 bg-background p-4 shadow-sm flex flex-col justify-between">
                        <div className="mb-4 flex items-start justify-between gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 leading-snug">{item.label}</p>
                          <span className="shrink-0 rounded-full bg-brand-orange/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-brand-orange">
                            {item.accent}
                          </span>
                        </div>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between border-b border-foreground/5 pb-2">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-foreground/35">Trước</p>
                            <p className="text-sm font-black text-foreground">{item.before}</p>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-brand-orange/70">Sau</p>
                            <p className="text-sm font-black text-brand-orange">{item.after}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <button
                    type="button"
                    onClick={downloadModel}
                    disabled={!exportedModel}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-8 py-3 text-sm font-black text-white shadow-lg shadow-brand-orange/20 transition-all hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
                  >
                    <Download size={16} aria-hidden="true" />
                    Tải GLB tối ưu
                  </button>
                  <div className="flex-1 min-w-[300px] inline-flex items-center gap-3 rounded-xl border border-foreground/10 bg-background px-4 py-3 text-xs leading-relaxed text-foreground/55">
                    <ShieldCheck size={18} className="shrink-0 text-brand-orange" aria-hidden="true" />
                    <span>Bản đầu ưu tiên GLB web-ready. GLTF có texture ngoài sẽ cần đóng gói về GLB trước khi tối ưu sâu.</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>

      {compareData && (
        <div className="fixed inset-0 z-50 bg-black/75 p-4 backdrop-blur-sm md:p-8" role="dialog" aria-modal="true" aria-label="Model comparison">
          <div className={`mx-auto flex h-full max-w-[1900px] flex-col overflow-hidden rounded-2xl border ${isCompareLightMode ? 'border-foreground/10 bg-[#f8f9fa]' : 'border-white/10 bg-[#0a0a0c]'} shadow-2xl transition-colors duration-300`}>
            <div className={`flex items-center justify-between gap-4 border-b ${isCompareLightMode ? 'border-foreground/10' : 'border-white/10'} px-5 py-4`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-brand-orange">So sánh model</p>
                <h2 className={`text-lg font-black ${isCompareLightMode ? 'text-zinc-900' : 'text-white'}`}>{compareData.file.name}</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCompareLightMode(prev => !prev)}
                  className={`flex items-center justify-center rounded-full border ${isCompareLightMode ? 'border-foreground/20 text-foreground/70 hover:bg-foreground/5 hover:text-brand-orange' : 'border-white/20 text-white/70 hover:bg-white/5 hover:text-brand-orange'} p-2 transition-colors`}
                  aria-label="Chuyển đổi giao diện Sáng/Tối"
                >
                  {isCompareLightMode ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  onClick={() => setCompareData(null)}
                  className={`rounded-full border ${isCompareLightMode ? 'border-foreground/20 text-foreground/70 hover:bg-foreground/5 hover:text-brand-orange' : 'border-white/20 text-white/70 hover:bg-white/5 hover:text-brand-orange'} p-2 transition-colors`}
                  aria-label="Đóng so sánh model"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className={`grid min-h-0 flex-1 divide-y ${isCompareLightMode ? 'divide-foreground/10' : 'divide-white/10'} lg:grid-cols-2 lg:divide-x lg:divide-y-0`}>
              <section className="relative min-h-[420px]">
                <div className={`absolute left-4 top-4 z-10 rounded-lg border ${isCompareLightMode ? 'border-amber-600/30 bg-amber-600/15 text-amber-700' : 'border-amber-500/30 bg-amber-500/15 text-amber-300'} px-3 py-2 text-sm font-black`}>
                  Bản gốc <span className={`ml-2 text-xs font-bold ${isCompareLightMode ? 'text-amber-800/80' : 'text-amber-200/80'}`}>{formatFileSize(compareData.file.size)}</span>
                </div>
                <div className="h-full min-h-[420px]">
                  <ModelViewer model={compareData.originalModel} background={isCompareLightMode ? "#f4f4f4" : "#050505"} />
                </div>
              </section>

              <section className="relative min-h-[420px]">
                <div className="absolute right-4 top-4 z-10 flex flex-wrap justify-end gap-2">
                  <span className={`rounded-full ${isCompareLightMode ? 'bg-emerald-600/15 text-emerald-700' : 'bg-emerald-500/20 text-emerald-300'} px-3 py-2 text-xs font-black`}>
                    {(() => {
                      const reduction = Math.round(100 - (compareData.exportedModel.blob.size / compareData.file.size) * 100);
                      return reduction > 0 ? `-${reduction}%` : `+${Math.abs(reduction)}%`;
                    })()}
                  </span>
                  <span className={`rounded-lg border ${isCompareLightMode ? 'border-emerald-600/30 bg-emerald-600/15 text-emerald-700' : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'} px-3 py-2 text-sm font-black`}>
                    Bản tối ưu <span className={`ml-2 text-xs font-bold ${isCompareLightMode ? 'text-emerald-800/80' : 'text-emerald-200/80'}`}>{formatFileSize(compareData.exportedModel.blob.size)}</span>
                  </span>
                </div>
                <div className="h-full min-h-[420px]">
                  <ModelViewer model={compareData.optimizedModel} background={isCompareLightMode ? "#f4f4f4" : "#050505"} />
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
