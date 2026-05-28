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
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';

type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';
type BackgroundMode = 'transparent' | 'white' | 'black' | 'brand';

type ImageInfo = {
  width: number;
  height: number;
};

type ConvertedFile = {
  blob: Blob;
  url: string;
  name: string;
  format: OutputFormat;
  width: number;
  height: number;
};

const MAX_FILE_SIZE = 24 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

const outputOptions: Array<{ value: OutputFormat; label: string; extension: string; hint: string }> = [
  {
    value: 'image/webp',
    label: 'WebP',
    extension: 'webp',
    hint: 'Cân bằng tốt cho web và blog.',
  },
  {
    value: 'image/jpeg',
    label: 'JPG',
    extension: 'jpg',
    hint: 'Nhẹ, hợp ảnh chụp, không giữ trong suốt.',
  },
  {
    value: 'image/png',
    label: 'PNG',
    extension: 'png',
    hint: 'Giữ trong suốt, hợp logo/icon.',
  },
  {
    value: 'image/avif',
    label: 'AVIF',
    extension: 'avif',
    hint: 'Rất nhẹ nếu trình duyệt hỗ trợ encode.',
  },
];

const backgroundOptions: Array<{ value: BackgroundMode; label: string; color: string }> = [
  { value: 'transparent', label: 'Trong suốt', color: 'transparent' },
  { value: 'white', label: 'Trắng', color: '#ffffff' },
  { value: 'black', label: 'Đen', color: '#020617' },
  { value: 'brand', label: 'Cam nhạt', color: '#fff1e8' },
];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function getExtension(format: OutputFormat) {
  return outputOptions.find((option) => option.value === format)?.extension || 'png';
}

function getBaseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'converted-image';
}

function getBackgroundColor(mode: BackgroundMode) {
  return backgroundOptions.find((option) => option.value === mode)?.color || 'transparent';
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

function calculateOutputSize(source: ImageInfo, resizeEnabled: boolean, maxWidth: number, maxHeight: number) {
  if (!resizeEnabled) return source;

  const safeMaxWidth = Math.max(1, maxWidth || source.width);
  const safeMaxHeight = Math.max(1, maxHeight || source.height);
  const ratio = Math.min(safeMaxWidth / source.width, safeMaxHeight / source.height, 1);

  return {
    width: Math.max(1, Math.round(source.width * ratio)),
    height: Math.max(1, Math.round(source.height * ratio)),
  };
}

function drawImageToCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
  format: OutputFormat,
  background: BackgroundMode,
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ Canvas 2D.');

  const shouldFillBackground = format === 'image/jpeg' || background !== 'transparent';
  if (shouldFillBackground) {
    context.fillStyle = background === 'transparent' ? '#ffffff' : getBackgroundColor(background);
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
          reject(new Error('Trình duyệt chưa hỗ trợ encode định dạng này. Hãy thử WebP, JPG hoặc PNG.'));
          return;
        }
        resolve(blob);
      },
      format,
      format === 'image/png' ? undefined : quality,
    );
  });
}

