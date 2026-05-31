'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronRight, Settings, Check, Key, Play, Pause, Square, 
  Video, Mic, FileText, MousePointer2, Image as ImageIcon,
  Wand2, Bot, LayoutTemplate, Loader2, AlertTriangle
} from 'lucide-react';

const SYSTEM_PROMPT = `Bạn là Trợ lý Sinh Storyboard Video Bài giảng (AI Video Lesson Builder).
Nhiệm vụ của bạn là đọc giáo án/kịch bản (dạng Markdown hoặc text tự do) và phân tách nó thành một cấu trúc JSON array chặt chẽ, nơi mỗi phần tử là một "Scene" (Cảnh).

Yêu cầu cấu trúc JSON trả về:
[
  {
    "id": "scene_1",
    "title": "Tiêu đề cảnh",
    "duration": 10, // Ước lượng thời gian (số giây) dựa vào độ dài voiceScript
    "imagePrompt": "Mô tả hình ảnh hoặc tên file ảnh",
    "voiceScript": "Lời thoại chi tiết cần đọc",
    "interactions": [
      {
        "time": 5, // Dấu mốc thời gian xuất hiện tương tác
        "type": "multiple_choice",
        "title": "Tên câu hỏi nhanh"
      }
    ]
  }
]
CHỈ TRẢ VỀ CHUỖI JSON HỢP LỆ. KHÔNG CÓ MARKDOWN, KHÔNG CÓ TEXT GIẢI THÍCH NÀO KHÁC.`;

