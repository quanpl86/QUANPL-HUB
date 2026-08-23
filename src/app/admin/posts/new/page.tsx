'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StaticCyberCard } from '@/components/ui/StaticCyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { createPost } from '@/app/actions/posts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Eye, Loader2, Maximize, Sparkles,
  PanelRightClose, PanelRightOpen, Bold, Italic, 
  Heading1, Heading2, Heading3, Heading4, Heading5,
  Link as LinkIcon, Undo, Redo, List, ListOrdered, ListTodo, Save,
  Type, Minus, Code, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Monitor, Quote, Table as TableIcon, Wand2, GitBranch, PanelTop,
  Lightbulb, HelpCircle, BarChart3, PenTool, Image as ImageIcon,
  Play as YoutubeIcon, Eraser, Underline as UnderIcon, Superscript as Supra,
  Subscript as Infra, Layers
} from 'lucide-react';
import { PreviewModal } from '@/components/admin/PreviewModal';
import { CoverImageUpload } from '@/components/admin/CoverImageUpload';
import dynamic from 'next/dynamic';

const CyberEditor = dynamic(() => import('@/components/admin/editor/CyberEditor').then(mod => mod.CyberEditor), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-cyber-black/20 animate-pulse border border-brand-orange/10 flex items-center justify-center font-mono text-xs text-brand-orange">ĐANG_TẢI_TRÌNH_SOẠN_THẢO...</div>
});

