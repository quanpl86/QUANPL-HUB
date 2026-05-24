'use client';

/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Brush,
  CheckCircle2,
  Crop,
  Download,
  Eraser,
  FileImage,
  ImageUp,
  Loader2,
  Palette,
  Redo2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { Config } from '@imgly/background-removal';

type PreviewBackground = 'transparent' | 'white' | 'dark' | 'brand';
type ModelMode = 'isnet_quint8' | 'isnet_fp16';
type DeviceMode = 'cpu' | 'gpu';
type BrushMode = 'restore' | 'erase';

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const HISTORY_LIMIT = 12;

const backgroundClass: Record<PreviewBackground, string> = {
  transparent:
    'bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:28px_28px] bg-[position:0_0,0_14px,14px_-14px,-14px_0] bg-white',
  white: 'bg-white',
  dark: 'bg-slate-950',
  brand: 'bg-brand-orange/15',
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function clampZoom(value: number) {
  return Math.min(4, Math.max(0.5, Number(value.toFixed(2))));
}

function loadImage(input: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(input);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Cannot load image'));
    };
    image.src = url;
  });
}

export default function BackgroundRemoverPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const workingImageDataRef = useRef<ImageData | null>(null);
  const historyRef = useRef<Uint8ClampedArray[]>([]);
  const historyIndexRef = useRef(-1);
  const isPaintingRef = useRef(false);
  const strokeChangedRef = useRef(false);
  const resultUrlRef = useRef<string | null>(null);
  const pendingEditorBlobRef = useRef<Blob | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [brushMode, setBrushMode] = useState<BrushMode>('restore');
  const [brushSize, setBrushSize] = useState(42);
  const [brushOpacity, setBrushOpacity] = useState(85);
  const [softBrush, setSoftBrush] = useState(true);
  const [historyCursor, setHistoryCursor] = useState(-1);
  const [historyLength, setHistoryLength] = useState(0);
  const [cropPadding, setCropPadding] = useState(24);
  const [sourceZoom, setSourceZoom] = useState(1);
  const [resultZoom, setResultZoom] = useState(1);
  const [alphaCutoff, setAlphaCutoff] = useState(8);
  const [alphaContrast, setAlphaContrast] = useState(100);
  const [alphaRecovery, setAlphaRecovery] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Sẵn sàng xử lý');
  const [previewBackground, setPreviewBackground] = useState<PreviewBackground>('transparent');
  const [model, setModel] = useState<ModelMode>('isnet_quint8');
  const [device, setDevice] = useState<DeviceMode>('cpu');

  const resultStats = useMemo(() => {
    if (!resultBlob) return null;
    return formatFileSize(resultBlob.size);
  }, [resultBlob]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, [previewUrl]);

  const syncHistoryState = () => {
    setHistoryCursor(historyIndexRef.current);
    setHistoryLength(historyRef.current.length);
  };

  const setResultObject = (blob: Blob | null) => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);

    if (!blob) {
      resultUrlRef.current = null;
      setResultBlob(null);
      setResultUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    resultUrlRef.current = objectUrl;
    setResultBlob(blob);
    setResultUrl(objectUrl);
  };

  const resetEditorState = () => {
    originalImageDataRef.current = null;
    workingImageDataRef.current = null;
    historyRef.current = [];
    historyIndexRef.current = -1;
    isPaintingRef.current = false;
    strokeChangedRef.current = false;
    pendingEditorBlobRef.current = null;
    setEditorReady(false);
    syncHistoryState();
  };

  const clearResult = () => {
    setResultObject(null);
    resetEditorState();
    setResultZoom(1);
    setProgress(0);
    setProgressLabel('Sẵn sàng xử lý');
  };

  const resetTool = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setResultObject(null);
    resetEditorState();
    setFile(null);
    setPreviewUrl(null);
    setSourceZoom(1);
    setResultZoom(1);
    setError(null);
    setProgress(0);
    setProgressLabel('Sẵn sàng xử lý');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Chỉ hỗ trợ PNG, JPG/JPEG và WebP.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('Ảnh vượt quá giới hạn 12MB.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    clearResult();
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setSourceZoom(1);
    setError(null);
  };

  const drawWorkingImage = () => {
    const canvas = canvasRef.current;
    const workingImageData = workingImageDataRef.current;
    const context = canvas?.getContext('2d', { willReadFrequently: true });

    if (!canvas || !context || !workingImageData) return;
    context.putImageData(workingImageData, 0, 0);
  };

  const pushHistory = () => {
    const workingImageData = workingImageDataRef.current;
    if (!workingImageData) return;

    const currentSnapshot = historyRef.current[historyIndexRef.current];
    if (currentSnapshot && currentSnapshot.length === workingImageData.data.length) {
      let unchanged = true;
      for (let index = 0; index < currentSnapshot.length; index += 4) {
        if (currentSnapshot[index + 3] !== workingImageData.data[index + 3]) {
          unchanged = false;
          break;
        }
      }
      if (unchanged) return;
    }

    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(new Uint8ClampedArray(workingImageData.data));

    if (nextHistory.length > HISTORY_LIMIT) {
      nextHistory.shift();
    }

    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    syncHistoryState();
  };

  const updateResultFromCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) setResultObject(blob);
    }, 'image/png');
  };

  const initializeMaskEditor = async (sourceFile: File, outputBlob: Blob) => {
    const [sourceImage, outputImage] = await Promise.all([loadImage(sourceFile), loadImage(outputBlob)]);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = outputImage.naturalWidth || outputImage.width;
    const height = outputImage.naturalHeight || outputImage.height;
    canvas.width = width;
    canvas.height = height;

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = width;
    resultCanvas.height = height;
    const resultContext = resultCanvas.getContext('2d', { willReadFrequently: true });

    if (!sourceContext || !resultContext) {
      throw new Error('Canvas is not available');
    }

    sourceContext.drawImage(sourceImage, 0, 0, width, height);
    resultContext.drawImage(outputImage, 0, 0, width, height);

    originalImageDataRef.current = sourceContext.getImageData(0, 0, width, height);
    workingImageDataRef.current = resultContext.getImageData(0, 0, width, height);
    historyRef.current = [];
    historyIndexRef.current = -1;

    drawWorkingImage();
    pushHistory();
    setEditorReady(true);
  };

  const applyInitialAlphaControls = async (outputBlob: Blob) => {
    if (alphaCutoff === 0 && alphaContrast === 100 && alphaRecovery === 0) {
      return outputBlob;
    }

    const image = await loadImage(outputBlob);
    const canvas = document.createElement('canvas');
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return outputBlob;

    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const contrast = alphaContrast / 100;
    const recovery = alphaRecovery / 100;

    for (let index = 3; index < imageData.data.length; index += 4) {
      const alpha = imageData.data[index];

      if (alpha <= alphaCutoff) {
        imageData.data[index] = 0;
        continue;
      }

      const normalized = (alpha - alphaCutoff) / Math.max(1, 255 - alphaCutoff);
      const contrasted = Math.min(1, Math.max(0, 0.5 + (normalized - 0.5) * contrast));
      const recovered = contrasted + (1 - contrasted) * recovery;
      imageData.data[index] = Math.round(recovered * 255);
    }

    context.putImageData(imageData, 0, 0);

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob || outputBlob), 'image/png');
    });
  };

  useEffect(() => {
    const pendingBlob = pendingEditorBlobRef.current;
    if (!pendingBlob || !file || !resultUrl || !canvasRef.current) return;

    pendingEditorBlobRef.current = null;
    initializeMaskEditor(file, pendingBlob).catch((editorError) => {
      console.error('Mask editor error:', editorError);
      setError('Đã tách nền xong nhưng không thể mở trình sửa mask. Hãy thử ảnh nhỏ hơn.');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, resultUrl]);

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const paintAt = (x: number, y: number) => {
    const originalImageData = originalImageDataRef.current;
    const workingImageData = workingImageDataRef.current;
    const canvas = canvasRef.current;
    if (!originalImageData || !workingImageData || !canvas) return;

    const radius = brushSize / 2;
    const radiusSquared = radius * radius;
    const opacity = brushOpacity / 100;
    const minX = Math.max(0, Math.floor(x - radius));
    const maxX = Math.min(canvas.width - 1, Math.ceil(x + radius));
    const minY = Math.max(0, Math.floor(y - radius));
    const maxY = Math.min(canvas.height - 1, Math.ceil(y + radius));

    for (let pixelY = minY; pixelY <= maxY; pixelY += 1) {
      for (let pixelX = minX; pixelX <= maxX; pixelX += 1) {
        const distanceX = pixelX - x;
        const distanceY = pixelY - y;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;

        if (distanceSquared > radiusSquared) continue;

        const distance = Math.sqrt(distanceSquared);
        const edgeStrength = softBrush ? Math.max(0, 1 - distance / radius) : 1;
        const strength = opacity * edgeStrength;
        const index = (pixelY * canvas.width + pixelX) * 4;

        if (brushMode === 'restore') {
          const originalAlpha = originalImageData.data[index + 3];
          const currentAlpha = workingImageData.data[index + 3];
          workingImageData.data[index] = Math.round(
            workingImageData.data[index] + (originalImageData.data[index] - workingImageData.data[index]) * strength
          );
          workingImageData.data[index + 1] = Math.round(
            workingImageData.data[index + 1] + (originalImageData.data[index + 1] - workingImageData.data[index + 1]) * strength
          );
          workingImageData.data[index + 2] = Math.round(
            workingImageData.data[index + 2] + (originalImageData.data[index + 2] - workingImageData.data[index + 2]) * strength
          );
          workingImageData.data[index + 3] = Math.round(currentAlpha + (originalAlpha - currentAlpha) * strength);
        } else {
          const currentAlpha = workingImageData.data[index + 3];
          workingImageData.data[index + 3] = Math.round(currentAlpha * (1 - strength));
        }
      }
    }

    strokeChangedRef.current = true;
    drawWorkingImage();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editorReady || isProcessing) return;
    const point = getCanvasPoint(event);
    if (!point) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    isPaintingRef.current = true;
    strokeChangedRef.current = false;
    paintAt(point.x, point.y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current || !editorReady || isProcessing) return;
    const point = getCanvasPoint(event);
    if (!point) return;

    paintAt(point.x, point.y);
  };

  const finishBrushStroke = () => {
    if (!isPaintingRef.current) return;

    isPaintingRef.current = false;
    if (strokeChangedRef.current) {
      pushHistory();
      updateResultFromCanvas();
    }
  };

  const applyHistorySnapshot = (nextIndex: number) => {
    const workingImageData = workingImageDataRef.current;
    const snapshot = historyRef.current[nextIndex];
    if (!workingImageData || !snapshot) return;

    workingImageData.data.set(snapshot);
    historyIndexRef.current = nextIndex;
    drawWorkingImage();
    syncHistoryState();
    updateResultFromCanvas();
  };

  const undoEdit = () => {
    if (historyIndexRef.current <= 0) return;
    applyHistorySnapshot(historyIndexRef.current - 1);
  };

  const redoEdit = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    applyHistorySnapshot(historyIndexRef.current + 1);
  };

  const resetMaskEdits = () => {
    if (!historyRef.current[0]) return;
    applyHistorySnapshot(0);
  };

  const cropToVisibleContent = () => {
    const canvas = canvasRef.current;
    const workingImageData = workingImageDataRef.current;
    const originalImageData = originalImageDataRef.current;
    if (!canvas || !workingImageData || !originalImageData) return;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const alpha = workingImageData.data[(y * canvas.width + x) * 4 + 3];
        if (alpha <= 8) continue;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) {
      setError('Không tìm thấy vùng chủ thể đủ rõ để crop.');
      return;
    }

    const left = Math.max(0, minX - cropPadding);
    const top = Math.max(0, minY - cropPadding);
    const right = Math.min(canvas.width - 1, maxX + cropPadding);
    const bottom = Math.min(canvas.height - 1, maxY + cropPadding);
    const nextWidth = right - left + 1;
    const nextHeight = bottom - top + 1;

    if (nextWidth === canvas.width && nextHeight === canvas.height) {
      setError('Ảnh hiện đã sát vùng chủ thể theo mức viền đang chọn.');
      return;
    }

    const cropImageData = (imageData: ImageData) => {
      const cropped = new ImageData(nextWidth, nextHeight);

      for (let y = 0; y < nextHeight; y += 1) {
        for (let x = 0; x < nextWidth; x += 1) {
          const sourceIndex = ((top + y) * canvas.width + (left + x)) * 4;
          const targetIndex = (y * nextWidth + x) * 4;
          cropped.data[targetIndex] = imageData.data[sourceIndex];
          cropped.data[targetIndex + 1] = imageData.data[sourceIndex + 1];
          cropped.data[targetIndex + 2] = imageData.data[sourceIndex + 2];
          cropped.data[targetIndex + 3] = imageData.data[sourceIndex + 3];
        }
      }

      return cropped;
    };

    const croppedWorkingImageData = cropImageData(workingImageData);
    const croppedOriginalImageData = cropImageData(originalImageData);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    canvas.width = nextWidth;
    canvas.height = nextHeight;
    originalImageDataRef.current = croppedOriginalImageData;
    workingImageDataRef.current = croppedWorkingImageData;
    historyRef.current = [];
    historyIndexRef.current = -1;
    context.putImageData(croppedWorkingImageData, 0, 0);
    pushHistory();
    updateResultFromCanvas();
    setError(null);
  };

  const removeBackground = async () => {
    if (!file) {
      setError('Vui lòng chọn ảnh trước khi tách nền.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    clearResult();
    setProgressLabel('Đang chuẩn bị model...');

    try {
      const { removeBackground: removeImageBackground } = await import('@imgly/background-removal');
      const config: Config = {
        publicPath: `${window.location.origin}/vendor/background-removal/`,
        model,
        device,
        output: {
          format: 'image/png',
          quality: 0.95,
        },
        progress: (key, current, total) => {
          const percent = total > 0 ? Math.round((current / total) * 100) : 0;
          setProgress(percent);
          setProgressLabel(
            total > 0
              ? `Đang tải ${key}: ${formatFileSize(current)} / ${formatFileSize(total)}`
              : `Đang tải ${key}...`
          );
        },
      };

      const output = await removeImageBackground(file, config);
      const controlledOutput = await applyInitialAlphaControls(output);
      setResultObject(controlledOutput);
      pendingEditorBlobRef.current = controlledOutput;
      setProgress(100);
      setProgressLabel('Tách nền hoàn tất');
    } catch (processingError) {
      console.error('Background removal error:', processingError);
      setError('Không thể tách nền ảnh này. Hãy thử ảnh nhỏ hơn hoặc đổi chế độ xử lý.');
      setProgressLabel('Xử lý thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultBlob && !canvasRef.current) return;

    const baseName = file?.name.replace(/\.[^.]+$/, '') || 'background-removed';
    const triggerDownload = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseName}-transparent.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    if (editorReady && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) triggerDownload(blob);
      }, 'image/png');
      return;
    }

    if (resultBlob) triggerDownload(resultBlob);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b border-brand-orange/25 bg-cyber-gray dragon-grid py-10">
        <div className="container mx-auto px-6">
          <Link
            href="/utility-hub"
            className="mb-8 inline-flex items-center gap-2 border border-brand-orange/35 px-4 py-2 font-orbitron text-xs font-bold uppercase tracking-widest text-brand-orange transition-all hover:bg-brand-orange/10 cyber-cut-sm"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Utility Hub
          </Link>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-3 border border-brand-orange/45 bg-brand-orange/10 px-4 py-2 text-brand-orange tech-mono">
                <Eraser size={14} aria-hidden="true" />
                IMAGE TOOLKIT / BACKGROUND REMOVER
              </div>
              <h1 className="cyber-h1">
                Tách nền ảnh <span className="cyber-text-gradient">trên trình duyệt</span>
              </h1>
              <p className="body-lg mt-5 max-w-3xl text-muted">
                Ảnh được xử lý ngay trên máy của bạn bằng model browser-side. Không upload file lên server, không dùng
                Netlify Function để chạy AI, phù hợp deploy production trên Netlify.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm lg:min-w-[20rem]">
              <div className="border border-brand-orange/25 bg-cyber-black/40 p-4 cyber-cut-sm">
                <p className="tech-mono text-brand-orange !text-[9px]">RIÊNG TƯ</p>
                <p className="mt-2 font-orbitron font-bold">Client-side</p>
              </div>
              <div className="border border-brand-orange/25 bg-cyber-black/40 p-4 cyber-cut-sm">
                <p className="tech-mono text-brand-orange !text-[9px]">KẾT QUẢ</p>
                <p className="mt-2 font-orbitron font-bold">PNG trong suốt</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-10">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="border border-brand-orange/25 bg-cyber-black/45 p-6 cyber-cut">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="tech-mono text-brand-orange !text-[9px]">SOURCE IMAGE</p>
                <h2 className="mt-2 font-orbitron text-2xl font-bold">Ảnh đầu vào</h2>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {previewUrl && (
                  <div className="flex items-center border border-brand-orange/25 cyber-cut-sm">
                    <button
                      type="button"
                      onClick={() => setSourceZoom((value) => clampZoom(value - 0.25))}
                      className="inline-flex h-10 w-10 items-center justify-center text-brand-orange transition-colors hover:bg-brand-orange/10"
                      title="Thu nhỏ ảnh gốc"
                    >
                      <ZoomOut size={17} aria-hidden="true" />
                    </button>
                    <span className="min-w-14 px-2 text-center tech-mono text-muted !text-[9px]">{Math.round(sourceZoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setSourceZoom((value) => clampZoom(value + 0.25))}
                      className="inline-flex h-10 w-10 items-center justify-center text-brand-orange transition-colors hover:bg-brand-orange/10"
                      title="Phóng to ảnh gốc"
                    >
                      <ZoomIn size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceZoom(1)}
                      className="border-l border-brand-orange/25 px-3 font-orbitron text-[10px] font-bold uppercase text-brand-orange transition-colors hover:bg-brand-orange/10"
                    >
                      1x
                    </button>
                  </div>
                )}
                {file && (
                  <button
                    type="button"
                    onClick={resetTool}
                    className="inline-flex h-10 w-10 items-center justify-center border border-red-500/35 text-red-400 transition-colors hover:bg-red-500/10 cyber-cut-sm"
                    title="Xóa ảnh"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <label className="flex min-h-[380px] cursor-pointer flex-col items-center justify-center overflow-auto border border-dashed border-brand-orange/35 bg-background/60 p-6 text-center transition-colors hover:bg-brand-orange/5 cyber-cut">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Ảnh gốc"
                  className="max-h-[350px] max-w-full object-contain shadow-[0_0_80px_-30px_rgba(255,87,34,0.45)]"
                  style={{ transform: `scale(${sourceZoom})`, transformOrigin: 'center', transition: 'transform 160ms ease' }}
                />
              ) : (
                <>
                  <div className="mb-6 flex h-20 w-20 items-center justify-center border border-brand-orange/50 bg-brand-orange/10 text-brand-orange cyber-cut-sm">
                    <ImageUp size={36} aria-hidden="true" />
                  </div>
                  <p className="font-orbitron text-xl font-bold">Chọn ảnh để tách nền</p>
                  <p className="body-base mt-3 max-w-sm text-muted">
                    Ảnh nhân vật, sản phẩm, mô hình robot hoặc sticker có chủ thể rõ sẽ cho kết quả tốt nhất.
                  </p>
                </>
              )}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
            </label>

            {file && (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
                <span className="inline-flex items-center gap-2 border border-brand-orange/25 px-3 py-2 tech-mono">
                  <FileImage size={14} aria-hidden="true" />
                  {file.name}
                </span>
                <span className="border border-brand-orange/25 px-3 py-2 tech-mono">{formatFileSize(file.size)}</span>
              </div>
            )}

            {error && (
              <div className="mt-5 border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 cyber-cut-sm">
                {error}
              </div>
            )}
          </section>

          <section className="border border-brand-orange/25 bg-cyber-black/45 p-6 cyber-cut">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="tech-mono text-brand-orange !text-[9px]">TRANSPARENT OUTPUT</p>
                <h2 className="mt-2 font-orbitron text-2xl font-bold">Kết quả tách nền</h2>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {resultUrl && (
                  <div className="flex items-center border border-brand-orange/25 cyber-cut-sm">
                    <button
                      type="button"
                      onClick={() => setResultZoom((value) => clampZoom(value - 0.25))}
                      className="inline-flex h-10 w-10 items-center justify-center text-brand-orange transition-colors hover:bg-brand-orange/10"
                      title="Thu nhỏ kết quả"
                    >
                      <ZoomOut size={17} aria-hidden="true" />
                    </button>
                    <span className="min-w-14 px-2 text-center tech-mono text-muted !text-[9px]">{Math.round(resultZoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setResultZoom((value) => clampZoom(value + 0.25))}
                      className="inline-flex h-10 w-10 items-center justify-center text-brand-orange transition-colors hover:bg-brand-orange/10"
                      title="Phóng to kết quả"
                    >
                      <ZoomIn size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultZoom(1)}
                      className="border-l border-brand-orange/25 px-3 font-orbitron text-[10px] font-bold uppercase text-brand-orange transition-colors hover:bg-brand-orange/10"
                    >
                      1x
                    </button>
                  </div>
                )}
                {(['transparent', 'white', 'dark', 'brand'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPreviewBackground(item)}
                    className={`inline-flex h-10 items-center justify-center border px-3 font-orbitron text-[10px] font-bold uppercase transition-colors cyber-cut-sm ${
                      previewBackground === item
                        ? 'border-brand-orange bg-brand-orange text-white'
                        : 'border-brand-orange/35 text-brand-orange hover:bg-brand-orange/10'
                    }`}
                  >
                    {item === 'transparent' ? 'Grid' : item}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`relative flex min-h-[380px] items-center justify-center overflow-auto border border-brand-orange/20 p-8 cyber-cut ${backgroundClass[previewBackground]}`}
            >
              {isProcessing ? (
                <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-5 rounded-lg border border-slate-950/10 bg-white/90 p-6 text-slate-950 shadow-2xl">
                  <Loader2 size={48} className="animate-spin text-brand-orange" aria-hidden="true" />
                  <p className="font-orbitron text-sm font-bold uppercase tracking-widest">Đang tách nền...</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-brand-orange transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-center text-xs font-semibold text-slate-600">{progressLabel}</p>
                </div>
              ) : resultUrl ? (
                <canvas
                  ref={canvasRef}
                  aria-label="Vùng chỉnh sửa mask tách nền"
                  className="relative z-10 max-h-[350px] max-w-full touch-none object-contain"
                  style={{
                    cursor: editorReady ? 'crosshair' : 'default',
                    transform: `scale(${resultZoom})`,
                    transformOrigin: 'center',
                    transition: 'transform 160ms ease',
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finishBrushStroke}
                  onPointerCancel={finishBrushStroke}
                  onPointerLeave={finishBrushStroke}
                />
              ) : (
                <div className="relative z-10 flex flex-col items-center gap-4 text-center text-slate-500">
                  <Eraser size={72} strokeWidth={1.5} aria-hidden="true" />
                  <p className="font-orbitron text-lg font-bold">Kết quả PNG trong suốt sẽ xuất hiện ở đây</p>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-2 border border-brand-orange/25 px-3 py-2 tech-mono text-muted">
                  <ShieldCheck size={14} aria-hidden="true" />
                  Ảnh không rời khỏi trình duyệt
                </span>
                {resultStats && <span className="border border-brand-orange/25 px-3 py-2 tech-mono text-muted">{resultStats}</span>}
              </div>
              <button
                type="button"
                onClick={downloadResult}
                disabled={!resultBlob}
                className="inline-flex items-center justify-center gap-2 border border-brand-orange/50 bg-brand-orange px-5 py-3 font-orbitron text-sm font-bold uppercase text-white transition-all hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:border-brand-orange/25 disabled:bg-transparent disabled:text-muted cyber-cut-sm"
              >
                <Download size={17} aria-hidden="true" />
                Tải PNG
              </button>
            </div>

            {resultUrl && (
              <div className="mt-5 border border-brand-orange/25 bg-background/75 p-4 cyber-cut-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr_auto] lg:items-end">
                  <div>
                    <p className="tech-mono text-brand-orange !text-[9px]">PRODUCT CROP</p>
                    <h3 className="mt-1 font-orbitron text-lg font-bold">Crop ảnh sản phẩm</h3>
                    <p className="mt-2 text-sm text-muted">Cắt sát vùng còn alpha sau khi tách nền, tiện đăng web hoặc đưa vào slide.</p>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center justify-between gap-3 tech-mono text-muted !text-[9px]">
                      VIỀN GIỮ LẠI
                      <span className="text-brand-orange">{cropPadding}px</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="160"
                      value={cropPadding}
                      onChange={(event) => setCropPadding(Number(event.target.value))}
                      className="h-2 w-full accent-brand-orange"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={cropToVisibleContent}
                    disabled={!editorReady}
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-brand-orange bg-brand-orange px-5 py-3 font-orbitron text-xs font-bold uppercase text-white transition-all hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:border-brand-orange/25 disabled:bg-transparent disabled:text-muted cyber-cut-sm"
                  >
                    <Crop size={16} aria-hidden="true" />
                    Cắt sát chủ thể
                  </button>
                </div>
              </div>
            )}

            {resultUrl && (
              <div className="mt-5 border border-brand-orange/25 bg-background/75 p-4 cyber-cut-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="tech-mono text-brand-orange !text-[9px]">MASK REPAIR BRUSH</p>
                    <h3 className="mt-1 font-orbitron text-lg font-bold">Chỉnh thủ công vùng trong suốt</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={undoEdit}
                      disabled={historyCursor <= 0}
                      className="inline-flex h-10 w-10 items-center justify-center border border-brand-orange/35 text-brand-orange transition-colors hover:bg-brand-orange/10 disabled:cursor-not-allowed disabled:border-brand-orange/15 disabled:text-muted cyber-cut-sm"
                      title="Hoàn tác nét cọ"
                    >
                      <Undo2 size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={redoEdit}
                      disabled={historyCursor < 0 || historyCursor >= historyLength - 1}
                      className="inline-flex h-10 w-10 items-center justify-center border border-brand-orange/35 text-brand-orange transition-colors hover:bg-brand-orange/10 disabled:cursor-not-allowed disabled:border-brand-orange/15 disabled:text-muted cyber-cut-sm"
                      title="Làm lại nét cọ"
                    >
                      <Redo2 size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={resetMaskEdits}
                      disabled={!editorReady || historyLength <= 1}
                      className="inline-flex h-10 w-10 items-center justify-center border border-brand-orange/35 text-brand-orange transition-colors hover:bg-brand-orange/10 disabled:cursor-not-allowed disabled:border-brand-orange/15 disabled:text-muted cyber-cut-sm"
                      title="Khôi phục mask AI ban đầu"
                    >
                      <RotateCcw size={17} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
                  <div>
                    <p className="mb-2 tech-mono text-muted !text-[9px]">CHẾ ĐỘ CỌ</p>
                    <div className="grid grid-cols-2 border border-brand-orange/25 p-1 cyber-cut-sm">
                      {(['restore', 'erase'] as const).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setBrushMode(item)}
                          className={`inline-flex items-center justify-center gap-2 px-3 py-3 font-orbitron text-xs font-bold uppercase transition-colors ${
                            brushMode === item ? 'bg-brand-orange text-white' : 'text-muted hover:bg-brand-orange/10'
                          }`}
                        >
                          {item === 'restore' ? <Brush size={15} aria-hidden="true" /> : <Eraser size={15} aria-hidden="true" />}
                          {item === 'restore' ? 'Giữ lại' : 'Xóa thêm'}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      Giữ lại phục hồi chi tiết bị trong suốt nhầm; Xóa thêm làm sạch nền còn sót.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center justify-between gap-3 tech-mono text-muted !text-[9px]">
                      KÍCH THƯỚC CỌ
                      <span className="text-brand-orange">{brushSize}px</span>
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="160"
                      value={brushSize}
                      onChange={(event) => setBrushSize(Number(event.target.value))}
                      className="h-2 w-full accent-brand-orange"
                    />
                    <label className="mb-2 mt-4 flex items-center justify-between gap-3 tech-mono text-muted !text-[9px]">
                      ĐỘ MẠNH
                      <span className="text-brand-orange">{brushOpacity}%</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={brushOpacity}
                      onChange={(event) => setBrushOpacity(Number(event.target.value))}
                      className="h-2 w-full accent-brand-orange"
                    />
                  </div>

                  <div>
                    <p className="mb-2 tech-mono text-muted !text-[9px]">MÉP CỌ</p>
                    <div className="grid grid-cols-2 border border-brand-orange/25 p-1 cyber-cut-sm">
                      {[true, false].map((item) => (
                        <button
                          key={String(item)}
                          type="button"
                          onClick={() => setSoftBrush(item)}
                          className={`px-3 py-3 font-orbitron text-xs font-bold uppercase transition-colors ${
                            softBrush === item ? 'bg-brand-orange text-white' : 'text-muted hover:bg-brand-orange/10'
                          }`}
                        >
                          {item ? 'Mềm' : 'Cứng'}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      Cọ mềm hợp sửa tóc, viền áo và chi tiết mờ; cọ cứng hợp xóa mảng nền rõ ràng.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 border border-brand-orange/25 bg-cyber-black/45 p-6 cyber-cut">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="tech-mono text-brand-orange !text-[9px]">MODEL CONTROL</p>
              <h2 className="mt-2 font-orbitron text-2xl font-bold">Tùy chọn xử lý</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setModel('isnet_quint8');
                setDevice('cpu');
                setAlphaCutoff(8);
                setAlphaContrast(100);
                setAlphaRecovery(10);
              }}
              className="inline-flex items-center gap-2 border border-brand-orange/35 px-4 py-2 font-orbitron text-xs font-bold uppercase text-brand-orange transition-colors hover:bg-brand-orange/10 cyber-cut-sm"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Reset mặc định
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_1.4fr]">
            <div>
              <p className="mb-3 tech-mono text-muted !text-[9px]">MODEL</p>
              <div className="grid grid-cols-2 border border-brand-orange/25 p-1 cyber-cut-sm">
                {(['isnet_quint8', 'isnet_fp16'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setModel(item)}
                    className={`px-4 py-3 font-orbitron text-xs font-bold uppercase transition-colors ${
                      model === item ? 'bg-brand-orange text-white' : 'text-muted hover:bg-brand-orange/10'
                    }`}
                  >
                    {item === 'isnet_quint8' ? 'Nhanh' : 'Chi tiết'}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">Nhanh tải nhẹ hơn; Chi tiết dùng model lớn hơn và xử lý lâu hơn.</p>
            </div>

            <div>
              <p className="mb-3 tech-mono text-muted !text-[9px]">DEVICE</p>
              <div className="grid grid-cols-2 border border-brand-orange/25 p-1 cyber-cut-sm">
                {(['cpu', 'gpu'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDevice(item)}
                    className={`px-4 py-3 font-orbitron text-xs font-bold uppercase transition-colors ${
                      device === item ? 'bg-brand-orange text-white' : 'text-muted hover:bg-brand-orange/10'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">GPU dùng WebGPU nếu trình duyệt hỗ trợ, CPU ổn định hơn.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-brand-orange/20 bg-background/50 p-4 cyber-cut-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center border border-brand-orange/35 text-brand-orange cyber-cut-sm">
                  <CheckCircle2 size={18} aria-hidden="true" />
                </div>
                <p className="font-orbitron text-sm font-bold uppercase">Netlify friendly</p>
                <p className="mt-2 text-sm text-muted">Không chạy AI trên server function, giảm rủi ro timeout.</p>
              </div>
              <div className="border border-brand-orange/20 bg-background/50 p-4 cyber-cut-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center border border-brand-orange/35 text-brand-orange cyber-cut-sm">
                  <Palette size={18} aria-hidden="true" />
                </div>
                <p className="font-orbitron text-sm font-bold uppercase">Preview nền</p>
                <p className="mt-2 text-sm text-muted">Đổi nền xem nhanh nhưng file tải về vẫn là PNG trong suốt.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 border border-brand-orange/25 bg-background/60 p-5 cyber-cut-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="tech-mono text-brand-orange !text-[9px]">INITIAL ALPHA CONTROL</p>
                <h3 className="mt-1 font-orbitron text-xl font-bold">Thiết lập mask ban đầu</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAlphaCutoff(8);
                  setAlphaContrast(100);
                  setAlphaRecovery(10);
                }}
                className="inline-flex items-center gap-2 border border-brand-orange/35 px-4 py-2 font-orbitron text-xs font-bold uppercase text-brand-orange transition-colors hover:bg-brand-orange/10 cyber-cut-sm"
              >
                <RotateCcw size={15} aria-hidden="true" />
                Reset alpha
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div>
                <label className="mb-2 flex items-center justify-between gap-3 tech-mono text-muted !text-[9px]">
                  NGƯỠNG XÓA VÙNG MỜ
                  <span className="text-brand-orange">{alphaCutoff}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={alphaCutoff}
                  onChange={(event) => setAlphaCutoff(Number(event.target.value))}
                  className="h-2 w-full accent-brand-orange"
                />
                <p className="mt-2 text-sm text-muted">Tăng để dọn viền nền bị ám mờ; giảm để giữ chi tiết rất nhạt.</p>
              </div>

              <div>
                <label className="mb-2 flex items-center justify-between gap-3 tech-mono text-muted !text-[9px]">
                  ĐỘ NÉT MASK
                  <span className="text-brand-orange">{alphaContrast}%</span>
                </label>
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={alphaContrast}
                  onChange={(event) => setAlphaContrast(Number(event.target.value))}
                  className="h-2 w-full accent-brand-orange"
                />
                <p className="mt-2 text-sm text-muted">Tăng để mask dứt khoát hơn; giảm để mép chuyển mềm hơn.</p>
              </div>

              <div>
                <label className="mb-2 flex items-center justify-between gap-3 tech-mono text-muted !text-[9px]">
                  PHỤC HỒI ALPHA YẾU
                  <span className="text-brand-orange">{alphaRecovery}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={alphaRecovery}
                  onChange={(event) => setAlphaRecovery(Number(event.target.value))}
                  className="h-2 w-full accent-brand-orange"
                />
                <p className="mt-2 text-sm text-muted">Tăng khi chủ thể bị trong suốt nhầm ở tóc, mép áo, chi tiết nhỏ.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={removeBackground}
              disabled={!file || isProcessing}
              className="inline-flex min-h-12 items-center justify-center gap-3 border border-brand-orange bg-brand-orange px-6 py-3 font-orbitron text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:border-brand-orange/25 disabled:bg-transparent disabled:text-muted cyber-cut-sm"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Eraser size={18} aria-hidden="true" />}
              Tách nền ảnh
            </button>
            <span className="inline-flex items-center gap-2 border border-brand-orange/25 px-4 py-3 tech-mono text-muted">
              <Sparkles size={15} aria-hidden="true" />
              Lần đầu tải model sẽ lâu hơn
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