export default function AIVideoBuilderPage() {
  const [apiKey, setApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-3.1-flash-lite');
  const [showAiSettings, setShowAiSettings] = useState(false);
  
  // Data States
  const [markdownInput, setMarkdownInput] = useState(`# VIDEO: AI Giải Cứu Thế Giới\n\n## SCENE 1\ntime: 0s-10s\nimage: city_ai.png\nvoice: Thành phố số đang bị virus Zeron tấn công.\n\n---\n\n## INTERACTION 1\ntime: 10s\ntype: multiple_choice\npause_video: true\nallow_skip: true\ntitle: Câu hỏi nhanh\nquestion: Virus trong câu chuyện tên là gì?\nanswer: A`);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scenes, setScenes] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Load AI config
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    const savedModel = localStorage.getItem('gemini_model');
    if (savedKey) setApiKey(savedKey);
    if (savedModel) setAiModel(savedModel);
  }, []);

  const handleSaveAiConfig = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    localStorage.setItem('gemini_model', aiModel);
    setShowAiSettings(false);
  };

  const handleGenerateStoryboard = async () => {
    if (!apiKey) {
      setErrorMsg('Vui lòng cấu hình API Key trước khi sử dụng.');
      setShowAiSettings(true);
      return;
    }
    if (!markdownInput.trim()) return;

    setIsGenerating(true);
    setErrorMsg('');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: markdownInput }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Lỗi kết nối Gemini API');
      }

      const data = await response.json();
      let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Xử lý loại bỏ markdown JSON nếu AI vẫn cố tình bọc
      aiText = aiText.replace(/^```json/i, '').replace(/```$/i, '').trim();

      const parsedScenes = JSON.parse(aiText);
      if (Array.isArray(parsedScenes)) {
        setScenes(parsedScenes);
      } else {
        throw new Error('Dữ liệu trả về không phải là mảng Scenes hợp lệ.');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Có lỗi xảy ra khi biên dịch kịch bản.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-inter h-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center space-x-2">
          <Link href="/utility-hub" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">
            Utility Hub
          </Link>
          <ChevronRight size={16} className="text-gray-400" />
          <span className="text-gray-900 font-bold text-lg flex items-center">
            <Video className="w-5 h-5 mr-2 text-indigo-500" />
            AI Video Lesson Builder
          </span>
          <span className="ml-3 px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-wider">
            Teacher OS
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
            Xuất bản (Export)
          </button>
          
          <button 
            onClick={() => setShowAiSettings(true)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
              apiKey ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            }`}
          >
            {apiKey ? <Check size={16} /> : <Key size={16} />}
            <span>{apiKey ? 'API Đã Kết Nối' : 'Cấu hình API'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Sidebar: Markdown Editor & AI Agent */}
        <aside className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col shrink-0 relative z-10 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
            <h3 className="font-bold text-gray-800 flex items-center">
              <FileText size={18} className="mr-2 text-indigo-500" />
              Lesson Plan (Markdown)
            </h3>
            <button className="text-xs font-bold text-indigo-600 flex items-center hover:text-indigo-800 bg-white px-2 py-1 rounded shadow-sm border border-indigo-100">
              <Bot size={14} className="mr-1" /> Hỏi AI
            </button>
          </div>
          <div className="flex-1 p-4 bg-[#FDFDFD]">
            <textarea 
              value={markdownInput}
              onChange={(e) => setMarkdownInput(e.target.value)}
              className="w-full h-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 resize-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-sm leading-relaxed text-gray-700 custom-scrollbar"
              placeholder="# Nhập kịch bản bài học vào đây...
Hoặc gõ / để mở Template AI:
- /5E (Giáo án 5 bước)
- /Stem (Dự án STEM)
- /Story (Kể chuyện)"
            />
          </div>
          <div className="p-4 bg-white border-t border-gray-200 space-y-3">
            {errorMsg && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded flex items-start">
                <AlertTriangle size={14} className="mr-1 mt-0.5 shrink-0" /> {errorMsg}
              </div>
            )}
            <button 
              onClick={handleGenerateStoryboard}
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Wand2 size={18} className="mr-2" />} 
              {isGenerating ? 'Đang phân tích kịch bản...' : 'Generate Storyboard & Timeline'}
            </button>
          </div>
        </aside>

        {/* Center/Right Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-100/50">
          
          {/* Video Preview Area */}
          <div className="flex-1 p-4 md:p-8 flex items-center justify-center relative">
            <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden relative border border-gray-800 flex items-center justify-center">
              <div className="text-gray-500 flex flex-col items-center">
                <Video size={48} className="mb-4 opacity-20" />
                <p className="font-medium">Video Player Preview (Remotion/ReactPlayer)</p>
                <p className="text-sm opacity-50 mt-1">Khu vực này sẽ render động dựa vào Timeline</p>
              </div>
              
              {/* Overlay Mockup */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden flex items-center justify-center p-8">
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl scale-100">
                  <h4 className="font-black text-xl text-gray-900 mb-4">Câu hỏi nhanh!</h4>
                  <p className="text-gray-600 mb-6 font-medium">Virus trong câu chuyện tên là gì?</p>
                  <div className="space-y-3">
                    {['A. Zeron', 'B. EDI', 'C. Scratch', 'D. RoboCat'].map((ans, i) => (
                      <button key={i} className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 font-bold text-gray-700 transition-colors">
                        {ans}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Playback Controls (Floating) */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md border border-white/20 shadow-xl px-6 py-3 rounded-full flex items-center space-x-6 z-20">
              <button className="text-gray-700 hover:text-indigo-600 transition-colors">
                <Square size={20} className="fill-current" />
              </button>
              <button className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-indigo-700 transition-transform hover:scale-105">
                <Play size={24} className="ml-1 fill-current" />
              </button>
              <div className="text-sm font-bold font-mono text-gray-700">
                00:00:00 <span className="text-gray-400 font-normal">/ 00:05:30</span>
              </div>
            </div>
          </div>

          {/* Timeline Editor Area */}
          <div className="h-72 bg-white border-t border-gray-200 flex flex-col shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] relative z-20">
            {/* Timeline Toolbar */}
            <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-4 justify-between">
              <div className="flex items-center space-x-4">
                <button className="text-xs font-bold text-gray-600 hover:text-indigo-600 flex items-center">
                  <MousePointer2 size={14} className="mr-1" /> Select
                </button>
                <div className="w-px h-4 bg-gray-300"></div>
                <button className="text-xs font-bold text-gray-600 hover:text-indigo-600 flex items-center">
                  <LayoutTemplate size={14} className="mr-1" /> Split
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400 font-medium">Zoom</span>
                <input type="range" className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
              </div>
            </div>

            {/* Timeline Tracks */}
            <div className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#1E1E1E] custom-scrollbar p-4">
              {/* Time Ruler */}
              <div className="h-6 border-b border-white/10 mb-2 flex">
                {[0, 5, 10, 15, 20, 25, 30].map(t => (
                  <div key={t} className="w-32 shrink-0 text-[10px] text-gray-500 font-mono border-l border-white/10 pl-1">
                    00:{t.toString().padStart(2, '0')}
                  </div>
                ))}
              </div>

              {/* Video/Image Track */}
              <div className="flex items-center mb-2">
                <div className="w-24 shrink-0 flex items-center text-xs font-bold text-gray-400">
                  <ImageIcon size={14} className="mr-2" /> Video
                </div>
                <div className="flex-1 h-12 bg-gray-800 rounded-md relative flex items-center group cursor-pointer overflow-hidden">
                  {scenes.length > 0 ? scenes.map((scene, index) => {
                    // Giả lập tính toán width và left dựa trên duration
                    let leftOffset = 0;
                    for(let i=0; i<index; i++) leftOffset += (scenes[i].duration || 10) * 15;
                    const width = (scene.duration || 10) * 15;
                    const colors = ['bg-blue-600/30 border-blue-500 text-blue-200', 'bg-purple-600/30 border-purple-500 text-purple-200', 'bg-orange-600/30 border-orange-500 text-orange-200', 'bg-pink-600/30 border-pink-500 text-pink-200'];
                    const colorClass = colors[index % colors.length];
                    
                    return (
                      <div key={scene.id} style={{ left: `${leftOffset}px`, width: `${width}px` }} className={`absolute h-full border rounded-md flex flex-col items-center justify-center text-[10px] font-bold p-1 ${colorClass}`}>
                        <span className="truncate w-full text-center">{scene.title}</span>
                        <span className="font-normal opacity-70 truncate w-full text-center">{scene.imagePrompt}</span>
                      </div>
                    );
                  }) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-medium">Chưa có dữ liệu. Hãy tạo Storyboard.</div>
                  )}
                </div>
              </div>

              {/* Voice/Audio Track */}
              <div className="flex items-center mb-2">
                <div className="w-24 shrink-0 flex items-center text-xs font-bold text-gray-400">
                  <Mic size={14} className="mr-2" /> Voice
                </div>
                <div className="flex-1 h-10 bg-gray-800 rounded-md relative flex items-center group cursor-pointer overflow-hidden">
                  {scenes.length > 0 && scenes.map((scene, index) => {
                    let leftOffset = 0;
                    for(let i=0; i<index; i++) leftOffset += (scenes[i].duration || 10) * 15;
                    const width = (scene.duration || 10) * 15 - 5; // Trừ hao khoảng trống
                    
                    return (
                      <div key={'voice_'+scene.id} style={{ left: `${leftOffset}px`, width: `${width}px` }} className="absolute h-full bg-emerald-600/30 border border-emerald-500 rounded-md flex items-center px-2 text-[10px] font-bold text-emerald-200 truncate">
                        {scene.voiceScript || 'No voice script'}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interaction Track */}
              <div className="flex items-center">
                <div className="w-24 shrink-0 flex items-center text-xs font-bold text-gray-400">
                  <Wand2 size={14} className="mr-2" /> Interact
                </div>
                <div className="flex-1 h-6 bg-gray-800/50 rounded-md relative flex items-center">
                  {scenes.length > 0 && scenes.flatMap((scene, sIdx) => {
                    let baseLeft = 0;
                    for(let i=0; i<sIdx; i++) baseLeft += (scenes[i].duration || 10) * 15;
                    
                    return (scene.interactions || []).map((inter: any, iIdx: number) => {
                       const markerLeft = baseLeft + (inter.time || 5) * 15;
                       return (
                         <div key={`inter_${sIdx}_${iIdx}`} style={{ left: `${markerLeft}px` }} className="absolute w-3 h-3 bg-yellow-400 rotate-45 border-2 border-[#1E1E1E] shadow-[0_0_10px_rgba(250,204,21,0.5)] cursor-pointer hover:scale-125 transition-transform group" title={inter.title || "Interaction"}>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-gray-900 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                              {inter.type}: {inter.title}
                            </div>
                         </div>
                       );
                    });
                  })}
                </div>
              </div>

              {/* Playhead */}
              <div className="absolute top-0 bottom-0 left-[64px] w-0.5 bg-red-500 z-30 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45"></div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* AI Settings Modal (Reused from Scratchblocks) */}
      {showAiSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Settings className="mr-2 text-indigo-500" /> Cấu hình API Trợ lý Video
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Google Gemini API Key</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="AIzaSy..."
                />
                <p className="text-xs text-gray-500 mt-2">Dữ liệu Key lưu hoàn toàn tại Local Storage của trình duyệt.</p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô hình AI (Model)</label>
                <select 
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <optgroup label="Thế hệ 3.x (Mới nhất 2026)">
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (SOTA)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Suy luận chuyên sâu)</option>
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Tiết kiệm, Tốc độ cao)</option>
                    <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                  </optgroup>
                  <optgroup label="Aliases (Luôn cập nhật)">
                    <option value="gemini-pro-latest">Gemini Pro Latest</option>
                    <option value="gemini-flash-latest">Gemini Flash Latest</option>
                    <option value="gemini-flash-lite-latest">Gemini Flash-Lite Latest</option>
                  </optgroup>
                  <optgroup label="Thế hệ 2.x">
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash-Lite</option>
                    <option value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro Experimental</option>
                  </optgroup>
                  <optgroup label="Thế hệ 1.5 (Cổ điển)">
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash-8B</option>
                  </optgroup>
                </select>
              </div>
            </div>
            
            <div className="mt-8 flex space-x-3">
              <button 
                onClick={() => setShowAiSettings(false)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
              <button 
                onClick={handleSaveAiConfig}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