export default function NewPostPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'format' | 'structure' | 'ai-media'>('format');
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  // Scroll detection to display tools on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle body class for Zen Mode styling
  useEffect(() => {
    if (isZenMode) {
      document.body.classList.add('zen-mode-active');
    } else {
      document.body.classList.remove('zen-mode-active');
    }
    return () => {
      document.body.classList.remove('zen-mode-active');
    };
  }, [isZenMode]);

  // Load categories for selection
  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      setCategories(data || []);
    };
    fetchCats();
  }, []);

  const getPreviewData = () => {
    if (!formRef.current) return null;
    const formData = new FormData(formRef.current);
    const catId = formData.get('category_id');
    const category = categories.find(c => c.id.toString() === catId);
    
    return {
      title: formData.get('title') as string,
      excerpt: formData.get('excerpt') as string,
      content: content,
      image_url: formData.get('image_url') as string,
      category_name: category?.name
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createPost(formData, content);
      if (result.success) {
        toast.success('KHỞI_TẠO_THÀNH_CÔNG: Bài viết đã được đưa vào ma trận tri thức');
        router.push('/admin/posts');
      } else {
        toast.error(`LỖI_HỆ_THỐNG: ${result.error}`);
      }
    } catch (error) {
      toast.error('Không thể lưu bài viết. Vui lòng thử lại.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={`transition-all duration-500 ${isZenMode ? 'max-w-none px-6 md:px-16 py-8' : 'max-w-[1400px] mx-auto'}`}>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <span className="admin-eyebrow">Biên tập nội dung</span>
          <h1 className="cyber-h1 text-3xl mb-2">Tạo <span className="cyber-text-gradient">bài viết</span></h1>
          <p className="text-muted text-sm">Soạn nội dung, cấu hình metadata và kiểm tra trước khi xuất bản.</p>
        </div>

        <div className="flex gap-4">
          <CyberButton 
            type="button" 
            variant="outline" 
            className="flex items-center gap-2 border-brand-orange/20 text-brand-orange hover:bg-brand-orange/5"
            onClick={() => setIsZenMode(!isZenMode)}
          >
            <Maximize size={16} />
            {isZenMode ? 'Thoát tập trung' : 'Chế độ tập trung'}
          </CyberButton>
          <CyberButton 
            type="button" 
            variant="outline" 
            className="flex items-center gap-2 border-brand-orange/20 text-brand-orange hover:bg-brand-orange/5"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye size={16} />
            Xem trước
          </CyberButton>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className={`grid transition-all duration-500 ${isZenMode ? (isSidebarCollapsed ? 'grid-cols-1 lg:grid-cols-[1fr_64px] gap-6' : 'grid-cols-1 lg:grid-cols-[1fr_360px] gap-8') : 'grid-cols-1 lg:grid-cols-4 gap-8'}`}>
        {/* Main Editor Column */}
        <div className={`space-y-6 ${isZenMode ? 'min-w-0' : 'lg:col-span-3'}`}>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-brand-orange uppercase">Tiêu đề bài viết</label>
            <input 
              name="title"
              required
              placeholder="Nhập tiêu đề bài viết..."
              className="w-full bg-transparent border-b border-brand-orange/20 py-4 text-4xl font-orbitron font-bold text-foreground outline-none focus:border-brand-orange transition-colors placeholder:text-brand-orange/20"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-brand-orange uppercase">Mô tả ngắn</label>
            <textarea 
              name="excerpt"
              rows={2}
              className="w-full bg-cyber-black/40 border border-brand-orange/10 p-4 font-mono text-sm outline-none focus:border-brand-orange/40 transition-colors text-foreground"
              placeholder="Cung cấp một đoạn tóm tắt ngắn cho bài viết..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-brand-orange uppercase">Nội dung chi tiết</label>
            <CyberEditor content={content} onChange={setContent} onEditorInit={setEditorInstance} />
          </div>
        </div>

        {isZenMode && isSidebarCollapsed && (
          <div className="w-14 shrink-0 lg:sticky lg:top-8 self-start bg-cyber-black/90 border border-brand-orange/20 p-2 flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(255,87,34,0.1)] transition-all duration-300">
            <button 
              type="button" 
              onClick={() => setIsSidebarCollapsed(false)} 
              className="p-2 text-brand-orange hover:bg-brand-orange/10 hover:text-white transition-all rounded" 
              title="Mở rộng panel cấu hình"
            >
              <PanelRightOpen size={20} />
            </button>
            <div className="h-[1px] w-full bg-brand-orange/20 my-1"></div>
            
            {/* Group 3 Icon Chuyển Tab - Collapsed Mode */}
            <div className="w-full bg-cyber-black border border-brand-orange/30 rounded-lg p-1 flex flex-col gap-1.5 items-center shadow-[0_0_15px_rgba(249,115,22,0.15)] my-1">
              <span className="font-mono text-[8px] text-brand-orange/70 uppercase font-bold tracking-tighter">TAB</span>
              <button
                type="button"
                onClick={() => setActiveSidebarTab('format')}
                className={`w-9 h-9 flex items-center justify-center rounded transition-all ${
                  activeSidebarTab === 'format' 
                    ? 'text-cyber-black bg-brand-orange font-bold shadow-[0_0_10px_rgba(249,115,22,0.6)] scale-105' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/10'
                }`}
                title="Tab 1: Văn bản & Định dạng"
              >
                <Type size={16} />
              </button>
              <button
                type="button"
                onClick={() => setActiveSidebarTab('structure')}
                className={`w-9 h-9 flex items-center justify-center rounded transition-all ${
                  activeSidebarTab === 'structure' 
                    ? 'text-cyber-black bg-brand-orange font-bold shadow-[0_0_10px_rgba(249,115,22,0.6)] scale-105' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/10'
                }`}
                title="Tab 2: Cấu trúc & Căn lề"
              >
                <Layers size={16} />
              </button>
              <button
                type="button"
                onClick={() => setActiveSidebarTab('ai-media')}
                className={`w-9 h-9 flex items-center justify-center rounded transition-all ${
                  activeSidebarTab === 'ai-media' 
                    ? 'text-cyber-black bg-brand-orange font-bold shadow-[0_0_10px_rgba(249,115,22,0.6)] scale-105' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/10'
                }`}
                title="Tab 3: AI Khối & Media"
              >
                <Sparkles size={16} />
              </button>
            </div>
            <div className="h-[1px] w-full bg-brand-orange/20 my-1"></div>
            
            {editorInstance && (
              <div className="flex flex-col gap-2 items-center flex-grow overflow-y-auto max-h-[60vh] py-1 custom-scrollbar-none">
                {activeSidebarTab === 'format' && (
                  <>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().undo().run()}
                      disabled={!editorInstance.can().undo()}
                      className="p-1.5 rounded text-muted-foreground hover:text-white disabled:opacity-20"
                      title="Hoàn tác"
                    >
                      <Undo size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().redo().run()}
                      disabled={!editorInstance.can().redo()}
                      className="p-1.5 rounded text-muted-foreground hover:text-white disabled:opacity-20"
                      title="Làm lại"
                    >
                      <Redo size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().unsetAllMarks().run()}
                      className="p-1.5 rounded text-muted-foreground hover:text-white"
                      title="Xóa định dạng"
                    >
                      <Eraser size={16} />
                    </button>
                    <div className="h-[1px] w-8 bg-brand-orange/10 my-1"></div>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleBold().run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('bold') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="In đậm"
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleItalic().run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('italic') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="In nghiêng"
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleUnderline().run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('underline') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Gạch chân"
                    >
                      <UnderIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleStrike().run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('strike') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Gạch ngang"
                    >
                      <Minus size={16} className="rotate-45" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleCode().run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('code') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Mã dòng"
                    >
                      <Code size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Nhập liên kết URL:');
                        if (url) editorInstance.chain().focus().setLink({ href: url }).run();
                      }}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('link') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Liên kết"
                    >
                      <LinkIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleSuperscript().run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('superscript') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Chỉ số trên"
                    >
                      <Supra size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleSubscript().run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('subscript') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Chỉ số dưới"
                    >
                      <Infra size={16} />
                    </button>
                  </>
                )}

                {activeSidebarTab === 'structure' && (
                  <>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('heading', { level: 1 }) ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Tiêu đề 1"
                    >
                      <Heading1 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('heading', { level: 2 }) ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Tiêu đề 2"
                    >
                      <Heading2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('heading', { level: 3 }) ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Tiêu đề 3"
                    >
                      <Heading3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleHeading({ level: 4 }).run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('heading', { level: 4 }) ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Tiêu đề 4"
                    >
                      <Heading4 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleHeading({ level: 5 }).run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('heading', { level: 5 }) ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Tiêu đề 5"
                    >
                      <Heading5 size={16} />
                    </button>
                    <div className="h-[1px] w-8 bg-brand-orange/10 my-1"></div>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleBulletList().run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('bulletList') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Danh sách dấu chấm"
                    >
                      <List size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleOrderedList().run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('orderedList') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Danh sách số"
                    >
                      <ListOrdered size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleTaskList().run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('taskList') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Danh sách công việc"
                    >
                      <ListTodo size={16} />
                    </button>
                    <div className="h-[1px] w-8 bg-brand-orange/10 my-1"></div>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().setTextAlign('left').run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive({ textAlign: 'left' }) ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Căn trái"
                    >
                      <AlignLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().setTextAlign('center').run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive({ textAlign: 'center' }) ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Căn giữa"
                    >
                      <AlignCenter size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().setTextAlign('right').run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive({ textAlign: 'right' }) ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Căn phải"
                    >
                      <AlignRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().setTextAlign('justify').run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive({ textAlign: 'justify' }) ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Căn đều"
                    >
                      <AlignJustify size={16} />
                    </button>
                    <div className="h-[1px] w-8 bg-brand-orange/10 my-1"></div>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleCodeBlock().run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('codeBlock') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Khối mã lệnh"
                    >
                      <Monitor size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().toggleBlockquote().run()}
                      className={`p-1.5 rounded transition-colors ${editorInstance.isActive('blockquote') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white'}`}
                      title="Trích dẫn"
                    >
                      <Quote size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                      className="p-1.5 rounded text-muted-foreground hover:text-white"
                      title="Chèn bảng"
                    >
                      <TableIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().setHorizontalRule().run()}
                      className="p-1.5 rounded text-muted-foreground hover:text-white"
                      title="Đường kẻ ngang"
                    >
                      <Minus size={16} />
                    </button>
                  </>
                )}

                {activeSidebarTab === 'ai-media' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const md = prompt('Dán nội dung Markdown từ AI:');
                        if (md) {
                          editorInstance.chain().focus().insertContent(md).run();
                        }
                      }}
                      className="p-1.5 rounded text-brand-orange hover:bg-brand-orange/10"
                      title="Nhập từ AI"
                    >
                      <Wand2 size={16} />
                    </button>
                    <div className="h-[1px] w-8 bg-brand-orange/10 my-1"></div>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().insertContent({ type: 'workflowTimeline', attrs: { title: 'Quy trình triển khai thực hành', intro: 'Dùng block này cho các nội dung dạng quy trình...' } }).run()}
                      className="p-1.5 rounded text-muted-foreground hover:text-white"
                      title="Chèn quy trình / timeline"
                    >
                      <GitBranch size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().insertContent({ type: 'knowledgeCallout', attrs: { variant: 'insight', title: 'Insight trọng tâm', body: 'Viết kết luận quan trọng...' } }).run()}
                      className="p-1.5 rounded text-muted-foreground hover:text-white"
                      title="Chèn callout / ghi chú nổi bật"
                    >
                      <PanelTop size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().insertContent({ type: 'keyTakeaways', attrs: { title: 'TL;DR / Key Takeaways', points: ['Ý chính 1', 'Ý chính 2'] } }).run()}
                      className="p-1.5 rounded text-muted-foreground hover:text-white"
                      title="Chèn tóm tắt / TL;DR"
                    >
                      <Lightbulb size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().insertContent({ type: 'faqBlock', attrs: { question: 'Câu hỏi thường gặp?', answer: 'Câu trả lời chi tiết.' } }).run()}
                      className="p-1.5 rounded text-muted-foreground hover:text-white"
                      title="Chèn khối FAQ"
                    >
                      <HelpCircle size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().insertContent({ type: 'chartBlock', attrs: { title: 'Đồ thị dữ liệu', description: 'Mô tả dữ liệu...' } }).run()}
                      className="p-1.5 rounded text-muted-foreground hover:text-white"
                      title="Chèn đồ thị"
                    >
                      <BarChart3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editorInstance.chain().focus().insertContent({ type: 'drawingBoard', attrs: { title: 'Bảng vẽ minh họa', description: 'Dùng để vẽ...' } }).run()}
                      className="p-1.5 rounded text-muted-foreground hover:text-white"
                      title="Chèn bảng vẽ"
                    >
                      <PenTool size={16} />
                    </button>
                    <div className="h-[1px] w-8 bg-brand-orange/10 my-1"></div>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Nhập URL hình ảnh:');
                        if (url) editorInstance.chain().focus().setImage({ src: url }).run();
                      }}
                      className="p-1.5 rounded text-muted-foreground hover:text-white"
                      title="Chèn ảnh bằng URL"
                    >
                      <ImageIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Nhập link video YouTube:');
                        if (url) editorInstance.chain().focus().setYoutubeVideo({ src: url }).run();
                      }}
                      className="p-1.5 rounded text-muted-foreground hover:text-white"
                      title="Chèn Video YouTube"
                    >
                      <YoutubeIcon size={16} />
                    </button>
                  </>
                )}
              </div>
            )}
            
            <div className="h-[1px] w-full bg-brand-orange/20 my-1"></div>
            <button 
              type="submit" 
              disabled={isPending}
              className="p-2 bg-brand-orange text-cyber-black hover:bg-brand-orange/90 rounded transition-all shadow-[0_0_10px_rgba(249,115,22,0.3)] hover:scale-105"
              title="Đăng bài viết"
            >
              <Save size={18} />
            </button>
          </div>
        )}

        <div className={`space-y-6 transition-all duration-300 ${
          isZenMode && isSidebarCollapsed 
            ? 'hidden' 
            : isZenMode 
            ? 'lg:sticky lg:top-8 self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto pr-2 custom-scrollbar-thin' 
            : 'lg:sticky lg:top-24 self-start'
        }`}>
            {isZenMode && (
              <button 
                type="button" 
                onClick={() => setIsSidebarCollapsed(true)} 
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-brand-orange py-2 mb-2 border-b border-brand-orange/10 w-full justify-between group transition-colors"
              >
                <span className="font-mono uppercase text-[9px] tracking-wider">Thu gọn bảng điều khiển</span>
                <PanelRightClose size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {(isScrolled || isZenMode) && editorInstance && (
              <StaticCyberCard className="p-4 border-brand-orange/30 bg-cyber-black/80 backdrop-blur-md transition-all duration-300">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-brand-orange/10">
                  <h3 className="font-orbitron text-[9px] font-bold text-brand-orange uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} /> BẢNG CÔNG CỤ SOẠN THẢO
                  </h3>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-3 py-1 bg-brand-orange text-cyber-black font-orbitron font-bold text-[9px] hover:bg-brand-orange/90 rounded transition-all shadow-[0_0_8px_rgba(249,115,22,0.4)] flex items-center gap-1 hover:scale-105"
                  >
                    <Save size={10} /> ĐĂNG BÀI
                  </button>
                </div>

                {/* Tab Selector Headers */}
                <div className="flex bg-cyber-black/60 border border-white/5 mb-3">
                  {[
                    { id: 'format', label: 'VĂN BẢN' },
                    { id: 'structure', label: 'CẤU TRÚC' },
                    { id: 'ai-media', label: 'AI & MEDIA' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSidebarTab(tab.id as any)}
                      className={`flex-1 py-1.5 font-orbitron text-[8px] font-bold tracking-widest text-center transition-all ${
                        activeSidebarTab === tab.id 
                          ? 'text-brand-orange bg-brand-orange/5 border-b border-brand-orange' 
                          : 'text-muted-foreground hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Active Tab Buttons */}
                <div className="flex flex-wrap gap-1 min-h-[40px] items-center">
                  {activeSidebarTab === 'format' && (
                    <>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().undo().run()}
                        disabled={!editorInstance.can().undo()}
                        className="p-1.5 rounded text-muted-foreground hover:text-white disabled:opacity-20 border border-transparent"
                        title="Hoàn tác"
                      >
                        <Undo size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().redo().run()}
                        disabled={!editorInstance.can().redo()}
                        className="p-1.5 rounded text-muted-foreground hover:text-white disabled:opacity-20 border border-transparent"
                        title="Làm lại"
                      >
                        <Redo size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().unsetAllMarks().run()}
                        className="p-1.5 rounded text-muted-foreground hover:text-brand-orange border border-transparent"
                        title="Xóa định dạng"
                      >
                        <Eraser size={14} />
                      </button>
                      <div className="w-[1px] bg-white/10 h-4 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleBold().run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('bold') ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="In đậm"
                      >
                        <Bold size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleItalic().run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('italic') ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="In nghiêng"
                      >
                        <Italic size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleUnderline().run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('underline') ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Gạch chân"
                      >
                        <UnderIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleStrike().run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('strike') ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Gạch ngang"
                      >
                        <Minus size={14} className="rotate-45" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleCode().run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('code') ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Mã dòng"
                      >
                        <Code size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Nhập liên kết URL:');
                          if (url) editorInstance.chain().focus().setLink({ href: url }).run();
                        }}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('link') ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Liên kết"
                      >
                        <LinkIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleSuperscript().run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('superscript') ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Chỉ số trên"
                      >
                        <Supra size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleSubscript().run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('subscript') ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Chỉ số dưới"
                      >
                        <Infra size={14} />
                      </button>
                    </>
                  )}

                  {activeSidebarTab === 'structure' && (
                    <>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('heading', { level: 1 }) ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Tiêu đề 1"
                      >
                        <Heading1 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('heading', { level: 2 }) ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Tiêu đề 2"
                      >
                        <Heading2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('heading', { level: 3 }) ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Tiêu đề 3"
                      >
                        <Heading3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleHeading({ level: 4 }).run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('heading', { level: 4 }) ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Tiêu đề 4"
                      >
                        <Heading4 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleHeading({ level: 5 }).run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('heading', { level: 5 }) ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Tiêu đề 5"
                      >
                        <Heading5 size={14} />
                      </button>
                      <div className="w-[1px] bg-white/10 h-4 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleBulletList().run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('bulletList') ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Danh sách dấu chấm"
                      >
                        <List size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleOrderedList().run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('orderedList') ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Danh sách số"
                      >
                        <ListOrdered size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleTaskList().run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('taskList') ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Danh sách công việc"
                      >
                        <ListTodo size={14} />
                      </button>
                      <div className="w-[1px] bg-white/10 h-4 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().setTextAlign('left').run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive({ textAlign: 'left' }) ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Căn trái"
                      >
                        <AlignLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().setTextAlign('center').run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive({ textAlign: 'center' }) ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Căn giữa"
                      >
                        <AlignCenter size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().setTextAlign('right').run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive({ textAlign: 'right' }) ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Căn phải"
                      >
                        <AlignRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().setTextAlign('justify').run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive({ textAlign: 'justify' }) ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Căn đều"
                      >
                        <AlignJustify size={14} />
                      </button>
                      <div className="w-[1px] bg-white/10 h-4 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleCodeBlock().run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('codeBlock') ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Khối mã lệnh"
                      >
                        <Monitor size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().toggleBlockquote().run()}
                        className={`p-1.5 rounded transition-colors ${editorInstance.isActive('blockquote') ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                        title="Trích dẫn"
                      >
                        <Quote size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        className="p-1.5 rounded text-muted-foreground hover:text-white border border-transparent"
                        title="Chèn bảng"
                      >
                        <TableIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().setHorizontalRule().run()}
                        className="p-1.5 rounded text-muted-foreground hover:text-white border border-transparent"
                        title="Đường kẻ ngang"
                      >
                        <Minus size={14} />
                      </button>
                    </>
                  )}

                  {activeSidebarTab === 'ai-media' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const md = prompt('Dán nội dung Markdown từ AI:');
                          if (md) {
                            editorInstance.chain().focus().insertContent(md).run();
                          }
                        }}
                        className="p-1.5 rounded text-brand-orange hover:bg-brand-orange/10 border border-transparent flex items-center gap-1 text-[10px] font-mono font-bold"
                        title="Nhập từ AI"
                      >
                        <Wand2 size={14} /> Nhập AI
                      </button>
                      <div className="w-[1px] bg-white/10 h-4 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().insertContent({ type: 'workflowTimeline', attrs: { title: 'Quy trình triển khai thực hành', intro: 'Dùng block này cho các nội dung dạng quy trình...' } }).run()}
                        className="p-1.5 rounded text-muted-foreground hover:text-white border border-transparent"
                        title="Chèn quy trình / timeline"
                      >
                        <GitBranch size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().insertContent({ type: 'knowledgeCallout', attrs: { variant: 'insight', title: 'Insight trọng tâm', body: 'Viết kết luận quan trọng...' } }).run()}
                        className="p-1.5 rounded text-muted-foreground hover:text-white border border-transparent"
                        title="Chèn callout / ghi chú nổi bật"
                      >
                        <PanelTop size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().insertContent({ type: 'keyTakeaways', attrs: { title: 'TL;DR / Key Takeaways', points: ['Ý chính 1', 'Ý chính 2'] } }).run()}
                        className="p-1.5 rounded text-muted-foreground hover:text-white border border-transparent"
                        title="Chèn tóm tắt / TL;DR"
                      >
                        <Lightbulb size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().insertContent({ type: 'faqBlock', attrs: { question: 'Câu hỏi thường gặp?', answer: 'Câu trả lời chi tiết.' } }).run()}
                        className="p-1.5 rounded text-muted-foreground hover:text-white border border-transparent"
                        title="Chèn khối FAQ"
                      >
                        <HelpCircle size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().insertContent({ type: 'chartBlock', attrs: { title: 'Đồ thị dữ liệu', description: 'Mô tả dữ liệu...' } }).run()}
                        className="p-1.5 rounded text-muted-foreground hover:text-white border border-transparent"
                        title="Chèn đồ thị"
                      >
                        <BarChart3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editorInstance.chain().focus().insertContent({ type: 'drawingBoard', attrs: { title: 'Bảng vẽ minh họa', description: 'Dùng để vẽ...' } }).run()}
                        className="p-1.5 rounded text-muted-foreground hover:text-white border border-transparent"
                        title="Chèn bảng vẽ"
                      >
                        <PenTool size={14} />
                      </button>
                      <div className="w-[1px] bg-white/10 h-4 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Nhập URL hình ảnh:');
                          if (url) editorInstance.chain().focus().setImage({ src: url }).run();
                        }}
                        className="p-1.5 rounded text-muted-foreground hover:text-white border border-transparent"
                        title="Chèn ảnh bằng URL"
                      >
                        <ImageIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Nhập link video YouTube:');
                          if (url) editorInstance.chain().focus().setYoutubeVideo({ src: url }).run();
                        }}
                        className="p-1.5 rounded text-muted-foreground hover:text-white border border-transparent"
                        title="Chèn Video YouTube"
                      >
                        <YoutubeIcon size={14} />
                      </button>
                    </>
                  )}
                </div>
              </StaticCyberCard>
            )}

            <StaticCyberCard className="p-6 space-y-6">
              <h2 className="font-orbitron font-bold text-xs uppercase border-b border-brand-orange/10 pb-2 mb-4">Cấu hình Metadata</h2>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] text-muted uppercase">Danh mục</label>
                  <select name="category_id" className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-xs outline-none focus:border-brand-orange text-foreground">
                    <option value="">-- CHƯA LIÊN KẾT --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] text-muted uppercase">Tags (Cách nhau bằng dấu phẩy)</label>
                  <input 
                    name="tags" 
                    placeholder="AI, Robotics, Figma..."
                    className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-xs outline-none focus:border-brand-orange text-foreground" 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <CoverImageUpload />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] text-muted uppercase">Alt text (Mô tả ảnh bìa)</label>
                  <input 
                    name="image_alt" 
                    placeholder="Mô tả ngắn gọn nội dung bức ảnh..."
                    className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-[10px] outline-none focus:border-brand-orange text-foreground" 
                  />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input type="checkbox" name="is_published" id="is_published" defaultChecked className="accent-brand-orange w-4 h-4" />
                  <label htmlFor="is_published" className="font-mono text-[10px] text-brand-orange uppercase cursor-pointer">Công khai bài viết</label>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input type="checkbox" name="comments_enabled" id="comments_enabled" defaultChecked className="accent-brand-orange w-4 h-4" />
                  <label htmlFor="comments_enabled" className="font-mono text-[10px] text-brand-orange uppercase cursor-pointer">Cho phép bình luận</label>
                </div>
              </div>
            </StaticCyberCard>

            <StaticCyberCard className="p-6">
              <h2 className="font-orbitron font-bold text-xs uppercase border-b border-brand-orange/10 pb-2 mb-4 text-blue-400">SEO Matrix</h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[9px] text-muted uppercase">Meta Title</label>
                  <input name="meta_title" className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-[10px] text-foreground" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[9px] text-muted uppercase">Meta Description</label>
                  <textarea name="meta_description" rows={3} className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-[10px] text-foreground" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[9px] text-muted uppercase">Từ khóa (Keywords)</label>
                  <input name="keywords" className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-[10px] text-foreground" placeholder="Cách nhau bởi dấu phẩy..." />
                </div>
              </div>
            </StaticCyberCard>

            <CyberButton variant="primary" className="w-full h-14" disabled={isPending}>
              {isPending ? 'ĐANG_TRUYỀN_TẢI...' : 'XÁC NHẬN ĐĂNG BÀI'}
            </CyberButton>
          </div>
        </form>

      {isPreviewOpen && (
        <PreviewModal 
          isOpen={isPreviewOpen} 
          onClose={() => setIsPreviewOpen(false)} 
          data={getPreviewData()!} 
        />
      )}
    </div>
  );
}
