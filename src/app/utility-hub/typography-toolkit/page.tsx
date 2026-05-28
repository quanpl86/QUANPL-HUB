'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Type, AlertCircle, CheckCircle2, ChevronRight, Copy, MousePointer2, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';

const MODULAR_SCALES = [
  { name: 'Minor Second (1.067)', value: 1.067 },
  { name: 'Major Second (1.125)', value: 1.125 },
  { name: 'Minor Third (1.200)', value: 1.2 },
  { name: 'Major Third (1.250)', value: 1.25 },
  { name: 'Perfect Fourth (1.333)', value: 1.333 },
  { name: 'Augmented Fourth (1.414)', value: 1.414 },
  { name: 'Perfect Fifth (1.500)', value: 1.5 },
  { name: 'Golden Ratio (1.618)', value: 1.618 },
];

const POPULAR_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Lato', 
  'Plus Jakarta Sans', 'Outfit', 'Merriweather', 'Playfair Display', 
  'Lora', 'Space Grotesk', 'Oswald', 'Source Sans 3'
];

const PREDEFINED_PAIRINGS = [
  { context: 'Giao diện Web / App', heading: 'Plus Jakarta Sans', body: 'Inter', scale: 1.25, lh: 1.5, device: 'desktop' },
  { context: 'Báo cáo Học thuật', heading: 'Merriweather', body: 'Open Sans', scale: 1.333, lh: 1.6, device: 'desktop' },
  { context: 'Slide Bài giảng STEM', heading: 'Montserrat', body: 'Roboto', scale: 1.414, lh: 1.4, device: 'slide' },
  { context: 'Portfolio Nghệ thuật', heading: 'Playfair Display', body: 'Lato', scale: 1.414, lh: 1.5, device: 'tablet' },
  { context: 'Tạp chí Đời sống', heading: 'Lora', body: 'Inter', scale: 1.333, lh: 1.6, device: 'desktop' },
  { context: 'Tài liệu Doanh nghiệp', heading: 'Oswald', body: 'Roboto', scale: 1.25, lh: 1.5, device: 'desktop' },
  { context: 'Thương mại Điện tử', heading: 'Poppins', body: 'Open Sans', scale: 1.25, lh: 1.5, device: 'mobile' },
  { context: 'Startup Công nghệ', heading: 'Space Grotesk', body: 'Inter', scale: 1.333, lh: 1.5, device: 'desktop' },
  { context: 'Thiết kế Tối giản', heading: 'Outfit', body: 'Plus Jakarta Sans', scale: 1.25, lh: 1.6, device: 'tablet' },
  { context: 'Sách & Tiểu thuyết', heading: 'Playfair Display', body: 'Merriweather', scale: 1.2, lh: 1.7, device: 'tablet' },
  { context: 'Blog Cá nhân', heading: 'Source Sans 3', body: 'Lora', scale: 1.333, lh: 1.6, device: 'mobile' },
  { context: 'Bảng Quản trị (Admin)', heading: 'Roboto', body: 'Roboto', scale: 1.2, lh: 1.4, device: 'desktop' },
];

