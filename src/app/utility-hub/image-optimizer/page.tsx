'use client';

/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileImage,
  Gauge,
  ImageUp,
  Loader2,
  Minimize2,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

type OutputFormat = 'image/webp' | 'image/jpeg' | 'image/png';
type OptimizerPreset = 'balanced' | 'small' | 'quality' | 'lossless';

type ImageInfo = {
  width: number;
  height: number;
};

type OptimizedFile = {
  blob: Blob;
  url: string;
  name: string;
  format: OutputFormat;
  width: number;
  height: number;
};

const MAX_FILE_SIZE = 28 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

const presetOptions: Array<{
  value: OptimizerPreset;
  label: string;
  hint: string;
  quality: number;
  maxEdge: number;
  format: OutputFormat;
}> = [
  {
    value: 'balanced',
    label: 'Cân bằng',
    hint: 'Phù hợp ảnh blog, giữ nét tốt và file nhẹ.',
    quality: 84,
    maxEdge: 1800,
    format: 'image/webp',
  },
  {
    value: 'small',
    label: 'File nhẹ',
    hint: 'Ưu tiên tốc độ tải, phù hợp ảnh minh họa nhiều.',
    quality: 72,
    maxEdge: 1400,
    format: 'image/webp',
  },
  {
    value: 'quality',
    label: 'Chất lượng cao',
    hint: 'Giữ chi tiết cho poster, robotics field và ảnh kỹ thuật.',
    quality: 92,
    maxEdge: 2400,
    format: 'image/webp',
  },
  {
    value: 'lossless',
    label: 'Giữ PNG',
    hint: 'Dùng cho logo, icon, ảnh cần nền trong suốt.',
    quality: 100,
    maxEdge: 2400,
    format: 'image/png',
  },
];

const outputOptions: Array<{ value: OutputFormat; label: string; extension: string }> = [
  { value: 'image/webp', label: 'WebP', extension: 'webp' },
  { value: 'image/jpeg', label: 'JPG', extension: 'jpg' },
  { value: 'image/png', label: 'PNG', extension: 'png' },
];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function getExtension(format: OutputFormat) {
  return outputOptions.find((option) => option.value === format)?.extension || 'webp';
}

function getBaseName(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'optimized-image';
}

function loadImageFromFile(file: File) {
  return new Promise<{ image: HTMLImageElement; url: string }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể đọc ảnh. Hãy thử file khác.'));
    };
    image.src = url;
  });
}

function calculateOutputSize(source: ImageInfo, maxEdge: number) {
  const safeMaxEdge = Math.max(1, maxEdge || Math.max(source.width, source.height));
  const ratio = Math.min(safeMaxEdge / Math.max(source.width, source.height), 1);

  return {
    width: Math.max(1, Math.round(source.width * ratio)),
    height: Math.max(1, Math.round(source.height * ratio)),
  };
}

function drawImageToCanvas(image: HTMLImageElement, width: number, height: number, format: OutputFormat) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ Canvas 2D.');

  if (format === 'image/jpeg') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  } else {
    context.clearRect(0, 0, width, height);
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, format: OutputFormat, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Trình duyệt chưa hỗ trợ xuất định dạng này. Hãy thử WebP, JPG hoặc PNG.'));
          return;
        }
        if (format !== 'image/png' && blob.type && blob.type !== format) {
          reject(new Error('Trình duyệt chưa hỗ trợ encode định dạng này. Hãy thử WebP hoặc JPG.'));
          return;
        }
        resolve(blob);
      },
      format,
      format === 'image/png' ? undefined : quality,
    );
  });
}