export default function ImageConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceInfo, setSourceInfo] = useState<ImageInfo | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState(88);
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [maxWidth, setMaxWidth] = useState(1600);
  const [maxHeight, setMaxHeight] = useState(1600);
  const [background, setBackground] = useState<BackgroundMode>('transparent');
  const [convertedFile, setConvertedFile] = useState<ConvertedFile | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outputSize = useMemo(() => {
    if (!sourceInfo) return null;
    return calculateOutputSize(sourceInfo, resizeEnabled, maxWidth, maxHeight);
  }, [sourceInfo, resizeEnabled, maxWidth, maxHeight]);

  const compressionRatio = useMemo(() => {
    if (!file || !convertedFile) return null;
    const ratio = 100 - (convertedFile.blob.size / file.size) * 100;
    return Math.round(ratio);
  }, [file, convertedFile]);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  useEffect(() => {
    return () => {
      if (convertedFile?.url) URL.revokeObjectURL(convertedFile.url);
    };
  }, [convertedFile?.url]);

  const clearConvertedFile = () => {
    if (convertedFile?.url) URL.revokeObjectURL(convertedFile.url);
    setConvertedFile(null);
  };

  const resetTool = () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (convertedFile?.url) URL.revokeObjectURL(convertedFile.url);
    setFile(null);
    setSourceUrl(null);
    setSourceInfo(null);
    setConvertedFile(null);
    setError(null);
    setResizeEnabled(false);
    setMaxWidth(1600);
    setMaxHeight(1600);
    setQuality(88);
    setBackground('transparent');
    setOutputFormat('image/webp');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Chỉ hỗ trợ PNG, JPG/JPEG, WebP và AVIF.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('Ảnh vượt quá giới hạn 24MB.');
      return;
    }

    try {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      clearConvertedFile();

      const { image, url } = await loadImageFromFile(selectedFile);
      setFile(selectedFile);
      setSourceUrl(url);
      setSourceInfo({ width: image.naturalWidth, height: image.naturalHeight });
      setMaxWidth(Math.min(1600, image.naturalWidth));
      setMaxHeight(Math.min(1600, image.naturalHeight));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể đọc ảnh.');
    }
  };

  const convertImage = async () => {
    if (!file || !sourceInfo || !outputSize) {
      setError('Vui lòng chọn ảnh trước khi chuyển định dạng.');
      return;
    }

    setIsConverting(true);
    setError(null);
    clearConvertedFile();

    let objectUrl = '';

    try {
      const loaded = await loadImageFromFile(file);
      objectUrl = loaded.url;
      const canvas = drawImageToCanvas(loaded.image, outputSize.width, outputSize.height, outputFormat, background);
      const blob = await canvasToBlob(canvas, outputFormat, quality / 100);
      const resultUrl = URL.createObjectURL(blob);
      const resultName = `${getBaseName(file.name)}.${getExtension(outputFormat)}`;

      setConvertedFile({
        blob,
        url: resultUrl,
        name: resultName,
        format: outputFormat,
        width: outputSize.width,
        height: outputSize.height,
      });
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : 'Không thể chuyển định dạng ảnh.');
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setIsConverting(false);
    }
  };

  const downloadConvertedFile = () => {
    if (!convertedFile) return;

    const link = document.createElement('a');
    link.href = convertedFile.url;
    link.download = convertedFile.name;
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
                <RefreshCw size={14} className="text-brand-orange" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Image Format Converter</span>
              </div>
              <h1 className="font-[family-name:var(--font-inter)] text-4xl font-black tracking-tight md:text-5xl">
                Chuyển định dạng ảnh
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/70">
                Đổi nhanh giữa PNG, JPG, WebP và AVIF, có preview, resize nhẹ và tải kết quả trực tiếp.
                Ảnh được xử lý ngay trên trình duyệt, không upload lên server.
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm sm:grid-cols-3 lg:min-w-[420px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Input</p>
                <p className="mt-1 text-sm font-black">{file ? formatFileSize(file.size) : '--'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Output</p>
                <p className="mt-1 text-sm font-black">{convertedFile ? formatFileSize(convertedFile.blob.size) : '--'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Tối ưu</p>
                <p className="mt-1 text-sm font-black">
                  {compressionRatio === null ? '--' : compressionRatio > 0 ? `-${compressionRatio}%` : `+${Math.abs(compressionRatio)}%`}
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
                <span className="mt-4 text-sm font-black">Chọn ảnh để chuyển đổi</span>
                <span className="mt-2 text-xs leading-relaxed text-foreground/55">
                  PNG, JPG, WebP, AVIF. Tối đa 24MB.
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
                <SlidersHorizontal size={20} className="text-brand-orange" aria-hidden="true" />
                <h2 className="text-xl font-black">Tùy chọn xuất</h2>
              </div>

              <div className="grid gap-3">
                {outputOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setOutputFormat(option.value);
                      clearConvertedFile();
                    }}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      outputFormat === option.value
                        ? 'border-brand-orange bg-brand-orange/10'
                        : 'border-foreground/10 bg-background hover:border-brand-orange/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-black">{option.label}</span>
                      {outputFormat === option.value && <CheckCircle2 size={16} className="text-brand-orange" aria-hidden="true" />}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/55">{option.hint}</p>
                  </button>
                ))}
              </div>

              {outputFormat !== 'image/png' && (
                <label className="mt-6 block">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Quality</span>
                    <span className="text-xs font-black text-brand-orange">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    step="1"
                    value={quality}
                    onChange={(event) => {
                      setQuality(Number(event.target.value));
                      clearConvertedFile();
                    }}
                    className="w-full accent-brand-orange"
                  />
                </label>
              )}

              <div className="mt-6 border-t border-foreground/10 pt-6">
                <label className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm font-black">Giới hạn kích thước</span>
                    <span className="block text-xs text-foreground/55">Không upscale ảnh nhỏ.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={resizeEnabled}
                    onChange={(event) => {
                      setResizeEnabled(event.target.checked);
                      clearConvertedFile();
                    }}
                    className="h-5 w-5 accent-brand-orange"
                  />
                </label>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="grid min-w-0 gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Max width</span>
                    <input
                      type="number"
                      min="1"
                      value={maxWidth}
                      disabled={!resizeEnabled}
                      onChange={(event) => {
                        setMaxWidth(Number(event.target.value));
                        clearConvertedFile();
                      }}
                      className="w-full min-w-0 rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm font-bold outline-none focus:border-brand-orange disabled:cursor-not-allowed disabled:opacity-45"
                    />
                  </label>
                  <label className="grid min-w-0 gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Max height</span>
                    <input
                      type="number"
                      min="1"
                      value={maxHeight}
                      disabled={!resizeEnabled}
                      onChange={(event) => {
                        setMaxHeight(Number(event.target.value));
                        clearConvertedFile();
                      }}
                      className="w-full min-w-0 rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm font-bold outline-none focus:border-brand-orange disabled:cursor-not-allowed disabled:opacity-45"
                    />
                  </label>
                </div>

                {outputSize && (
                  <p className="mt-3 text-xs text-foreground/55">
                    Kết quả dự kiến: <span className="font-black text-foreground">{outputSize.width} x {outputSize.height}px</span>
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-foreground/10 pt-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground/50">Nền khi xuất</p>
                <div className="grid grid-cols-2 gap-2">
                  {backgroundOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setBackground(option.value);
                        clearConvertedFile();
                      }}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors ${
                        background === option.value
                          ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                          : 'border-foreground/10 bg-background text-foreground/65 hover:border-brand-orange/40'
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-foreground/15"
                        style={{ background: option.color === 'transparent' ? 'linear-gradient(45deg,#ddd 25%,transparent 25%),linear-gradient(-45deg,#ddd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ddd 75%),linear-gradient(-45deg,transparent 75%,#ddd 75%)' : option.color, backgroundSize: '8px 8px', backgroundPosition: '0 0,0 4px,4px -4px,-4px 0' }}
                      />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-medium text-red-600 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={convertImage}
                  disabled={!file || isConverting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-orange/20 transition-all hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isConverting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
                  Chuyển định dạng
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
                    <img src={sourceUrl} alt="Ảnh gốc đang chọn" className="max-h-[520px] max-w-full object-contain" />
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
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Preview kết quả</p>
                    <h2 className="mt-1 text-xl font-black">Ảnh đã chuyển</h2>
                  </div>
                  <Sparkles size={24} className="text-brand-orange" aria-hidden="true" />
                </div>

                <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-brand-orange/15 bg-background p-4">
                  {convertedFile ? (
                    <img src={convertedFile.url} alt="Ảnh sau khi chuyển định dạng" className="max-h-[520px] max-w-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <RefreshCw size={38} className="mx-auto text-brand-orange/45" aria-hidden="true" />
                      <p className="mt-4 text-sm font-black text-foreground/60">Chưa có file kết quả</p>
                      <p className="mt-2 text-xs text-foreground/45">Chọn định dạng rồi bấm chuyển đổi.</p>
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
                    <h2 className="text-xl font-black">Báo cáo kết quả</h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-foreground/10 bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Định dạng</p>
                      <p className="mt-2 text-sm font-black">{convertedFile ? getExtension(convertedFile.format).toUpperCase() : getExtension(outputFormat).toUpperCase()}</p>
                    </div>
                    <div className="rounded-xl border border-foreground/10 bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Kích thước</p>
                      <p className="mt-2 text-sm font-black">
                        {convertedFile ? `${convertedFile.width} x ${convertedFile.height}px` : outputSize ? `${outputSize.width} x ${outputSize.height}px` : '--'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-foreground/10 bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Dung lượng</p>
                      <p className="mt-2 text-sm font-black">{convertedFile ? formatFileSize(convertedFile.blob.size) : '--'}</p>
                    </div>
                    <div className="rounded-xl border border-foreground/10 bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Trạng thái</p>
                      <p className="mt-2 text-sm font-black text-brand-orange">{convertedFile ? 'Sẵn sàng tải' : 'Đang chờ'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:min-w-[230px]">
                  <button
                    type="button"
                    onClick={downloadConvertedFile}
                    disabled={!convertedFile}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-lg shadow-brand-orange/20 transition-all hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Download size={16} aria-hidden="true" />
                    Tải file kết quả
                  </button>
                  <div className="inline-flex items-start gap-2 rounded-xl border border-foreground/10 bg-background p-3 text-xs leading-relaxed text-foreground/55">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-orange" aria-hidden="true" />
                    File được xử lý cục bộ trong trình duyệt, phù hợp cho asset bài viết và học liệu nội bộ.
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