export default function TypographyToolkitPage() {
  const [deviceType, setDeviceType] = useState('desktop');
  const [baseSize, setBaseSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [containerWidth, setContainerWidth] = useState(800);
  const [scaleRatio, setScaleRatio] = useState(1.25);
  
  const [headingFont, setHeadingFont] = useState('Plus Jakarta Sans');
  const [bodyFont, setBodyFont] = useState('Inter');

  // Inject Google Fonts dynamically
  useEffect(() => {
    const fontsToLoad = Array.from(new Set([headingFont, bodyFont]));
    const fontUrl = `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`).join('&')}&display=swap`;
    
    let link = document.getElementById('typography-fonts') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = 'typography-fonts';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = fontUrl;
  }, [headingFont, bodyFont]);

  // Calculate Modular Scale
  const sizes = useMemo(() => {
    return {
      sm: Math.round(baseSize / scaleRatio),
      p: baseSize,
      h6: Math.round(baseSize * scaleRatio),
      h5: Math.round(baseSize * Math.pow(scaleRatio, 2)),
      h4: Math.round(baseSize * Math.pow(scaleRatio, 3)),
      h3: Math.round(baseSize * Math.pow(scaleRatio, 4)),
      h2: Math.round(baseSize * Math.pow(scaleRatio, 5)),
      h1: Math.round(baseSize * Math.pow(scaleRatio, 6)),
    };
  }, [baseSize, scaleRatio]);

  // Evaluations
  // 1. Line Length (Chars per line) -> approx ContainerWidth / (FontSize * 0.5)
  const avgCharWidth = baseSize * 0.45; 
  const charsPerLine = Math.round(containerWidth / avgCharWidth);
  
  const evaluateLineLength = () => {
    // For mobile (width <= 480), we accept 30-50 chars. For desktop, 45-75.
    const isMobile = containerWidth <= 480;
    const minChars = isMobile ? 30 : 45;
    const maxChars = isMobile ? 55 : 75;

    if (charsPerLine < minChars) return { status: 'warning', msg: `Quá ngắn (${charsPerLine} ký tự). Gây ngắt nhịp đọc liên tục.` };
    if (charsPerLine > maxChars) return { status: 'warning', msg: `Quá dài (${charsPerLine} ký tự). Gây mỏi mắt khi chuyển dòng.` };
    return { status: 'good', msg: `Tối ưu (${charsPerLine} ký tự). Khoa học khuyên dùng ${minChars}-${maxChars} ký tự/dòng.` };
  };
  
  const evaluateLineHeight = () => {
    if (lineHeight < 1.3) return { status: 'warning', msg: `Quá chật (${lineHeight}). Gây dính chữ, khó đọc.` };
    if (lineHeight > 1.7) return { status: 'warning', msg: `Quá thưa (${lineHeight}). Làm đứt gãy sự liên kết giữa các dòng.` };
    return { status: 'good', msg: `Tuyệt vời (${lineHeight}). Mức chuẩn cho khả năng đọc hiểu cao nhất.` };
  };

  const evaluateHierarchy = () => {
    // Calculate if H1 is too large for the container
    const h1Size = sizes.h1;
    if (h1Size > containerWidth / 4) {
      return { 
        status: 'warning', 
        msg: `Tiêu đề H1 (${h1Size}px) quá khổng lồ so với màn hình ${containerWidth}px. Chữ sẽ bị rớt xuống dòng liên tục.` 
      };
    }
    if (scaleRatio < 1.15 && containerWidth > 768) {
      return { 
        status: 'warning', 
        msg: `Tỷ lệ Scale (${scaleRatio}) quá nhỏ. Tiêu đề không đủ độ tương phản so với văn bản trên màn hình rộng.` 
      };
    }
    return { 
      status: 'good', 
      msg: `Hoàn hảo. Tiêu đề H1 (${h1Size}px) tạo điểm nhấn mạnh mẽ mà không bị vỡ bố cục.` 
    };
  };

  const copyTailwindConfig = () => {
    const config = `
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        heading: ['"${headingFont}"', 'sans-serif'],
        body: ['"${bodyFont}"', 'sans-serif'],
      },
      fontSize: {
        'sm': '${(sizes.sm / 16).toFixed(3)}rem',
        'base': '${(sizes.p / 16).toFixed(3)}rem',
        'h6': '${(sizes.h6 / 16).toFixed(3)}rem',
        'h5': '${(sizes.h5 / 16).toFixed(3)}rem',
        'h4': '${(sizes.h4 / 16).toFixed(3)}rem',
        'h3': '${(sizes.h3 / 16).toFixed(3)}rem',
        'h2': '${(sizes.h2 / 16).toFixed(3)}rem',
        'h1': '${(sizes.h1 / 16).toFixed(3)}rem',
      }
    }
  }
}`;
    navigator.clipboard.writeText(config.trim());
    alert('Đã copy Tailwind Config!');
  };

  const applyPairing = (pairing: any) => {
    setHeadingFont(pairing.heading);
    setBodyFont(pairing.body);
    setScaleRatio(pairing.scale);
    setLineHeight(pairing.lh);
    handleDeviceChange(pairing.device);
  };

  const handleDeviceChange = (device: string) => {
    setDeviceType(device);
    if (device === 'mobile') {
      setContainerWidth(375);
      setBaseSize(16);
      if (scaleRatio > 1.25) setScaleRatio(1.2);
    } else if (device === 'tablet') {
      setContainerWidth(768);
      setBaseSize(16);
    } else if (device === 'desktop') {
      setContainerWidth(800);
      setBaseSize(18);
    } else if (device === 'slide') {
      setContainerWidth(1200);
      setBaseSize(24);
    }
  };

  const llEval = evaluateLineLength();
  const lhEval = evaluateLineHeight();
  const hsEval = evaluateHierarchy();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link href="/utility-hub" className="hover:text-indigo-600 transition-colors">Utility Hub</Link>
            <ChevronRight size={16} />
            <span className="text-gray-900 font-medium">Typography Toolkit</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Type size={24} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Typography Toolkit</h1>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl">
                Phòng thí nghiệm nghệ thuật chữ. Phân tích khoa học, ghép cặp font chuẩn xác, và tạo thang đo kích thước tự động.
              </p>
            </div>
            
            <button 
              onClick={copyTailwindConfig}
              className="flex items-center space-x-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Copy size={18} />
              <span>Export Tailwind</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI: Nhập liệu & Đánh giá (5/12) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
                <LayoutTemplate size={20} className="mr-2 text-indigo-500" />
                Thiết lập Thông số
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cỡ chữ gốc (Base Size): {baseSize}px
                  </label>
                  <input 
                    type="range" min="12" max="24" step="1" 
                    value={baseSize} onChange={(e) => setBaseSize(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khoảng cách dòng (Line Height): {lineHeight}
                  </label>
                  <input 
                    type="range" min="1" max="2" step="0.05" 
                    value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Độ rộng khung chứa (Container): {containerWidth}px
                  </label>
                  <input 
                    type="range" min="300" max="1000" step="10" 
                    value={containerWidth} onChange={(e) => setContainerWidth(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thang Tỷ lệ (Modular Scale)
                  </label>
                  <select 
                    value={scaleRatio}
                    onChange={(e) => setScaleRatio(parseFloat(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors"
                  >
                    {MODULAR_SCALES.map(scale => (
                      <option key={scale.name} value={scale.value}>{scale.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
                <MousePointer2 size={20} className="mr-2 text-indigo-500" />
                Đánh giá Khoa học (Evaluation)
              </h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${llEval.status === 'good' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start">
                    {llEval.status === 'good' ? <CheckCircle2 className="text-green-600 mt-0.5 mr-3 shrink-0" size={20} /> : <AlertCircle className="text-amber-600 mt-0.5 mr-3 shrink-0" size={20} />}
                    <div>
                      <h4 className={`font-medium ${llEval.status === 'good' ? 'text-green-900' : 'text-amber-900'}`}>Độ dài dòng (Line Length)</h4>
                      <p className={`text-sm mt-1 ${llEval.status === 'good' ? 'text-green-700' : 'text-amber-700'}`}>{llEval.msg}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${lhEval.status === 'good' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start">
                    {lhEval.status === 'good' ? <CheckCircle2 className="text-green-600 mt-0.5 mr-3 shrink-0" size={20} /> : <AlertCircle className="text-amber-600 mt-0.5 mr-3 shrink-0" size={20} />}
                    <div>
                      <h4 className={`font-medium ${lhEval.status === 'good' ? 'text-green-900' : 'text-amber-900'}`}>Khoảng cách dòng (Line Height)</h4>
                      <p className={`text-sm mt-1 ${lhEval.status === 'good' ? 'text-green-700' : 'text-amber-700'}`}>{lhEval.msg}</p>
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${hsEval.status === 'good' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start">
                    {hsEval.status === 'good' ? <CheckCircle2 className="text-green-600 mt-0.5 mr-3 shrink-0" size={20} /> : <AlertCircle className="text-amber-600 mt-0.5 mr-3 shrink-0" size={20} />}
                    <div>
                      <h4 className={`font-medium ${hsEval.status === 'good' ? 'text-green-900' : 'text-amber-900'}`}>Phân cấp Tiêu đề (Hierarchy Scale)</h4>
                      <p className={`text-sm mt-1 ${hsEval.status === 'good' ? 'text-green-700' : 'text-amber-700'}`}>{hsEval.msg}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: Live Preview & Gợi ý (8/12) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Device Viewport Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex items-center justify-center space-x-2">
              <button 
                onClick={() => handleDeviceChange('mobile')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${deviceType === 'mobile' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                📱 Mobile (375px)
              </button>
              <button 
                onClick={() => handleDeviceChange('tablet')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${deviceType === 'tablet' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                💊 Tablet (768px)
              </button>
              <button 
                onClick={() => handleDeviceChange('desktop')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${deviceType === 'desktop' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                💻 Desktop (800px)
              </button>
              <button 
                onClick={() => handleDeviceChange('slide')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${deviceType === 'slide' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                📽️ Slide (1200px)
              </button>
            </div>

            {/* Context Suggestions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gợi ý ghép Font theo Lĩnh vực (Context-Aware)</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {PREDEFINED_PAIRINGS.map(p => (
                  <button 
                    key={p.context}
                    onClick={() => applyPairing(p)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      headingFont === p.heading && bodyFont === p.body 
                      ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-indigo-600 mb-2">{p.context}</div>
                    <div className="font-bold text-gray-900" style={{ fontFamily: p.heading }}>{p.heading}</div>
                    <div className="text-sm text-gray-500 mt-1" style={{ fontFamily: p.body }}>{p.body}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selection Dropdowns */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Heading Font (Tiêu đề)</label>
                <select 
                  value={headingFont} onChange={(e) => setHeadingFont(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                >
                  {POPULAR_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Body Font (Văn bản)</label>
                <select 
                  value={bodyFont} onChange={(e) => setBodyFont(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                >
                  {POPULAR_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {/* Live Preview Sandbox */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Live Preview Sandbox</h3>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              
              <div className="p-8 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white" style={{ minHeight: '600px' }}>
                {/* The Container simulating the width */}
                <div 
                  className="mx-auto bg-white rounded-lg shadow-lg border border-gray-100 p-10 transition-all duration-300 break-words overflow-hidden"
                  style={{ 
                    width: `${containerWidth}px`,
                    maxWidth: '100%',
                  }}
                >
                  <div style={{ fontFamily: headingFont }}>
                    <h1 style={{ fontSize: `${sizes.h1}px`, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '24px', color: '#0f172a' }}>
                      Nghệ thuật Kiến tạo Giao diện Đỉnh cao
                    </h1>
                    <h2 style={{ fontSize: `${sizes.h2}px`, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em', marginBottom: '20px', marginTop: '40px', color: '#1e293b' }}>
                      Tầm quan trọng của Typography trong UI/UX
                    </h2>
                  </div>

                  <div style={{ fontFamily: bodyFont, fontSize: `${sizes.p}px`, lineHeight: lineHeight, color: '#475569' }}>
                    <p style={{ marginBottom: '20px' }}>
                      Typography không chỉ là việc chọn một phông chữ đẹp. Nó là xương sống của mọi thiết kế giao diện, là cầu nối trực tiếp giữa thông tin và người dùng. Một hệ thống chữ được tinh chỉnh khoa học không chỉ làm đẹp giao diện, mà còn quyết định sự thành bại của trải nghiệm đọc.
                    </p>
                    <p style={{ marginBottom: '20px' }}>
                      Theo nghiên cứu của Viện Công thái học, độ dài lý tưởng cho một dòng văn bản nên nằm trong khoảng <strong>45 đến 75 ký tự</strong> (đã bao gồm khoảng trắng). Nếu dòng quá dài, mắt người dùng sẽ gặp khó khăn khi phải lia về đầu dòng tiếp theo. Ngược lại, nếu dòng quá ngắn, nhịp điệu đọc sẽ bị phá vỡ vì mắt phải đảo liên tục.
                    </p>
                    
                    <div style={{ fontFamily: headingFont }}>
                      <h3 style={{ fontSize: `${sizes.h3}px`, fontWeight: 600, lineHeight: 1.4, marginBottom: '16px', marginTop: '32px', color: '#1e293b' }}>
                        Ứng dụng Tỷ lệ Vàng (Golden Ratio)
                      </h3>
                    </div>

                    <p style={{ marginBottom: '20px' }}>
                      Bên cạnh độ dài dòng, khoảng cách giữa các dòng (Line Height) và sự phân cấp kích thước (Modular Scale) cũng đóng vai trò sinh tử. Bằng cách sử dụng hệ số nhân toán học, chúng ta có thể tạo ra một nhịp điệu thị giác nhất quán.
                    </p>
                    
                    <ul style={{ paddingLeft: '24px', listStyleType: 'disc', marginBottom: '24px' }}>
                      <li style={{ marginBottom: '8px' }}>Sử dụng tỷ lệ <strong>1.250 (Major Third)</strong> cho các giao diện cần sự gọn gàng, chặt chẽ (như Web Dashboard).</li>
                      <li style={{ marginBottom: '8px' }}>Sử dụng tỷ lệ <strong>1.618 (Golden Ratio)</strong> cho các ấn phẩm đề cao tính nghệ thuật, như Blog cá nhân hay Tạp chí.</li>
                    </ul>
                    
                    <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderLeft: `4px solid #6366f1`, borderRadius: '0 8px 8px 0', marginTop: '32px' }}>
                      <p style={{ fontSize: `${sizes.sm}px`, fontStyle: 'italic', margin: 0, color: '#64748b' }}>
                        "Web design is 95% typography. Càng tối ưu hiển thị chữ, bạn càng kiểm soát được suy nghĩ của người dùng." - Khuyết danh.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
