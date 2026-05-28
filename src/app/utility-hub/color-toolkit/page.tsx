'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Palette,
  Sparkles,
  Focus,
  Pipette,
  Check,
  Copy,
  ImageUp,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';
import chroma from 'chroma-js';

// ---- UTILS: Simple Color Quantization (K-Means simplified) ----
function extractDominantColors(imgEl: HTMLImageElement, colorCount = 6): string[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  // Scale down for faster processing
  const MAX_SIZE = 200;
  let w = imgEl.width;
  let h = imgEl.height;
  if (w > MAX_SIZE || h > MAX_SIZE) {
    if (w > h) {
      h = Math.round((h * MAX_SIZE) / w);
      w = MAX_SIZE;
    } else {
      w = Math.round((w * MAX_SIZE) / h);
      h = MAX_SIZE;
    }
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(imgEl, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h).data;

  const colorCounts: Record<string, number> = {};
  
  // Sample pixels
  for (let i = 0; i < imageData.length; i += 16) {
    const r = Math.round(imageData[i] / 10) * 10;
    const g = Math.round(imageData[i + 1] / 10) * 10;
    const b = Math.round(imageData[i + 2] / 10) * 10;
    const a = imageData[i + 3];

    if (a < 128) continue; // Skip transparent
    if (r > 240 && g > 240 && b > 240) continue; // Skip pure white background
    if (r < 15 && g < 15 && b < 15) continue; // Skip pure black

    const hex = chroma(r, g, b).hex();
    colorCounts[hex] = (colorCounts[hex] || 0) + 1;
  }

  // Sort and filter distinct colors
  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  const distinctColors: string[] = [];
  for (const hex of sortedColors) {
    if (distinctColors.length >= colorCount) break;
    // Ensure colors are visually distinct (delta E)
    let isDistinct = true;
    for (const chosen of distinctColors) {
      if (chroma.deltaE(hex, chosen) < 15) {
        isDistinct = false;
        break;
      }
    }
    if (isDistinct) {
      distinctColors.push(hex);
    }
  }

  return distinctColors;
}

// ---- MAIN COMPONENT ----
export default function ColorToolkitPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [baseColor, setBaseColor] = useState<string>('#FF5722'); // Default TEKY Orange
  
  // Eyedropper state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [hoverColor, setHoverColor] = useState<string | null>(null);

  // WCAG Tool state
  const [wcagBg, setWcagBg] = useState<string>('#FFFFFF');
  const [wcagText, setWcagText] = useState<string>('#FF5722');

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setIsEyedropperActive(false);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      const colors = extractDominantColors(img);
      setExtractedColors(colors);
      if (colors.length > 0) {
        setBaseColor(colors[0]);
        setWcagText(colors[0]);
      }
      
      // Draw to canvas for eyedropper
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        // Calculate fit size
        const containerWidth = canvas.parentElement?.clientWidth || 500;
        const scale = Math.min(1, containerWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
  };

  const resetImage = () => {
    setImageSrc(null);
    setExtractedColors([]);
    setBaseColor('#FF5722');
    setIsEyedropperActive(false);
  };

  // Eyedropper interaction
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = chroma(pixel[0], pixel[1], pixel[2]).hex();
    setHoverColor(hex);
  };

  const handleCanvasClick = () => {
    if (isEyedropperActive && hoverColor) {
      setBaseColor(hoverColor);
      setWcagText(hoverColor);
      if (!extractedColors.includes(hoverColor)) {
        setExtractedColors(prev => [hoverColor, ...prev].slice(0, 8));
      }
      setIsEyedropperActive(false);
      setHoverColor(null);
    }
  };

  // Harmonies Calculation
  const harmonies = {
    analogous: [
      chroma(baseColor).set('hsl.h', '-30').hex(),
      baseColor,
      chroma(baseColor).set('hsl.h', '+30').hex(),
    ],
    complementary: [
      baseColor,
      chroma(baseColor).set('hsl.h', '+180').hex(),
    ],
    triadic: [
      baseColor,
      chroma(baseColor).set('hsl.h', '+120').hex(),
      chroma(baseColor).set('hsl.h', '+240').hex(),
    ],
    monochromatic: [
      chroma(baseColor).brighten(1.5).hex(),
      baseColor,
      chroma(baseColor).darken(1.5).hex(),
    ]
  };

  // Scale (Tailwind style)
  const scale = chroma.scale(['white', baseColor, 'black']).domain([0, 0.5, 1]);
  const tailwindShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(
    (weight, i) => ({ weight, hex: scale(i / 9).hex() })
  );

  // WCAG Check
  const contrastRatio = chroma.contrast(wcagBg, wcagText);
  const isWcagPass = contrastRatio >= 4.5;
  const isWcagLargePass = contrastRatio >= 3.0;

  // WCAG Suggestions
  const getWcagSuggestions = () => {
    const suggestions = [];
    const baseHex = chroma(baseColor).hex().toUpperCase();
    
    // 1. Base as background
    const textOnBase = chroma.contrast(baseColor, 'white') >= 4.5 ? '#FFFFFF' : '#000000';
    suggestions.push({ bg: baseHex, text: textOnBase, label: 'Dùng làm Nền' });

    // 2. Base as text
    const bgForBase = chroma.contrast('white', baseColor) >= 4.5 ? '#FFFFFF' : '#111827';
    suggestions.push({ bg: bgForBase, text: baseHex, label: 'Dùng làm Chữ' });

    // 3. Monochromatic / High Contrast Shade
    let darkShade = chroma(baseColor).darken(2).hex();
    let lightShade = chroma(baseColor).brighten(2).hex();
    
    // Push them to limits if they don't pass
    while (chroma.contrast(baseColor, darkShade) < 4.5 && chroma(darkShade).luminance() > 0.01) {
      darkShade = chroma(darkShade).darken(0.5).hex();
    }
    while (chroma.contrast(baseColor, lightShade) < 4.5 && chroma(lightShade).luminance() < 0.99) {
      lightShade = chroma(lightShade).brighten(0.5).hex();
    }

    const contrastDark = chroma.contrast(baseColor, darkShade);
    const contrastLight = chroma.contrast(baseColor, lightShade);

    let chosenShade = darkShade;
    if (contrastLight >= 4.5 && contrastDark < 4.5) {
       chosenShade = lightShade;
    } else if (contrastDark >= 4.5 && contrastLight < 4.5) {
       chosenShade = darkShade;
    } else {
       chosenShade = contrastLight > contrastDark ? lightShade : darkShade;
    }

    const chosenHex = chroma(chosenShade).hex().toUpperCase();
    const isBaseDarker = chroma(baseColor).luminance() < chroma(chosenShade).luminance();

    suggestions.push({ 
      bg: isBaseDarker ? chosenHex : baseHex, 
      text: isBaseDarker ? baseHex : chosenHex, 
      label: 'Phối Đơn sắc' 
    });

    return suggestions;
  };
  const wcagSuggestions = getWcagSuggestions();

  // Emotion Tags based on Hue
  const getEmotionTags = (hex: string) => {
    const h = chroma(hex).hsl()[0] || 0;
    if (h < 15 || h > 345) return ['Năng lượng', 'Cảnh báo', 'Đam mê'];
    if (h >= 15 && h < 45) return ['Sáng tạo', 'Robotics', 'Thân thiện'];
    if (h >= 45 && h < 75) return ['Cảnh báo', 'Vui vẻ', 'Tích cực'];
    if (h >= 75 && h < 150) return ['Tự nhiên', 'Phát triển', 'An toàn'];
    if (h >= 150 && h < 210) return ['Công nghệ', 'Hiện đại', 'Tươi mới'];
    if (h >= 210 && h < 270) return ['Tin cậy', 'Học thuật', 'Chuyên nghiệp'];
    if (h >= 270 && h < 315) return ['Sáng tạo', 'Độc đáo', 'Tâm lý'];
    return ['Hiện đại', 'Đa dạng'];
  };

  const [trendingColors, setTrendingColors] = useState<{id: number, title: string, author: string, colors: string[]}[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [trendingTab, setTrendingTab] = useState<'top' | 'new' | 'random'>('top');

  const fetchTrending = useCallback((type: string) => {
    setIsLoadingTrending(true);
    fetch(`/api/trending-colors?type=${type}&limit=30`)
      .then(res => res.json())
      .then(data => {
        setTrendingColors(data);
        setIsLoadingTrending(false);
      })
      .catch(err => {
        console.error('Failed to fetch trending colors', err);
        setIsLoadingTrending(false);
      });
  }, []);

  useEffect(() => {
    fetchTrending(trendingTab);
  }, [trendingTab, fetchTrending]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
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
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/5 px-3 py-1">
                <Palette size={14} className="text-pink-500" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-pink-500">Image Toolkit / Color</span>
              </div>
              <h1 className="font-[family-name:var(--font-inter)] text-4xl font-black tracking-tight md:text-5xl">
                Tạo bảng màu từ ảnh
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/70">
                Studio màu sắc chuyên nghiệp: Trích xuất tự động từ ảnh, hút màu pixel-perfect, phối màu khoa học và
                kiểm tra độ tương phản WCAG dành riêng cho ấn phẩm giáo dục STEM và thiết kế giao diện.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-10">
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          {/* LEFT: IMAGE & EXTRACTOR */}
          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Source / Extraction</p>
                  <h2 className="mt-1 text-xl font-black">Nguồn hình ảnh</h2>
                </div>
                {imageSrc && (
                  <button
                    onClick={resetImage}
                    className="rounded-full border border-foreground/10 p-2 text-foreground/50 transition-colors hover:border-red-500/40 hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {!imageSrc ? (
                <label className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/20 bg-background p-6 text-center transition-colors hover:border-brand-orange/60 hover:bg-brand-orange/5">
                  <ImageUp size={38} className="mx-auto text-foreground/30" />
                  <span className="mt-4 text-sm font-black">Chọn ảnh để bắt đầu</span>
                  <span className="mt-2 text-xs leading-relaxed text-foreground/55 max-w-sm">
                    Tải lên mascot, robot field hoặc ảnh sản phẩm để trích xuất màu chủ đạo.
                  </span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileUpload} />
                </label>
              ) : (
                <div className="relative flex flex-col items-center gap-4">
                  <div className={`relative overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-sm ${isEyedropperActive ? 'cursor-crosshair ring-2 ring-brand-orange' : ''}`}>
                    <canvas
                      ref={canvasRef}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseLeave={() => setHoverColor(null)}
                      onClick={handleCanvasClick}
                      className="max-w-full"
                    />
                    {isEyedropperActive && hoverColor && (
                      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/90 p-2 pl-4 pr-3 shadow-lg backdrop-blur">
                        <span className="text-xs font-bold uppercase">{hoverColor}</span>
                        <div className="h-6 w-6 rounded-full border border-foreground/10 shadow-inner" style={{ backgroundColor: hoverColor }} />
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                      isEyedropperActive 
                      ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' 
                      : 'border-foreground/10 bg-background hover:bg-foreground/5 text-foreground/80'
                    }`}
                  >
                    <Pipette size={18} />
                    {isEyedropperActive ? 'Click vào ảnh để chọn màu' : 'Kích hoạt Hút màu thủ công'}
                  </button>
                </div>
              )}

              {/* EXTRACTED COLORS */}
              {extractedColors.length > 0 && (
                <div className="mt-6 border-t border-foreground/10 pt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-3">Màu trích xuất tự động</p>
                  <div className="flex flex-wrap gap-3">
                    {extractedColors.map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          setBaseColor(color);
                          setWcagText(color);
                        }}
                        className={`group relative h-12 w-12 rounded-full border-2 transition-all hover:scale-110 ${baseColor === color ? 'border-foreground shadow-md' : 'border-transparent shadow-sm'}`}
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {baseColor === color && <Check size={16} className="absolute inset-0 m-auto text-white mix-blend-difference" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* WCAG CHECKER */}
            <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Accessibility</p>
                <h2 className="mt-1 text-xl font-black">Kiểm tra Độ tương phản (WCAG)</h2>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-foreground/60">Màu Nền (Background)</label>
                  <div className="mt-2 flex h-10 w-full overflow-hidden rounded-lg border border-foreground/10 bg-background">
                    <input type="color" value={wcagBg} onChange={e => setWcagBg(e.target.value)} className="h-12 w-12 cursor-pointer border-0 bg-transparent p-0" />
                    <input type="text" value={wcagBg.toUpperCase()} onChange={e => setWcagBg(e.target.value)} className="flex-1 bg-transparent px-3 text-sm font-bold uppercase outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground/60">Màu Chữ (Text)</label>
                  <div className="mt-2 flex h-10 w-full overflow-hidden rounded-lg border border-foreground/10 bg-background">
                    <input type="color" value={wcagText} onChange={e => setWcagText(e.target.value)} className="h-12 w-12 cursor-pointer border-0 bg-transparent p-0" />
                    <input type="text" value={wcagText.toUpperCase()} onChange={e => setWcagText(e.target.value)} className="flex-1 bg-transparent px-3 text-sm font-bold uppercase outline-none" />
                  </div>
                </div>
              </div>

              <div 
                className="mt-6 flex min-h-[120px] flex-col items-center justify-center rounded-xl p-6 text-center transition-colors"
                style={{ backgroundColor: wcagBg, color: wcagText }}
              >
                <h3 className="text-2xl font-black">Bài giảng STEM Robotics</h3>
                <p className="mt-2 text-sm font-medium opacity-90">Đảm bảo màu chữ hiển thị rõ trên máy chiếu.</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className={`flex flex-1 items-center justify-between rounded-lg border px-4 py-3 ${isWcagPass ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Chữ thường (Normal)</p>
                    <p className="text-xl font-black">{contrastRatio.toFixed(2)}:1</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{isWcagPass ? 'PASS (AA)' : 'FAIL'}</p>
                  </div>
                </div>
                <div className={`flex flex-1 items-center justify-between rounded-lg border px-4 py-3 ${isWcagLargePass ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Chữ lớn (Large/Title)</p>
                    <p className="text-xl font-black">{contrastRatio.toFixed(2)}:1</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{isWcagLargePass ? 'PASS (AA)' : 'FAIL'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-foreground/10 pt-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground/50">Gợi ý phối màu đạt chuẩn với {chroma(baseColor).hex().toUpperCase()}</p>
                <div className="grid grid-cols-3 gap-3">
                  {wcagSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setWcagBg(sug.bg);
                        setWcagText(sug.text);
                      }}
                      className="group flex flex-col items-center justify-center overflow-hidden rounded-xl border border-foreground/10 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex h-14 w-full items-center justify-center transition-colors" style={{ backgroundColor: sug.bg }}>
                        <span className="text-xl font-black transition-colors" style={{ color: sug.text }}>Aa</span>
                      </div>
                      <div className="w-full bg-background px-2 py-2.5 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">{sug.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: COLOR HUB & HARMONIES */}
          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-brand-orange/20 bg-brand-orange/5 p-6">
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Base Color Hub</p>
                <h2 className="mt-1 text-xl font-black">Màu Chủ Đạo</h2>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-background shadow-xl">
                  <div className="absolute inset-0" style={{ backgroundColor: baseColor }} />
                  <input 
                    type="color" 
                    value={chroma(baseColor).hex()} 
                    onChange={(e) => setBaseColor(e.target.value)}
                    className="absolute -inset-10 h-64 w-64 cursor-pointer opacity-0"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-black uppercase">{chroma(baseColor).hex()}</h3>
                    <button onClick={() => copyToClipboard(chroma(baseColor).hex())} className="rounded p-2 text-foreground/50 hover:bg-foreground/10 hover:text-foreground">
                      {copiedText === chroma(baseColor).hex() ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm font-medium text-foreground/70">
                    <p>RGB: {chroma(baseColor).rgb().join(', ')}</p>
                    <p>HSL: {chroma(baseColor).hsl().map(v => Math.round(v || 0)).join(', ')}</p>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {getEmotionTags(baseColor).map(tag => (
                      <span key={tag} className="rounded-full border border-brand-orange/20 bg-background px-3 py-1 text-xs font-bold text-brand-orange shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* TRENDING COLORS */}
            <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 flex flex-col max-h-[500px]">
              <div className="mb-5 flex items-center justify-between gap-4 shrink-0">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Community API</p>
                  <h2 className="mt-1 text-xl font-black">Trending Palettes</h2>
                </div>
                {isLoadingTrending && <Sparkles className="animate-pulse text-brand-orange" size={20} />}
              </div>

              <div className="mb-4 flex gap-2 shrink-0">
                <button 
                  onClick={() => setTrendingTab('top')}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${trendingTab === 'top' ? 'bg-foreground text-background' : 'bg-background border border-foreground/10 text-foreground/70 hover:bg-foreground/5'}`}
                >
                  🔥 Top Trending
                </button>
                <button 
                  onClick={() => setTrendingTab('new')}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${trendingTab === 'new' ? 'bg-foreground text-background' : 'bg-background border border-foreground/10 text-foreground/70 hover:bg-foreground/5'}`}
                >
                  ✨ Mới nhất
                </button>
                <button 
                  onClick={() => { setTrendingTab('random'); fetchTrending('random'); }}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${trendingTab === 'random' ? 'bg-foreground text-background' : 'bg-background border border-foreground/10 text-foreground/70 hover:bg-foreground/5'}`}
                >
                  🎲 Ngẫu nhiên
                </button>
              </div>

              {isLoadingTrending ? (
                <div className="space-y-4 flex-1 overflow-hidden">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-foreground/5" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {trendingColors.map(palette => (
                    <div key={palette.id} className="rounded-xl border border-foreground/10 bg-background p-3 shadow-sm transition-all hover:shadow-md">
                      <div className="mb-2 flex items-center justify-between px-1">
                        <span className="text-xs font-bold">{palette.title}</span>
                        <span className="text-[10px] uppercase text-foreground/50">by {palette.author}</span>
                      </div>
                      <div className="flex h-10 w-full overflow-hidden rounded-lg">
                        {palette.colors.map(color => (
                          <div 
                            key={color + Math.random()} 
                            className="group relative flex-1 cursor-pointer transition-all hover:flex-[1.5]" 
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              setBaseColor(color);
                              setWcagText(color);
                            }}
                          >
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 mix-blend-difference transition-opacity group-hover:opacity-100 uppercase">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Color Harmonies</p>
                <h2 className="mt-1 text-xl font-black">Gợi ý Phối Màu Khoa Học</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground/80 mb-3">Tương đồng (Analogous) - Hài hòa, tự nhiên</h3>
                  <div className="flex h-16 w-full overflow-hidden rounded-xl border border-foreground/10 shadow-sm">
                    {harmonies.analogous.map((color, i) => (
                      <div key={i} className="group relative flex-1 cursor-pointer transition-all hover:flex-[1.5]" style={{ backgroundColor: color }} onClick={() => copyToClipboard(color)}>
                        <span className="absolute bottom-2 left-0 right-0 text-center text-xs font-bold text-white opacity-0 mix-blend-difference transition-opacity group-hover:opacity-100 uppercase">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground/80 mb-3">Tương phản (Complementary) - Nổi bật, nhấn mạnh</h3>
                  <div className="flex h-16 w-full overflow-hidden rounded-xl border border-foreground/10 shadow-sm">
                    {harmonies.complementary.map((color, i) => (
                      <div key={i} className="group relative flex-1 cursor-pointer transition-all hover:flex-[1.5]" style={{ backgroundColor: color }} onClick={() => copyToClipboard(color)}>
                        <span className="absolute bottom-2 left-0 right-0 text-center text-xs font-bold text-white opacity-0 mix-blend-difference transition-opacity group-hover:opacity-100 uppercase">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground/80 mb-3">Tam giác (Triadic) - Năng động, vui nhộn</h3>
                  <div className="flex h-16 w-full overflow-hidden rounded-xl border border-foreground/10 shadow-sm">
                    {harmonies.triadic.map((color, i) => (
                      <div key={i} className="group relative flex-1 cursor-pointer transition-all hover:flex-[1.5]" style={{ backgroundColor: color }} onClick={() => copyToClipboard(color)}>
                        <span className="absolute bottom-2 left-0 right-0 text-center text-xs font-bold text-white opacity-0 mix-blend-difference transition-opacity group-hover:opacity-100 uppercase">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <div className="mb-5 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Code Export</p>
                  <h2 className="mt-1 text-xl font-black">Tailwind Shades</h2>
                </div>
                <button 
                  onClick={() => {
                    const obj = tailwindShades.reduce((acc, curr) => ({ ...acc, [curr.weight]: curr.hex }), {});
                    copyToClipboard(JSON.stringify({ brand: obj }, null, 2));
                  }}
                  className="text-xs font-bold text-brand-orange hover:underline"
                >
                  Copy Config
                </button>
              </div>

              <div className="flex h-20 w-full overflow-hidden rounded-xl border border-foreground/10 shadow-sm">
                {tailwindShades.map(({ weight, hex }) => (
                  <div key={weight} className="group relative flex-1 cursor-pointer transition-all hover:flex-[2]" style={{ backgroundColor: hex }} onClick={() => copyToClipboard(hex)}>
                    <span className="absolute top-2 left-0 right-0 text-center text-[10px] font-black text-white mix-blend-difference opacity-50 group-hover:opacity-100">{weight}</span>
                    <span className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-bold uppercase text-white mix-blend-difference opacity-0 transition-opacity group-hover:opacity-100">{hex}</span>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
