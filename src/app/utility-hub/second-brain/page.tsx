'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ChevronRight, Brain, BookOpen, Filter, Database, 
  ArrowRight, Download, Trash2, Edit, Save, FileText, 
  Tag, Info, CheckCircle2, Archive, Scissors, Loader2,
  Settings, Key, Send, Bot, Sparkles, MessageSquare
} from 'lucide-react';
import { get, set, del } from 'idb-keyval';
import JSZip from 'jszip';

interface Zettel {
  id: string;
  title: string;
  content: string; // Distilled content
  source: string;  // Raw source snippet
  tags: string[];
  createdAt: number;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export default function SecondBrainPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'distiller' | 'vault'>('manual');
  const [zettels, setZettels] = useState<Zettel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Distiller State
  const rawTextRef = useRef<HTMLTextAreaElement>(null);
  const [distillTitle, setDistillTitle] = useState('');
  const [distillContent, setDistillContent] = useState('');
  const [distillTags, setDistillTags] = useState('');
  const [distillSource, setDistillSource] = useState('');
  const [showToast, setShowToast] = useState(false);

  // AI State
  const [apiKey, setApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load Vault and API Key on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await get<Zettel[]>('second_brain_vault');
        if (data) setZettels(data);
      } catch (e) {
        console.error("Failed to load vault", e);
      }
      setIsLoading(false);
    };
    loadData();

    // Load AI config
    const savedKey = localStorage.getItem('gemini_api_key');
    const savedModel = localStorage.getItem('gemini_model');
    if (savedKey) setApiKey(savedKey);
    if (savedModel) setAiModel(savedModel);
  }, []);

  // Save AI Config
  const handleSaveAiConfig = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    localStorage.setItem('gemini_model', aiModel);
    setShowAiSettings(false);
  };

  // Save Vault
  const saveVault = async (newZettels: Zettel[]) => {
    setZettels(newZettels);
    await set('second_brain_vault', newZettels);
  };

  // Extract selected text
  const handleExtractHighlight = () => {
    if (!rawTextRef.current) return;
    const start = rawTextRef.current.selectionStart;
    const end = rawTextRef.current.selectionEnd;
    if (start === end) {
      alert("Vui lòng bôi đen một đoạn văn bản bên trái trước khi trích xuất!");
      return;
    }
    const selected = rawTextRef.current.value.substring(start, end);
    setDistillSource(selected);
    
    // Auto-focus content to force user to write their own understanding
    setDistillContent(prev => prev + (prev ? '\n\n' : '') + `> ${selected}\n\n**Diễn giải của tôi:** \n`);
  };

  const handleSaveDistilled = async () => {
    if (!distillTitle || !distillContent) {
      alert("Vui lòng nhập Tiêu đề và Nội dung chắt lọc!");
      return;
    }

    const tagsArray = distillTags.split(',').map(t => t.trim()).filter(t => t);
    
    const newZettel: Zettel = {
      id: Math.random().toString(36).substring(7),
      title: distillTitle,
      content: distillContent,
      source: distillSource,
      tags: tagsArray.length > 0 ? tagsArray : ['#untagged'],
      createdAt: Date.now()
    };

    await saveVault([newZettel, ...zettels]);
    
    // Reset form
    setDistillTitle('');
    setDistillContent('');
    setDistillSource('');
    setDistillTags('');
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDeleteZettel = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa Insight này không?")) {
      const filtered = zettels.filter(z => z.id !== id);
      await saveVault(filtered);
    }
  };

  const handleExportZip = async () => {
    if (zettels.length === 0) return;
    const zip = new JSZip();
    
    zettels.forEach(z => {
      const tagString = z.tags.join(' ');
      const markdown = `# ${z.title}\n\n**Ngày chắt lọc:** ${new Date(z.createdAt).toLocaleString('vi-VN')}\n**Tags:** ${tagString}\n\n---\n\n## Insight\n${z.content}\n\n---\n\n## Trích dẫn gốc\n> ${z.source || 'Không có trích dẫn gốc'}\n`;
      
      const safeTitle = z.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      zip.file(`${safeTitle}-${z.id}.md`, markdown);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SecondBrain_Vault_${new Date().getTime()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // AI Interaction Logic
  const callGeminiApi = async (messages: ChatMessage[]) => {
    if (!apiKey) {
      alert("Vui lòng nhập API Key trong phần Cài đặt AI trước khi sử dụng.");
      setShowAiSettings(true);
      return null;
    }

    setIsAiTyping(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;
      
      const contents = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const systemInstruction = "Bạn là một Chuyên gia Quản lý Tri thức (PKM) và Phương pháp Zettelkasten. Nhiệm vụ của bạn là PHẢN BIỆN và ĐẶT CÂU HỎI (Socratic) để giúp người dùng suy nghĩ sâu hơn, không bao giờ làm thay hay tóm tắt hộ họ. Ngôn ngữ: Tiếng Việt. Định dạng câu trả lời bằng Markdown ngắn gọn, trực diện.";
      
      const payload = {
        system_instruction: {
          parts: [{ text: systemInstruction }]
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
    const rawData = rawTextRef.current?.value || '';
    
    // Auto-inject context if this is the first message
    let actualMsg = userMsg;
    if (chatHistory.length === 0 && rawData) {
      actualMsg = `[CONTEXT - Dữ liệu thô hiện tại đang đọc]:\n"""\n${rawData.substring(0, 3000)}...\n"""\n\nCâu hỏi của tôi: ${userMsg}`;
    }

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: userMsg }];
    // We only save the clean message to UI history, but we send the actualMsg to API
    const apiHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: actualMsg }];
    
    setChatHistory(newHistory);
    setChatInput('');
    
    setTimeout(() => {
      if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }, 100);

    callGeminiApi(apiHistory);
  };

  const handleCritiqueInsight = () => {
    if (!distillContent) {
      alert("Bạn chưa viết diễn giải nào để phản biện!");
      return;
    }
    
    setShowAiPanel(true);
    const rawData = rawTextRef.current?.value || '';
    
    const prompt = `[CONTEXT - Văn bản thô]:\n"""\n${rawData.substring(0, 2000)}...\n"""\n\n[INSIGHT CỦA TÔI]:\n"""\n${distillContent}\n"""\n\nHãy đánh giá Insight của tôi. Tôi đã chắt lọc đúng trọng tâm chưa, hay chỉ đang chép vẹt lại văn bản gốc? Hãy chỉ ra lỗ hổng tư duy và đề xuất 3 thẻ Tag (ví dụ #Tag) phù hợp nhất cho Insight này.`;
    
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: "Hãy phản biện Insight tôi vừa viết và đề xuất Tags." }];
    const apiHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: prompt }];
    
    setChatHistory(newHistory);
    callGeminiApi(apiHistory);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative">
      {/* Settings Modal */}
      {showAiSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Key size={20} /></div>
              <h3 className="text-xl font-bold text-gray-900">Cài đặt AI Sparring</h3>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Google Gemini API Key</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Key được lưu trữ an toàn 100% tại máy tính của bạn (Local Storage).</p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">AI Model</label>
                <select 
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm bg-gray-50"
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
            
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowAiSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveAiConfig}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-8 relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link href="/utility-hub" className="hover:text-blue-600 transition-colors">Utility Hub</Link>
            <ChevronRight size={16} />
            <span className="text-gray-900 font-medium">Second Brain System</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Brain size={24} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Second Brain Control Center</h1>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl">
                Hệ thống quản lý tri thức cá nhân (PKM). Nơi <b>con người đóng vai trò là màng lọc</b>, giúp chưng cất dữ liệu thô thành Tri thức có tính ứng dụng cao.
              </p>
            </div>
            
            <button 
              onClick={() => setShowAiSettings(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-600 transition-colors shadow-sm"
            >
              <Settings size={16} />
              <span>Cấu hình AI</span>
              {apiKey ? (
                <span className="w-2 h-2 rounded-full bg-green-500 ml-2"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-red-400 ml-2 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('manual')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'manual' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen size={18} className="mr-2" />
              1. Học viện Tư duy (Manual)
            </button>
            <button
              onClick={() => setActiveTab('distiller')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'distiller' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Filter size={18} className="mr-2" />
              2. Trạm Chưng cất (Distiller)
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'vault' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database size={18} className="mr-2" />
              3. Kho Lưu trữ (The Vault)
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{zettels.length}</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: MANUAL */}
        {activeTab === 'manual' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-3xl">
                <h2 className="text-3xl font-bold mb-4">Triết lý: Con người là màng lọc</h2>
                <p className="text-blue-100 text-lg leading-relaxed mb-6">
                  Trong thời đại AI, việc dùng máy tính đi cào hàng ngàn bài viết về nhét đầy ổ cứng chỉ tạo ra <b>"Rác thải tri thức" (Knowledge Trash)</b>. Một hệ thống Second Brain thực thụ đòi hỏi con người phải can thiệp vào quá trình chắt lọc, phân loại và kết nối thông tin để biến nó thành Tri thức ứng dụng được vào giảng dạy STEM, Robotics, hay Lập trình.
                </p>
                <button onClick={() => setActiveTab('distiller')} className="bg-white text-blue-700 px-6 py-3 rounded-xl font-bold flex items-center hover:bg-blue-50 transition-colors shadow-lg">
                  Bắt đầu chưng cất tri thức <ArrowRight size={18} className="ml-2" />
                </button>
              </div>
              <Brain size={250} className="absolute -bottom-10 -right-10 text-white opacity-10" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* CODE Method */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:border-blue-200 transition-colors">
                <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 mb-6">
                  <Filter size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Phương pháp C.O.D.E</h3>
                <p className="text-gray-600 mb-6">Quy trình 4 bước biến thông tin thô thành Tri thức của riêng bạn (Theo Tiago Forte).</p>
                
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center mr-3">C</span>
                    <div>
                      <strong className="block text-gray-900">Capture (Thu thập)</strong>
                      <span className="text-sm text-gray-500">Chỉ thu thập những gì thực sự tạo cảm hứng hoặc có ích cho dự án hiện tại. Đừng lưu trữ mọi thứ.</span>
                    </div>
                  </li>
                  <li className="flex items-start group">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">O</span>
                    <div>
                      <strong className="block text-gray-900 flex items-center">
                        Organize (Tổ chức) 
                        <span title="Tại sao cần tổ chức? Để dễ dàng tìm lại khi cần thiết.">
                          <Info size={14} className="ml-2 text-gray-400" />
                        </span>
                      </strong>
                      <span className="text-sm text-gray-500">Tổ chức theo Hành động (Actionability) thay vì Chủ đề. Lưu vào thư mục của Dự án bạn đang làm.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center mr-3">D</span>
                    <div>
                      <strong className="block text-gray-900">Distill (Chưng cất)</strong>
                      <span className="text-sm text-gray-500">Bôi đậm những ý chính, viết lại bằng lời của bạn. Đây là bước quan trọng nhất mà AI không thể làm thay bạn.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center mr-3">E</span>
                    <div>
                      <strong className="block text-gray-900">Express (Thể hiện)</strong>
                      <span className="text-sm text-gray-500">Sử dụng tri thức đã chưng cất để tạo ra bài giảng, code, đồ án, hoặc thiết kế mới.</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* PARA Method */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:border-indigo-200 transition-colors">
                <div className="inline-flex p-3 rounded-lg bg-indigo-50 text-indigo-600 mb-6">
                  <Archive size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Cấu trúc P.A.R.A</h3>
                <p className="text-gray-600 mb-6">Cách thiết lập thư mục lưu trữ khoa học nhất thế giới. Sắp xếp theo mức độ Hành động (Action).</p>
                
                <ul className="space-y-4">
                  <li className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-indigo-200 transition-colors shadow-sm">
                    <strong className="block text-gray-900 mb-1">1. Projects (Dự án đang chạy)</strong>
                    <p className="text-sm text-gray-600">Có mục tiêu và thời hạn rõ ràng. <i>VD: Khóa học Lập trình C++ Hè 2026, Xây sa bàn WRO 2026.</i></p>
                  </li>
                  <li className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-indigo-200 transition-colors shadow-sm">
                    <strong className="block text-gray-900 mb-1">2. Areas (Lĩnh vực trách nhiệm)</strong>
                    <p className="text-sm text-gray-600">Hoạt động cần duy trì liên tục không có thời hạn. <i>VD: Sức khỏe, Đào tạo nhân sự, Quản lý tài chính.</i></p>
                  </li>
                  <li className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-indigo-200 transition-colors shadow-sm">
                    <strong className="block text-gray-900 mb-1">3. Resources (Tài nguyên)</strong>
                    <p className="text-sm text-gray-600">Các chủ đề sở thích, kiến thức chung. <i>VD: Kiến trúc AI, Typography, Luật lệ Robotics.</i></p>
                  </li>
                  <li className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-indigo-200 transition-colors shadow-sm">
                    <strong className="block text-gray-900 mb-1">4. Archives (Lưu trữ)</strong>
                    <p className="text-sm text-gray-600">Dự án đã xong hoặc tài nguyên không còn dùng. Giữ lại để tham khảo sau này.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DISTILLER */}
        {activeTab === 'distiller' && (
          <div className={`grid gap-6 h-[75vh] animate-in fade-in slide-in-from-bottom-4 duration-500 ${showAiPanel ? 'lg:grid-cols-[1fr_1fr_1fr]' : 'lg:grid-cols-2'}`}>
            
            {/* COLUMN 1: RAW DATA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Dữ liệu thô (Raw Data)</h3>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center border
                      ${showAiPanel ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    <Sparkles size={14} className="mr-1.5" />
                    {showAiPanel ? 'Đóng AI' : 'Bật AI Phản biện'}
                  </button>
                  <button 
                    onClick={handleExtractHighlight}
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center shadow-sm"
                  >
                    <Scissors size={14} className="mr-1.5" />
                    Cắt đoạn
                  </button>
                </div>
              </div>
              <textarea 
                ref={rawTextRef}
                className="flex-1 w-full p-6 resize-none outline-none text-gray-700 leading-relaxed font-serif text-[15px]"
                placeholder="Dán toàn bộ bài báo dài, transcript video... vào đây. Sau đó bôi đen những câu đắt giá nhất và bấm nút 'Cắt đoạn'."
              ></textarea>
            </div>

            {/* COLUMN 2: ZETTELKASTEN EDITOR */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden relative">
              {showToast && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full font-medium shadow-lg flex items-center animate-in slide-in-from-top-2">
                  <CheckCircle2 size={20} className="mr-2" /> Đã lưu vào The Vault!
                </div>
              )}

              <div className="px-5 py-3 border-b border-gray-100 bg-blue-50/50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 text-sm">Màng lọc (Distilled Insight)</h3>
                </div>
                <button 
                  onClick={handleCritiqueInsight}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center transition-colors border border-indigo-100"
                >
                  <Bot size={14} className="mr-1.5" />
                  Nhờ AI Đánh giá Insight này
                </button>
              </div>
              
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                <div>
                  <input 
                    type="text" 
                    value={distillTitle}
                    onChange={(e) => setDistillTitle(e.target.value)}
                    placeholder="Tiêu đề (VD: Cơ chế hoạt động của PID...)"
                    className="w-full text-lg font-bold p-3 border-b-2 border-gray-100 outline-none focus:border-blue-500 transition-colors placeholder:font-normal"
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-[300px]">
                  <textarea 
                    value={distillContent}
                    onChange={(e) => setDistillContent(e.target.value)}
                    placeholder="> Trích dẫn gốc...\n\nDiễn giải của tôi (Bắt buộc): ..."
                    className="flex-1 w-full p-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm leading-relaxed"
                  ></textarea>
                </div>

                <div>
                  <div className="flex items-center">
                    <Tag size={16} className="text-gray-400 absolute ml-3" />
                    <input 
                      type="text" 
                      value={distillTags}
                      onChange={(e) => setDistillTags(e.target.value)}
                      placeholder="#Tags (cách nhau bởi dấu phẩy)"
                      className="w-full pl-9 p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                <button 
                  onClick={handleSaveDistilled}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-md shadow-blue-500/20"
                >
                  <Save size={18} className="mr-2" />
                  Lưu Zettel vào The Vault
                </button>
              </div>
            </div>

            {/* COLUMN 3: AI SPARRING PARTNER */}
            {showAiPanel && (
              <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 flex flex-col h-full overflow-hidden animate-in slide-in-from-right-8 duration-300">
                <div className="px-5 py-3 border-b border-indigo-100 bg-indigo-50/50 flex items-center">
                  <Bot size={18} className="text-indigo-600 mr-2" />
                  <h3 className="font-bold text-indigo-900 text-sm">Đối tác Tư duy (Sparring)</h3>
                </div>

                {/* Chat History */}
                <div ref={chatScrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-gray-50/30">
                  {chatHistory.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                      <Sparkles size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Tôi là chuyên gia PKM.<br/>Hãy bôi đen dữ liệu thô và hỏi tôi, hoặc bấm "Nhờ AI Đánh giá" để tôi phản biện Insight của bạn.</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                          ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}
                        `}>
                          {/* Render newlines correctly for markdown-like feeling */}
                          {msg.text.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                              {line}<br/>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  {isAiTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex space-x-2 items-center">
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex items-end bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <textarea 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder="Hỏi AI về bài viết này..."
                      className="flex-1 bg-transparent p-3 max-h-32 outline-none text-sm resize-none"
                      rows={1}
                    ></textarea>
                    <button 
                      onClick={handleSendChat}
                      disabled={isAiTyping || !chatInput.trim()}
                      className={`p-3 transition-colors ${chatInput.trim() ? 'text-indigo-600 hover:bg-indigo-100' : 'text-gray-300'}`}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: THE VAULT */}
        {activeTab === 'vault' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 max-w-7xl mx-auto">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Local Vault</h2>
                <p className="text-gray-500 text-sm mt-1">Dữ liệu được mã hóa và lưu trữ an toàn 100% trên Trình duyệt (IndexedDB) của bạn. Không cần Server.</p>
              </div>
              <button 
                onClick={handleExportZip}
                disabled={zettels.length === 0}
                className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm
                  ${zettels.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-95'}`}
              >
                <Download size={16} className="mr-2" />
                Backup / Export .ZIP ({zettels.length} Insights)
              </button>
            </div>

            {isLoading ? (
              <div className="py-20 text-center text-gray-400 flex flex-col items-center">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Đang tải Kho lưu trữ...</p>
              </div>
            ) : zettels.length === 0 ? (
              <div className="bg-white border border-gray-200 border-dashed rounded-2xl py-20 text-center flex flex-col items-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                  <Database size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Kho tri thức đang trống</h3>
                <p className="text-gray-500 max-w-md mb-6">Hãy sang "Trạm Chưng Cất" để bắt đầu bóc tách và lưu lại những insight đầu tiên của bạn.</p>
                <button 
                  onClick={() => setActiveTab('distiller')}
                  className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center"
                >
                  Sang Trạm chưng cất <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {zettels.map(z => (
                  <div key={z.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {z.tags.map((tag, idx) => (
                          <span key={idx} className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button 
                        onClick={() => handleDeleteZettel(z.id)}
                        className="text-gray-300 hover:text-red-500 bg-gray-50 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                        title="Xóa insight"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug">{z.title}</h3>
                    
                    <div className="text-sm text-gray-700 line-clamp-4 flex-1 mb-4 font-mono bg-gray-50/50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                      {z.content}
                    </div>

                    <div className="mt-auto flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-100">
                      <span className="flex items-center"><FileText size={12} className="mr-1" /> Markdown</span>
                      <span>{new Date(z.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