export default function ImageOptimizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceInfo, setSourceInfo] = useState<ImageInfo | null>(null);
  const [preset, setPreset] = useState<OptimizerPreset>('balanced');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState(84);
  const [maxEdge, setMaxEdge] = useState(1800);
  const [optimizedFile, setOptimizedFile] = useState<OptimizedFile | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outputSize = useMemo(() => {
    if (!sourceInfo) return null;
    return calculateOutputSize(sourceInfo, maxEdge);
  }, [sourceInfo, maxEdge]);

  const savedPercent = useMemo(() => {
    if (!file || !optimizedFile) return null;
    return Math.round(100 - (optimizedFile.blob.size / file.size) * 100);
  }, [file, optimizedFile]);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  useEffect(() => {
    return () => {
      if (optimizedFile?.url) URL.revokeObjectURL(optimizedFile.url);
    };
  }, [optimizedFile?.url]);

  const clearOptimizedFile = () => {
    if (optimizedFile?.url) URL.revokeObjectURL(optimizedFile.url);
    setOptimizedFile(null);
  };

  const applyPreset = (nextPreset: OptimizerPreset) => {
    const option = presetOptions.find((item) => item.value === nextPreset);
    if (!option) return;

    setPreset(nextPreset);
    setQuality(option.quality);
    setMaxEdge(option.maxEdge);
    setOutputFormat(option.format);
    clearOptimizedFile();
  };

  const resetTool = () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (optimizedFile?.url) URL.revokeObjectURL(optimizedFile.url);
    setFile(null);
    setSourceUrl(null);
    setSourceInfo(null);
    setOptimizedFile(null);
    setError(null);
    setPreset('balanced');
    setOutputFormat('image/webp');
    setQuality(84);
    setMaxEdge(1800);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Chỉ hỗ trợ PNG, JPG/JPEG, WebP và AVIF.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('Ảnh vượt quá giới hạn 28MB.');
      return;
    }

    try {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      clearOptimizedFile();

      const { image, url } = await loadImageFromFile(selectedFile);
      setFile(selectedFile);
      setSourceUrl(url);
      setSourceInfo({ width: image.naturalWidth, height: image.naturalHeight });
      setMaxEdge(Math.min(1800, Math.max(image.naturalWidth, image.naturalHeight)));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể đọc ảnh.');
    }
  };

  const optimizeImage = async () => {
    if (!file || !sourceInfo || !outputSize) {
      setError('Vui lòng chọn ảnh trước khi tối ưu.');
      return;
    }

    setIsOptimizing(true);
    setError(null);
    clearOptimizedFile();

    let objectUrl = '';

    try {
      const loaded = await loadImageFromFile(file);
      objectUrl = loaded.url;
      const canvas = drawImageToCanvas(loaded.image, outputSize.width, outputSize.height, outputFormat);
      const blob = await canvasToBlob(canvas, outputFormat, quality / 100);
      const resultUrl = URL.createObjectURL(blob);
      const resultName = `${getBaseName(file.name)}-optimized.${getExtension(outputFormat)}`;

      setOptimizedFile({
        blob,
        url: resultUrl,
        name: resultName,
        format: outputFormat,
        width: outputSize.width,
        height: outputSize.height,
      });
    } catch (optimizeError) {
      setError(optimizeError instanceof Error ? optimizeError.message : 'Không thể tối ưu ảnh.');
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setIsOptimizing(false);
    }
  };

  const downloadOptimizedFile = () => {
    if (!optimizedFile) return;

    const link = document.createElement('a');
    link.href = optimizedFile.url;
    link.download = optimizedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <Gauge size={14} className="text-brand-orange" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Image Optimizer</span>
              </div>
              <h1 className="font-[family-name:var(--font-inter)] text-4xl font-black tracking-tight md:text-5xl">
                Nén và tối ưu ảnh
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/70">
                Giảm dung lượng ảnh cho bài viết, slide và học liệu mà vẫn giữ độ sắc nét cần thiết.
                Tool xử lý cục bộ trên trình duyệt, không upload ảnh lên server.
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm sm:grid-cols-3 lg:min-w-[420px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Ảnh gốc</p>
                <p className="mt-1 text-sm font-black">{file ? formatFileSize(file.size) : '--'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Sau nén</p>
                <p className="mt-1 text-sm font-black">{optimizedFile ? formatFileSize(optimizedFile.blob.size) : '--'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Tiết kiệm</p>
                <p className="mt-1 text-sm font-black">
                  {savedPercent === null ? '--' : savedPercent > 0 ? `-${savedPercent}%` : `+${Math.abs(savedPercent)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto grid gap-6 px-6 xl:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Nguồn ảnh</p>
                  <h2 className="mt-1 text-xl font-black">Upload local</h2>
                </div>
                <ImageUp className="text-brand-orange" size={24} aria-hidden="true" />
              </div>

              <label className="flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/20 bg-background p-6 text-center transition-colors hover:border-brand-orange/60 hover:bg-brand-orange/5">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <FileImage size={34} className="text-foreground/40" aria-hidden="true" />
                <span className="mt-4 text-sm font-black">Chọn ảnh để tối ưu</span>
                <span className="mt-2 text-xs leading-relaxed text-foreground/55">
                  PNG, JPG, WebP, AVIF. Tối đa 28MB.
                </span>
              </label>

              {file && (
                <div className="mt-4 rounded-xl border border-foreground/10 bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{file.name}</p>
                      <p className="mt-1 text-xs text-foreground/55">
                        {formatFileSize(file.size)}
                        {sourceInfo ? ` / ${sourceInfo.width} x ${sourceInfo.height}px` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetTool}
                      className="rounded-full border border-foreground/10 p-2 text-foreground/50 transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
                      aria-label="Xóa ảnh đã chọn"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <div className="mb-5 flex items-center gap-2">
                <Zap size={20} className="text-brand-orange" aria-hidden="true" />
                <h2 className="text-xl font-black">Preset tối ưu</h2>
              </div>

              <div className="grid gap-3">
                {presetOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => applyPreset(option.value)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      preset === option.value
                        ? 'border-brand-orange bg-brand-orange/10'
                        : 'border-foreground/10 bg-background hover:border-brand-orange/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-black">{option.label}</span>
                      {preset === option.value && <CheckCircle2 size={16} className="text-brand-orange" aria-hidden="true" />}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/55">{option.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <div className="mb-5 flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-brand-orange" aria-hidden="true" />
                <h2 className="text-xl font-black">Tinh chỉnh</h2>
              </div>

              <div className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Định dạng xuất</span>
                <div className="grid grid-cols-3 gap-2">
                  {outputOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setOutputFormat(option.value);
                        setPreset('balanced');
                        clearOptimizedFile();
                      }}
                      className={`rounded-full border px-3 py-2 text-xs font-black transition-colors ${
                        outputFormat === option.value
                          ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                          : 'border-foreground/10 bg-background text-foreground/60 hover:border-brand-orange/40'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {outputFormat !== 'image/png' && (
                <label className="mt-6 block">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Quality</span>
                    <span className="text-xs font-black text-brand-orange">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="100"
                    step="1"
                    value={quality}
                    onChange={(event) => {
                      setQuality(Number(event.target.value));
                      setPreset('balanced');
                      clearOptimizedFile();
                    }}
                    className="w-full accent-brand-orange"
                  />
                </label>
              )}

              <label className="mt-6 block">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Cạnh dài tối đa</span>
                  <span className="text-xs font-black text-brand-orange">{maxEdge}px</span>
                </div>
                <input
                  type="range"
                  min="640"
                  max="3200"
                  step="40"
                  value={maxEdge}
                  onChange={(event) => {
                    setMaxEdge(Number(event.target.value));
                    setPreset('balanced');
                    clearOptimizedFile();
                  }}
                  className="w-full accent-brand-orange"
                />
                {outputSize && (
                  <p className="mt-3 text-xs text-foreground/55">
                    Kết quả dự kiến: <span className="font-black text-foreground">{outputSize.width} x {outputSize.height}px</span>
                  </p>
                )}
              </label>

              {error && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-medium text-red-600 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={optimizeImage}
                  disabled={!file || isOptimizing}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-orange/20 transition-all hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isOptimizing ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Minimize2 size={16} aria-hidden="true" />}
                  Tối ưu ảnh
                </button>

                <button
                  type="button"
                  onClick={resetTool}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/10 px-5 py-3 text-sm font-black text-foreground/65 transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  Reset
                </button>
              </div>
            </div>
          </aside>

          <main className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="min-h-[440px] rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Preview nguồn</p>
                    <h2 className="mt-1 text-xl font-black">Ảnh gốc</h2>
                  </div>
                  <FileImage size={24} className="text-foreground/40" aria-hidden="true" />
                </div>

                <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-foreground/10 bg-background p-4">
                  {sourceUrl ? (
                    <img src={sourceUrl} alt="Ảnh gốc đang tối ưu" className="max-h-[520px] max-w-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <ImageUp size={38} className="mx-auto text-foreground/30" aria-hidden="true" />
                      <p className="mt-4 text-sm font-black text-foreground/60">Chưa có ảnh nguồn</p>
                      <p className="mt-2 text-xs text-foreground/45">Upload ảnh ở panel bên trái để bắt đầu.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="min-h-[440px] rounded-2xl border border-brand-orange/20 bg-brand-orange/[0.03] p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Preview tối ưu</p>
                    <h2 className="mt-1 text-xl font-black">Ảnh sau nén</h2>
                  </div>
                  <Sparkles size={24} className="text-brand-orange" aria-hidden="true" />
                </div>

                <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-brand-orange/15 bg-background p-4">
                  {optimizedFile ? (
                    <img src={optimizedFile.url} alt="Ảnh sau khi nén và tối ưu" className="max-h-[520px] max-w-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <Gauge size={38} className="mx-auto text-brand-orange/45" aria-hidden="true" />
                      <p className="mt-4 text-sm font-black text-foreground/60">Chưa có file tối ưu</p>
                      <p className="mt-2 text-xs text-foreground/45">Chọn preset rồi bấm tối ưu ảnh.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Gauge size={20} className="text-brand-orange" aria-hidden="true" />
                    <h2 className="text-xl font-black">Báo cáo tối ưu</h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    <div className="rounded-xl border border-foreground/10 bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Định dạng</p>
                      <p className="mt-2 text-sm font-black">{optimizedFile ? getExtension(optimizedFile.format).toUpperCase() : getExtension(outputFormat).toUpperCase()}</p>
                    </div>
                    <div className="rounded-xl border border-foreground/10 bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Kích thước</p>
                      <p className="mt-2 text-sm font-black">
                        {optimizedFile ? `${optimizedFile.width} x ${optimizedFile.height}px` : outputSize ? `${outputSize.width} x ${outputSize.height}px` : '--'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-foreground/10 bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Dung lượng gốc</p>
                      <p className="mt-2 text-sm font-black">{file ? formatFileSize(file.size) : '--'}</p>
                    </div>
                    <div className="rounded-xl border border-foreground/10 bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Sau nén</p>
                      <p className="mt-2 text-sm font-black">{optimizedFile ? formatFileSize(optimizedFile.blob.size) : '--'}</p>
                    </div>
                    <div className="rounded-xl border border-foreground/10 bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Tiết kiệm</p>
                      <p className="mt-2 text-sm font-black text-brand-orange">
                        {savedPercent === null ? '--' : savedPercent > 0 ? `-${savedPercent}%` : `+${Math.abs(savedPercent)}%`}
                      </p>
                    </div>
                    <div className="rounded-xl border border-foreground/10 bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Trạng thái</p>
                      <p className="mt-2 text-sm font-black text-brand-orange">{optimizedFile ? 'Sẵn sàng tải' : 'Đang chờ'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:min-w-[230px]">
                  <button
                    type="button"
                    onClick={downloadOptimizedFile}
                    disabled={!optimizedFile}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-lg shadow-brand-orange/20 transition-all hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Download size={16} aria-hidden="true" />
                    Tải ảnh tối ưu
                  </button>
                  <div className="inline-flex items-start gap-2 rounded-xl border border-foreground/10 bg-background p-3 text-xs leading-relaxed text-foreground/55">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-orange" aria-hidden="true" />
                    Canvas export sẽ loại bỏ phần lớn metadata nhúng, phù hợp khi chuẩn bị ảnh cho web/blog.
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </section>
    </div>
  );
}
