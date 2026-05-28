'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileImage,
  ImageUp,
  Loader2,
  Maximize2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

type VectorizeOptions = {
  colorPrecision: number;
  filterSpeckle: number;
  spliceThreshold: number;
  pathPrecision: number;
  mode: 'spline' | 'polygon';
  cornerThreshold: number;
  lengthThreshold: number;
  hierarchical: 'stacked' | 'cutout';
  maxIterations: number;
  layerDifference: number;
};

type NumberOption = {
  key: keyof Pick<
    VectorizeOptions,
    | 'colorPrecision'
    | 'filterSpeckle'
    | 'spliceThreshold'
    | 'pathPrecision'
    | 'cornerThreshold'
    | 'lengthThreshold'
    | 'maxIterations'
    | 'layerDifference'
  >;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
};

const DEFAULT_OPTIONS: VectorizeOptions = {
  colorPrecision: 6,
  filterSpeckle: 4,
  spliceThreshold: 45,
  pathPrecision: 2,
  mode: 'spline',
  cornerThreshold: 60,
  lengthThreshold: 4,
  hierarchical: 'stacked',
  maxIterations: 10,
  layerDifference: 16,
};

const numberOptions: NumberOption[] = [
  {
    key: 'colorPrecision',
    label: 'Số màu',
    min: 1,
    max: 8,
    step: 1,
    hint: 'Tăng để giữ nhiều vùng màu hơn.',
  },
  {
    key: 'filterSpeckle',
    label: 'Lọc nhiễu',
    min: 0,
    max: 64,
    step: 1,
    hint: 'Loại bỏ hạt nhỏ trong ảnh scan.',
  },
  {
    key: 'spliceThreshold',
    label: 'Nối nét',
    min: 0,
    max: 180,
    step: 1,
    hint: 'Giúp đường cong liền mạch hơn.',
  },
  {
    key: 'pathPrecision',
    label: 'Độ chính xác',
    min: 0,
    max: 5,
    step: 1,
    hint: 'Giảm để file SVG nhẹ hơn.',
  },
  {
    key: 'cornerThreshold',
    label: 'Giữ góc',
    min: 0,
    max: 180,
    step: 1,
    hint: 'Tăng để giữ các góc sắc.',
  },
  {
    key: 'lengthThreshold',
    label: 'Độ dài nét',
    min: 0,
    max: 20,
    step: 0.5,
    hint: 'Giảm để bám chi tiết nhỏ.',
  },
  {
    key: 'maxIterations',
    label: 'Vòng lặp',
    min: 1,
    max: 80,
    step: 1,
    hint: 'Tăng cho ảnh chi tiết hơn.',
  },
  {
    key: 'layerDifference',
    label: 'Tách lớp màu',
    min: 0,
    max: 255,
    step: 1,
    hint: 'Giảm để nhạy hơn với màu gần nhau.',
  },
];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function ImageVectorizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [options, setOptions] = useState<VectorizeOptions>(DEFAULT_OPTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const svgStats = useMemo(() => {
    if (!svg) return null;
    return {
      size: formatFileSize(new Blob([svg]).size),
      paths: (svg.match(/<path\b/g) || []).length,
    };
  }, [svg]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const updateNumberOption = (key: NumberOption['key'], value: string) => {
    setOptions((current) => ({
      ...current,
      [key]: Number(value),
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selectedFile.type)) {
      setError('Chỉ hỗ trợ PNG, JPG/JPEG và WebP.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Ảnh vượt quá giới hạn 10MB.');
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setSvg(null);
    setError(null);
    setZoom(1);
  };

  const resetInput = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setSvg(null);
    setError(null);
    setZoom(1);
  };

  const handleVectorize = async () => {
    if (!file) {
      setError('Vui lòng chọn ảnh trước khi vector hóa.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    try {
      const response = await fetch('/api/vectorize', {
        method: 'POST',
        body: formData,
      });
      const data = (await response.json()) as { svg?: string; error?: string };

      if (!response.ok || !data.svg) {
        throw new Error(data.error || 'Không thể vector hóa ảnh.');
      }

      setSvg(data.svg);
      setZoom(1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể vector hóa ảnh.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSvg = () => {
    if (!svg) return;

    const baseName = file?.name.replace(/\.[^.]+$/, '') || 'vectorized-image';
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
                <Sparkles size={14} aria-hidden="true" />
                IMAGE TOOLKIT / VECTORIZER
              </div>
              <h1 className="cyber-h1">
                Chuyển ảnh sang <span className="cyber-text-gradient">SVG vector</span>
              </h1>
              <p className="body-lg mt-5 max-w-3xl text-muted">
                Dựa trên pipeline VTracer từ WRO-GV2026: tải ảnh raster, tinh chỉnh thuật toán, xem trước kết quả và
                xuất SVG dùng cho bài giảng, blog, slide hoặc asset STEM.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm lg:min-w-[18rem]">
              <div className="border border-brand-orange/25 bg-cyber-black/40 p-4 cyber-cut-sm">
                <p className="tech-mono text-brand-orange !text-[9px]">ĐỊNH DẠNG</p>
                <p className="mt-2 font-orbitron font-bold">PNG / JPG / WebP</p>
              </div>
              <div className="border border-brand-orange/25 bg-cyber-black/40 p-4 cyber-cut-sm">
                <p className="tech-mono text-brand-orange !text-[9px]">GIỚI HẠN</p>
                <p className="mt-2 font-orbitron font-bold">10MB</p>
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
                <p className="tech-mono text-brand-orange !text-[9px]">SOURCE CANVAS</p>
                <h2 className="mt-2 font-orbitron text-2xl font-bold">Ảnh đầu vào</h2>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={resetInput}
                  className="inline-flex h-10 w-10 items-center justify-center border border-red-500/35 text-red-400 transition-colors hover:bg-red-500/10 cyber-cut-sm"
                  title="Xóa ảnh"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
            </div>

            <label className="flex min-h-[360px] cursor-pointer flex-col items-center justify-center border border-dashed border-brand-orange/35 bg-background/60 p-6 text-center transition-colors hover:bg-brand-orange/5 cyber-cut">
              {preview ? (
                <img
                  src={preview}
                  alt="Ảnh gốc"
                  className="max-h-[330px] max-w-full object-contain shadow-[0_0_80px_-30px_rgba(255,87,34,0.45)]"
                />
              ) : (
                <>
                  <div className="mb-6 flex h-20 w-20 items-center justify-center border border-brand-orange/50 bg-brand-orange/10 text-brand-orange cyber-cut-sm">
                    <ImageUp size={36} aria-hidden="true" />
                  </div>
                  <p className="font-orbitron text-xl font-bold">Chọn ảnh để bắt đầu</p>
                  <p className="body-base mt-3 max-w-sm text-muted">
                    Logo, icon, minh họa phẳng và ảnh ít nhiễu sẽ cho SVG sạch nhất.
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

          <section
            className={`border border-brand-orange/25 bg-cyber-black/45 p-6 cyber-cut ${isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-background/95 backdrop-blur-xl' : ''
              }`}
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="tech-mono text-brand-orange !text-[9px]">VECTOR MASTER OUTPUT</p>
                <h2 className="mt-2 font-orbitron text-2xl font-bold">Kết quả SVG</h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((current) => Math.min(current + 0.2, 3))}
                  disabled={!svg}
                  className="inline-flex h-10 w-10 items-center justify-center border border-brand-orange/35 text-brand-orange transition-colors hover:bg-brand-orange/10 disabled:cursor-not-allowed disabled:opacity-40 cyber-cut-sm"
                  title="Phóng to"
                >
                  <ZoomIn size={17} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((current) => Math.max(current - 0.2, 0.4))}
                  disabled={!svg}
                  className="inline-flex h-10 w-10 items-center justify-center border border-brand-orange/35 text-brand-orange transition-colors hover:bg-brand-orange/10 disabled:cursor-not-allowed disabled:opacity-40 cyber-cut-sm"
                  title="Thu nhỏ"
                >
                  <ZoomOut size={17} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  disabled={!svg}
                  className="inline-flex h-10 w-10 items-center justify-center border border-brand-orange/35 text-brand-orange transition-colors hover:bg-brand-orange/10 disabled:cursor-not-allowed disabled:opacity-40 cyber-cut-sm"
                  title="Reset zoom"
                >
                  <RefreshCw size={17} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen((current) => !current)}
                  disabled={!svg}
                  className="inline-flex h-10 w-10 items-center justify-center border border-brand-orange/35 text-brand-orange transition-colors hover:bg-brand-orange/10 disabled:cursor-not-allowed disabled:opacity-40 cyber-cut-sm"
                  title="Toàn màn hình"
                >
                  <Maximize2 size={17} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="relative flex min-h-[360px] items-center justify-center overflow-auto border border-brand-orange/20 bg-white text-slate-950 cyber-cut">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:22px_22px] opacity-40" />
              {isLoading ? (
                <div className="relative z-10 flex flex-col items-center gap-5 text-slate-900">
                  <Loader2 size={48} className="animate-spin text-brand-orange" aria-hidden="true" />
                  <p className="font-orbitron text-sm font-bold uppercase tracking-widest">Đang vector hóa...</p>
                </div>
              ) : svg ? (
                <div
                  className="relative z-10 flex min-h-[360px] w-full items-center justify-center p-10 transition-transform"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : (
                <div className="relative z-10 flex flex-col items-center gap-4 text-slate-400">
                  <Wand2 size={72} strokeWidth={1.5} aria-hidden="true" />
                  <p className="font-orbitron text-lg font-bold">Chưa có dữ liệu xử lý</p>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="flex flex-wrap gap-3 text-sm">
                {svgStats ? (
                  <>
                    <span className="border border-brand-orange/25 px-3 py-2 tech-mono text-muted">
                      {svgStats.paths} paths
                    </span>
                    <span className="border border-brand-orange/25 px-3 py-2 tech-mono text-muted">
                      {svgStats.size}
                    </span>
                  </>
                ) : (
                  <span className="border border-brand-orange/25 px-3 py-2 tech-mono text-muted">
                    Preview sẽ xuất hiện sau khi xử lý
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={downloadSvg}
                disabled={!svg}
                className="inline-flex items-center justify-center gap-2 border border-brand-orange/50 bg-brand-orange px-5 py-3 font-orbitron text-sm font-bold uppercase text-white transition-all hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:border-brand-orange/25 disabled:bg-transparent disabled:text-muted cyber-cut-sm"
              >
                <Download size={17} aria-hidden="true" />
                Lưu SVG
              </button>
            </div>
          </section>
        </div>

        <section className="mt-6 border border-brand-orange/25 bg-cyber-black/45 p-6 cyber-cut">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="tech-mono text-brand-orange !text-[9px]">ALGORITHM CONTROL</p>
              <h2 className="mt-2 font-orbitron text-2xl font-bold">Tùy chọn vector hóa</h2>
            </div>
            <button
              type="button"
              onClick={() => setOptions(DEFAULT_OPTIONS)}
              className="inline-flex items-center gap-2 border border-brand-orange/35 px-4 py-2 font-orbitron text-xs font-bold uppercase text-brand-orange transition-colors hover:bg-brand-orange/10 cyber-cut-sm"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Reset mặc định
            </button>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.8fr_0.8fr_1.4fr]">
            <div>
              <p className="mb-3 tech-mono text-muted !text-[9px]">ENGINE</p>
              <div className="grid grid-cols-2 border border-brand-orange/25 p-1 cyber-cut-sm">
                {(['spline', 'polygon'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setOptions((current) => ({ ...current, mode }))}
                    className={`px-4 py-3 font-orbitron text-xs font-bold uppercase transition-colors ${options.mode === mode ? 'bg-brand-orange text-white' : 'text-muted hover:bg-brand-orange/10'
                      }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">Spline mượt cho logo/minh họa, Polygon hợp ảnh khối kỹ thuật.</p>
            </div>

            <div>
              <p className="mb-3 tech-mono text-muted !text-[9px]">LAYERING</p>
              <div className="grid grid-cols-2 border border-brand-orange/25 p-1 cyber-cut-sm">
                {(['stacked', 'cutout'] as const).map((hierarchical) => (
                  <button
                    key={hierarchical}
                    type="button"
                    onClick={() => setOptions((current) => ({ ...current, hierarchical }))}
                    className={`px-4 py-3 font-orbitron text-xs font-bold uppercase transition-colors ${options.hierarchical === hierarchical
                        ? 'bg-brand-orange text-white'
                        : 'text-muted hover:bg-brand-orange/10'
                      }`}
                  >
                    {hierarchical}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">Stacked giảm khe hở màu, Cutout tạo mảng ghép gọn hơn.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {numberOptions.map((item) => (
                <label key={item.key} className="border border-brand-orange/20 bg-background/50 p-4 cyber-cut-sm">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-orbitron text-xs font-bold uppercase">{item.label}</span>
                    <span className="tech-mono text-brand-orange !text-[10px]">{options[item.key]}</span>
                  </span>
                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    step={item.step}
                    value={options[item.key]}
                    onChange={(event) => updateNumberOption(item.key, event.target.value)}
                    className="mt-4 w-full accent-brand-orange"
                  />
                  <span className="mt-2 block text-xs text-muted">{item.hint}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleVectorize}
              disabled={!file || isLoading}
              className="inline-flex min-h-12 items-center justify-center gap-3 border border-brand-orange bg-brand-orange px-6 py-3 font-orbitron text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:border-brand-orange/25 disabled:bg-transparent disabled:text-muted cyber-cut-sm"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Wand2 size={18} aria-hidden="true" />}
              Vector hóa ảnh
            </button>
            <span className="inline-flex items-center gap-2 border border-brand-orange/25 px-4 py-3 tech-mono text-muted">
              <Sparkles size={15} aria-hidden="true" />
              Không làm mất file gốc
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
