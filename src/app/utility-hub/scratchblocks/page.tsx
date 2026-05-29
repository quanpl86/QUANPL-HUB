'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ChevronRight, Box, Code2, 
  Settings, Key, Send, Bot, Sparkles, MessageSquare, Download, Camera, Check, Loader2, Maximize, Minimize, GripVertical
} from 'lucide-react';
import { SCRATCH_AGENT_SYSTEM_PROMPT } from '@/config/scratch-prompt';
// Dynamically load scratchblocks to avoid SSR "window is not defined" error

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Hàm tiền xử lý để tương thích với thói quen viết ngoặc nhọn { } của user, Markdown và lỗi chính tả
const preprocessScratchCode = (code: string) => {
  return code
    .normalize('NFC') // Chuẩn hóa Unicode tiếng Việt (tránh lỗi font decomposed)
    .replace(/```scratch/gi, '') // Xóa markdown block start
    .replace(/```/g, '') // Xóa markdown block end
    // Xử lý các icon và cụm từ thông dụng của Scratch Tiếng Việt
    .replace(/(khi|lúc)\s+(nhấn|bấm)\s+(vào\s+)?(lá\s+)?cờ xanh/gi, 'Khi bấm vào @greenFlag')
    .replace(/xoay phải/gi, 'xoay @turnRight')
    .replace(/xoay trái/gi, 'xoay @turnLeft')
    .replace(/nếu tiếp xúc cạnh, bật lại/gi, 'bật lại nếu chạm cạnh')
    .replace(/\bnối\s+(?=\[|\()/gi, 'kết hợp ')
    // Ghép nhánh if-else: '}' + 'nếu không' + '{' -> 'else' để scratchblocks nhận diện đúng C-Block 2 nhánh
    .replace(/\}\s*(nếu không|nếu không thì|else)\s*\{/gi, '\nelse\n')
    .replace(/\{/g, '') // Xóa các dấu { mở block còn lại
    .replace(/\}/g, '\nend\n') // Chuyển dấu } đóng block thành từ khóa end
    .trim();
};

export default function ScratchblocksStudioPage() {
  const [activeTab, setActiveTab] = useState<'editor' | 'ai'>('ai');
  const [scratchblocks, setScratchblocks] = useState<any>(null);
  
  // Editor Layout State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [blockCode, setBlockCode] = useState(`khi bấm vào lá cờ xanh\nđi tới điểm x: (0) y: (0)\nliên tục\n  di chuyển (10) bước\n  xoay phải (15) độ\n  nếu tiếp xúc cạnh, bật lại\nend`);
  const previewRef = useRef<HTMLDivElement>(null);
  const [apiKey, setApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load AI config and initialize scratchblocks
  useEffect(() => {
    // Initialize scratchblocks dynamically on client side
    import('scratchblocks').then((sb) => {
      const sbModule = sb.default || sb;
      // @ts-ignore
      import('scratchblocks/build/translations-all-es.js').then((trans) => {
        try {
          const initTrans = trans.default || trans;
          if (typeof initTrans === 'function') {
            initTrans(sbModule); // The translation module exports an init function that takes scratchblocks
          } else {
            sbModule.loadLanguages(initTrans.languages || initTrans);
          }
        } catch (e) {
          console.error("Failed to load scratchblocks languages:", e);
        }
        setScratchblocks(sbModule);
      });
    }).catch(err => console.error("Failed to load scratchblocks module", err));

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

  // Render blocks when code changes
  useEffect(() => {
    if (previewRef.current && scratchblocks) {
      previewRef.current.innerHTML = ''; // Clear previous
      try {
        const processedCode = preprocessScratchCode(blockCode);
        const doc = scratchblocks.parse(processedCode, {
          languages: ['en', 'vi'] // Support English and Vietnamese
        });
        const svg = scratchblocks.render(doc, {
          style: 'scratch3',
          languages: ['en', 'vi']
        });
        previewRef.current.appendChild(svg);
      } catch (e) {
        console.error(e);
        previewRef.current.innerText = 'Lỗi render khối lệnh';
      }
    }
  }, [blockCode, activeTab, scratchblocks, isFullscreen, leftWidth]); // Re-render when switching tabs, scratchblocks loads, or resizing

  // Dragging Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none'; // Prevent text selection while dragging
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    // Constrain between 20% and 80%
    if (newLeftWidth >= 20 && newLeftWidth <= 80) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
  };

  const callGeminiApi = async (messages: ChatMessage[]) => {
    if (!apiKey) {
      alert("Vui lòng nhập API Key trong phần Cài đặt AI trước khi sử dụng.");
      setShowAiSettings(true);
      return;
    }

    setIsAiTyping(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;
      
      const contents = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const payload = {
        system_instruction: {
          parts: [{ text: SCRATCH_AGENT_SYSTEM_PROMPT }]
        },
        contents: contents
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "API Error");
      }

      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (replyText) {
        setChatHistory(prev => [...prev, { role: 'model', text: replyText }]);
      }
    } catch (error: any) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'model', text: `❌ Lỗi kết nối: ${error.message}` }]);
    } finally {
      setIsAiTyping(false);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput.trim();
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: userMsg }];
    
    setChatHistory(newHistory);
    setChatInput('');
    
    setTimeout(() => {
      if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }, 100);

    callGeminiApi(newHistory);
  };

  const handleDownloadSVG = () => {
    if (!previewRef.current) return;
    const svgEl = previewRef.current.querySelector('svg');
    if (!svgEl) return;
    
    // Convert SVG to string
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    
    // Add XML declaration
    const svgBlob = new Blob(['<?xml version="1.0" standalone="no"?>\r\n' + source], {type: 'image/svg+xml;charset=utf-8'});
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'scratch-blocks.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Khối Component ChatMessageRenderer để render Markdown và Code block
  const renderChatMessage = (text: string) => {
    // Tách riêng phần ```scratch ... ``` ra khỏi text
    const parts = text.split(/(\`\`\`scratch[\s\S]*?\`\`\`)/g);
    
    return (
      <div className="space-y-4 text-sm leading-relaxed">
        {parts.map((part, idx) => {
          if (part.startsWith('\`\`\`scratch')) {
            const code = part.replace('\`\`\`scratch', '').replace('\`\`\`', '').trim();
            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm my-4">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-gray-500">Mã khối lệnh sinh bởi AI</span>
                  <button 
                    onClick={() => {
                      setBlockCode(code);
                      setActiveTab('editor');
                    }}
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Box size={14} className="mr-1" /> Mang vào Trạm Chỉnh sửa
                  </button>
                </div>
                <div className="p-6 bg-[#F9F9F9] overflow-x-auto custom-scrollbar flex items-center justify-center">
                   <div ref={(el) => {
                     if (el && code && scratchblocks) {
                       el.innerHTML = '';
                       try {
                         const processedCode = preprocessScratchCode(code);
                         const doc = scratchblocks.parse(processedCode, { languages: ['en', 'vi'] });
                         const svg = scratchblocks.render(doc, { style: 'scratch3', languages: ['en', 'vi'] });
                         el.appendChild(svg);
                       } catch (e) {
                         el.innerText = 'Lỗi render khối lệnh';
                       }
                     } else if (el && !scratchblocks) {
                       el.innerText = 'Đang tải trình render...';
                     }
                   }} />
                </div>
              </div>
            );
          }
          
          // Chỗ này đáng lý dùng ReactMarkdown, nhưng để đơn giản ta render thô trước
          // hoặc chia dòng `<br/>`
          return (
            <div key={idx} className="whitespace-pre-wrap">
              {part}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 pt-24 font-inter">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2 font-medium">
              <Link href="/utility-hub" className="hover:text-indigo-600 transition-colors">Utility Hub</Link>
              <ChevronRight size={16} className="mx-1" />
              <span className="text-gray-900">AI Scratchblocks Studio</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
              <Sparkles className="mr-3 text-indigo-500" size={32} />
              Trạm Sinh Mã Scratchblocks
            </h1>
            <p className="text-gray-500 mt-2 text-sm max-w-2xl">
              Hỏi AI để viết thuật toán, hệ thống sẽ tự động vẽ ngay ra các khối lệnh Scratch 3.0 sắc nét để bạn chèn vào giáo án.
            </p>
          </div>

          {/* AI Settings Button */}
          <button 
            onClick={() => setShowAiSettings(true)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              apiKey ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            }`}
          >
            {apiKey ? <Check size={18} /> : <Key size={18} />}
            <span>{apiKey ? 'API Đã Kết Nối' : 'Chưa Kết Nối API'}</span>
            <Settings size={16} className="ml-2 opacity-50" />
          </button>
        </div>

        {/* AI Settings Modal */}
        {showAiSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Settings className="mr-2 text-indigo-500" /> Cấu hình API Trợ lý Khối lệnh
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
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Nhanh, nhẹ)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Suy luận sâu)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Bản mới nhất)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Thử nghiệm)</option>
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

        {/* TABS */}
        <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm border border-gray-200 w-full sm:w-fit">
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold flex items-center justify-center transition-all ${
              activeTab === 'ai' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Bot size={18} className="mr-2" /> Trợ lý AI Khối lệnh
          </button>
          <button 
            onClick={() => setActiveTab('editor')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold flex items-center justify-center transition-all ${
              activeTab === 'editor' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Code2 size={18} className="mr-2" /> Trạm Chỉnh sửa Code
          </button>
        </div>

        {/* WORKSPACE */}
        {activeTab === 'ai' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col h-[700px] overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex items-center">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-3">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Scratch AI Copilot</h3>
                <p className="text-xs text-gray-500">Hỏi tôi bất cứ thuật toán nào, tôi sẽ viết thành mã Scratch cho bạn.</p>
              </div>
            </div>
            
            {/* Chat History */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <MessageSquare size={48} className="opacity-20" />
                  <p>Hãy gửi một yêu cầu để bắt đầu (VD: Viết thuật toán vẽ hình vuông)</p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-5 shadow-sm ${
                      msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                    }`}>
                      {msg.role === 'model' ? (
                        renderChatMessage(msg.text)
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-5 shadow-sm flex items-center space-x-2">
                    <Loader2 size={20} className="animate-spin text-indigo-500" />
                    <span className="text-gray-500 text-sm font-medium">Trợ lý đang phân tích và render khối lệnh...</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Hỏi AI tạo khối lệnh Scratch..."
                  className="flex-1 bg-transparent py-3 outline-none text-gray-800"
                  disabled={isAiTyping}
                />
                <button 
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isAiTyping}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:active:scale-100 active:scale-95 flex-shrink-0 shadow-md shadow-indigo-500/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className={isFullscreen ? 'fixed inset-0 z-50 bg-gray-50 p-4 md:p-6 flex flex-col' : 'animate-in fade-in slide-in-from-bottom-4'}>
            
            {isFullscreen && (
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-black text-gray-900 flex items-center">
                   <Code2 className="mr-3 text-purple-600" size={28} /> Trạm Chỉnh sửa Code (Toàn màn hình)
                 </h2>
                 <button onClick={() => setIsFullscreen(false)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold flex items-center hover:bg-gray-50 shadow-sm">
                   <Minimize size={18} className="mr-2" /> Thu nhỏ
                 </button>
               </div>
            )}

            <div ref={containerRef} className={`flex ${isFullscreen ? 'flex-1 min-h-0' : 'h-[750px]'} relative bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden`}>
              
              {/* Editor Left */}
              <div style={{ width: `${leftWidth}%` }} className="flex flex-col h-full bg-[#1E1E1E]">
                <div className="bg-[#2D2D2D] border-b border-[#404040] p-4 font-bold text-gray-200 flex items-center justify-between flex-shrink-0">
                  <span className="flex items-center"><Code2 size={18} className="mr-2 text-purple-400" /> Trình soạn thảo (Text)</span>
                </div>
                <textarea 
                  value={blockCode}
                  onChange={(e) => setBlockCode(e.target.value)}
                  className="flex-1 p-6 font-mono text-sm leading-relaxed bg-transparent text-[#D4D4D4] outline-none resize-none custom-scrollbar"
                  placeholder="Nhập cú pháp scratchblocks vào đây..."
                  spellCheck={false}
                />
              </div>
              
              {/* Draggable Divider */}
              <div 
                className="w-3 flex-shrink-0 cursor-col-resize bg-gray-100 hover:bg-indigo-500 transition-colors flex flex-col justify-center items-center group relative z-10 border-x border-gray-200"
                onMouseDown={handleMouseDown}
              >
                <div className="w-1 h-12 bg-gray-300 group-hover:bg-white rounded-full flex items-center justify-center">
                   <GripVertical size={12} className="text-gray-400 group-hover:text-indigo-200 opacity-0 group-hover:opacity-100" />
                </div>
              </div>

              {/* Preview Right */}
              <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col h-full bg-[#F9F9F9]">
                <div className="bg-white border-b border-gray-200 p-4 font-bold text-gray-800 flex items-center justify-between flex-shrink-0">
                  <span className="flex items-center"><Box size={18} className="mr-2 text-blue-500" /> Kết quả Render (SVG)</span>
                  <div className="flex space-x-2">
                    {!isFullscreen && (
                      <button onClick={() => setIsFullscreen(true)} className="flex items-center space-x-1 text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <Maximize size={14} /> <span className="hidden sm:inline">Phóng to</span>
                      </button>
                    )}
                    <button onClick={handleDownloadSVG} className="flex items-center space-x-1 text-sm bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                      <Download size={14} /> <span className="hidden sm:inline">Tải SVG</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-8 flex items-start justify-center custom-scrollbar">
                  {/* Container cho SVG để đảm bảo không bị cắt xén nếu quá to */}
                  <div className="min-w-fit min-h-fit origin-top" ref={previewRef} />
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
