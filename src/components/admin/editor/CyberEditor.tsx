'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  useEditor, 
  EditorContent,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer
} from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu';
import { FloatingMenu as FloatingMenuExtension } from '@tiptap/extension-floating-menu';
import Youtube from '@tiptap/extension-youtube';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Highlight } from '@tiptap/extension-highlight';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Typography } from '@tiptap/extension-typography';
import { Superscript } from '@tiptap/extension-superscript';
import { Subscript } from '@tiptap/extension-subscript';
import { CharacterCount } from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { DOMParser as ProseMirrorDOMParser } from '@tiptap/pm/model';
import { all, createLowlight } from 'lowlight';
import { motion } from 'framer-motion';
import { marked } from 'marked';

const lowlight = createLowlight(all);

import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, BarChart3, Bold, CheckSquare, Code, Command, Cpu,
  Eraser, GitBranch, Heading1, Heading2, Highlighter, Image as ImageIcon, ImagePlus, Italic,
  LayoutTemplate, Link as LinkIcon, List, ListOrdered, ListTodo, Maximize2, Minimize2, Minus, Monitor,
  PaintBucket, Palette, PanelTop, PenTool, Play as YoutubeIcon, Quote, Redo, Subscript as Infra,
  Superscript as Supra, Table as TableIcon, Terminal, Type, Underline as UnderIcon, Undo, UploadCloud,
  Wand2, Zap
} from 'lucide-react';
import { CyberPrompt } from '@/components/ui/CyberPrompt';
import { ChartBlock, DrawingBoard, KnowledgeCallout, ScratchEmbed, SketchfabEmbed, WorkflowTimeline } from './CustomExtensions';
import { uploadEditorAsset } from '@/app/actions/editor-assets';
import { toast } from 'sonner';

type EditorMode = 'simple' | 'matrix' | 'agent';
type PromptType = 'image' | 'youtube' | 'scratch' | 'sketchfab' | 'link';
type WorkflowMarkdownStep = {
  label: string;
  title: string;
  body: string;
};

type WorkflowMarkdownBlock = {
  title: string;
  intro: string;
  steps: WorkflowMarkdownStep[];
  start: number;
  end: number;
};

const workflowItemPattern = /(?:^|\n)\s*(\d+)\.\s+\*\*(.+?)\*\*\s*(?:[:\-–—])?\s*(Bước\s*\d+)\.?\s*\n([\s\S]*?)(?=\n\s*\d+\.\s+\*\*|\n\s*(?:-{3,}\s*\n\s*)?##\s+|$)/g;

function normalizeMarkdownForEditor(markdown: string) {
  return markdown
    .replace(/\r\n/g, '\n')
    .replace(/([^\n])\s+(-{3,})\s+(?=#{1,6}\s+)/g, '$1\n\n$2\n\n')
    .replace(/([^\n])\s+(#{1,6}\s+\d+[\s.])/g, '$1\n\n$2')
    .replace(/([^\n])\s+(\d+\.\s+\*\*)/g, '$1\n\n$2')
    .replace(/\s+(-{3,})\s+(?=\*?XEM TRƯỚC|VỊ TRÍ|#{1,6}\s+|\d+\.\s+\*\*)/gi, '\n\n$1\n\n');
}

function normalizeWorkflowTitle(title: string) {
  return title.replace(/\s+/g, ' ').replace(/[:：]\s*$/, '').trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdownSync(markdown: string) {
  const trimmed = markdown.trim();
  if (!trimmed) return '';

  const rendered = marked.parse(trimmed, {
    gfm: true,
    breaks: true,
  });

  return typeof rendered === 'string' ? rendered : escapeHtml(trimmed);
}

function workflowToHtml(workflow: WorkflowMarkdownBlock) {
  const steps = workflow.steps.map((step) => ({
    label: step.label,
    title: step.title,
    body: step.body,
  }));
  const dataSteps = escapeHtml(JSON.stringify(steps));

  return `
    <section data-type="workflow-timeline" data-title="${escapeHtml(workflow.title)}" data-intro="${escapeHtml(workflow.intro)}" data-steps="${dataSteps}" class="kd-timeline my-10">
      <h2 class="kd-timeline-title">${escapeHtml(workflow.title)}</h2>
      <p class="kd-timeline-intro">${escapeHtml(workflow.intro)}</p>
      <div class="kd-timeline-list">
        ${steps.map((step, index) => `
          <article class="kd-timeline-step">
            <div class="kd-timeline-marker">${index + 1}</div>
            <div class="kd-timeline-content">
              <h3 class="kd-timeline-heading">${escapeHtml(step.title)}</h3>
              <p class="kd-timeline-label">${escapeHtml(step.label)}</p>
              <p class="kd-timeline-body">${escapeHtml(step.body)}</p>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function parseWorkflowMarkdown(markdown: string): WorkflowMarkdownBlock | null {
  const source = normalizeMarkdownForEditor(markdown);
  workflowItemPattern.lastIndex = 0;
  const firstItemMatch = workflowItemPattern.exec(source);
  workflowItemPattern.lastIndex = 0;
  if (!firstItemMatch) return null;

  const headingMatches = Array.from(source.matchAll(/^##\s+(.+)$/gm))
    .filter((match) => match.index !== undefined && match.index < firstItemMatch.index);
  const titleMatch = headingMatches.at(-1);
  if (!titleMatch || titleMatch.index === undefined) return null;

  const intro = source
    .slice(titleMatch.index + titleMatch[0].length, firstItemMatch.index)
    .replace(/\n{2,}/g, '\n')
    .trim();

  workflowItemPattern.lastIndex = 0;
  const matches = Array.from(source.matchAll(workflowItemPattern));
  const steps = matches.map((match) => ({
    label: match[3].replace(/\s+/g, ' ').trim(),
    title: normalizeWorkflowTitle(match[2]),
    body: match[4].replace(/\n{2,}/g, '\n').trim(),
  }));

  if (steps.length < 2) return null;
  const lastMatch = matches[matches.length - 1];
  const end = (lastMatch.index ?? source.length) + lastMatch[0].length;

  return {
    title: titleMatch[1].trim(),
    intro,
    steps,
    start: titleMatch.index,
    end,
  };
}

function convertWorkflowMarkdownSections(markdown: string) {
  const source = normalizeMarkdownForEditor(markdown);
  const workflow = parseWorkflowMarkdown(source);
  if (!workflow) return null;

  return [
    renderMarkdownSync(source.slice(0, workflow.start)),
    workflowToHtml(workflow),
    renderMarkdownSync(source.slice(workflow.end)),
  ].filter(Boolean).join('\n');
}

// --- Color Picker Component ---
const ColorPicker = ({ 
  color, 
  onColorChange, 
  title 
}: { 
  color: string, 
  onColorChange: (color: string) => void,
  title: string 
}) => {
  const [hex, setHex] = useState(color);
  const colors = [
    '#000000', '#424242', '#616161', '#9e9e9e', '#bdbdbd', '#eeeeee', '#ffffff',
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4',
    '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107',
    '#ff9800', '#ff5722', '#795548', '#ff0000', '#00ff00', '#0000ff'
  ];

  return (
    <div className="p-3 bg-cyber-black border border-brand-orange/30 shadow-2xl min-w-[200px]">
      <div className="text-[10px] font-orbitron text-brand-orange mb-2 tracking-widest uppercase">{title}</div>
      <div className="grid grid-cols-7 gap-1 mb-3">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            className={`w-6 h-6 border ${c === color ? 'border-white scale-110' : 'border-white/10'}`}
            style={{ backgroundColor: c }}
            onClick={() => onColorChange(c)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-white/10 pt-2">
        <span className="text-[10px] text-muted-foreground font-mono">HEX:</span>
        <input 
          type="text" 
          value={hex} 
          onChange={(e) => {
            setHex(e.target.value);
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) onColorChange(e.target.value);
          }}
          className="bg-transparent border-none outline-none text-xs font-mono text-white w-full"
          placeholder="#FFFFFF"
        />
        <div className="w-4 h-4 shrink-0 border border-white/20" style={{ backgroundColor: color }}></div>
      </div>
    </div>
  );
};

// --- Custom Code Block Component ---
const CodeBlockComponent = ({ node: { attrs: { language } }, updateAttributes, extension }: NodeViewProps) => {
  return (
    <NodeViewWrapper className="code-block-wrapper relative group my-8">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center bg-white/90 dark:bg-cyber-black/80 border border-black/10 dark:border-brand-orange/30 px-2 py-1 backdrop-blur-md shadow-sm">
          <Terminal size={10} className="text-slate-600 dark:text-brand-orange mr-2" />
          <select
            contentEditable={false}
            value={language || 'auto'}
            onChange={event => updateAttributes({ language: event.target.value })}
            className="bg-transparent text-slate-800 dark:text-white font-mono text-[9px] uppercase tracking-widest outline-none border-none cursor-pointer hover:text-brand-orange"
          >
            <option value="auto" className="bg-white dark:bg-cyber-black text-slate-800 dark:text-white">Auto</option>
            {extension.options.lowlight.listLanguages().map((lang: string, index: number) => (
              <option key={index} value={lang} className="bg-white dark:bg-cyber-black text-slate-800 dark:text-white">{lang}</option>
            ))}
          </select>
        </div>
      </div>
      <pre>
        <NodeViewContent as={'code' as unknown as 'div'} />
      </pre>
    </NodeViewWrapper>
  );
};

// --- Custom CodeBlock Extension ---
const CustomCodeBlockLowlight = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
});

// --- Main Editor Component ---
export function CyberEditor({ content, onChange }: { content: string, onChange: (html: string) => void }) {
  const [mode, setMode] = useState<EditorMode>('agent');
  const [isFullView, setIsFullView] = useState(false);
  const [assetProvider, setAssetProvider] = useState<'supabase' | 'github'>('supabase');
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [promptConfig, setPromptConfig] = useState<{
    isOpen: boolean; title: string; placeholder: string; defaultValue: string; 
    type: PromptType | null; secondaryPlaceholder?: string;
  }>({ isOpen: false, title: '', placeholder: '', defaultValue: '', type: null });

  const extensions = useMemo(() => [
    StarterKit.configure({ 
      heading: { levels: [1, 2, 3] },
      codeBlock: false, // Tắt mặc định để dùng Lowlight
    }),
    CustomCodeBlockLowlight.configure({
      lowlight,
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Highlight.configure({ multicolor: true }),
    Table.configure({ resizable: true }),
    TableRow, TableHeader, TableCell,
    Youtube.configure({ width: 840, height: 480 }),
    Image,
    Placeholder.configure({
      placeholder: mode === 'matrix' ? 'Nhấn / để triệu hồi lệnh ma trận...' : 'ĐANG TRUYỀN TẢI: Bắt đầu nhập nội dung...',
    }),
    ScratchEmbed, SketchfabEmbed,
    WorkflowTimeline, KnowledgeCallout, ChartBlock, DrawingBoard,
    TaskList, TaskItem.configure({ nested: true }),
    Typography, Superscript, Subscript,
    Color, TextStyle, Link, Underline,
    CharacterCount.configure({ limit: 50000 }),
    BubbleMenuExtension,
    FloatingMenuExtension,
  ], [mode]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: extensions,
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: ['p-8', 'focus:outline-none', 'min-h-[400px]', 'flex-grow', 'prose', 'dark:prose-invert', 'prose-brand', 'max-w-none', 'prose-headings:font-orbitron', 'prose-headings:uppercase', 'prose-p:font-sans', 'prose-p:text-lg', mode === 'matrix' ? 'prose-h1:text-center prose-h1:mb-16' : ''].filter(Boolean).join(' ')
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain');
        if (!text) return false;

        const convertedHtml = convertWorkflowMarkdownSections(text);
        if (!convertedHtml) return false;

        event.preventDefault();
        const container = document.createElement('div');
        container.innerHTML = convertedHtml;
        const slice = ProseMirrorDOMParser.fromSchema(view.state.schema).parseSlice(container);
        view.dispatch(view.state.tr.replaceSelection(slice));
        toast.success('Đã tự nhận diện workflow trong Markdown và giữ nguyên các phần nội dung còn lại.');
        return true;
      }
    }
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  // Cleanup on unmount to prevent 'domFromPos' errors
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const [showTextColor, setShowTextColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);

  if (!editor) return null;

  const handlePromptConfirm = (value: string, secondaryValue?: string) => {
    if (!value) { setPromptConfig(p => ({ ...p, isOpen: false })); return; }
    switch (promptConfig.type) {
      case 'image': editor.chain().focus().setImage({ src: value, alt: secondaryValue || '' }).run(); break;
      case 'youtube': editor.chain().focus().setYoutubeVideo({ src: value }).run(); break;
      case 'scratch': editor.chain().focus().insertContent({ type: 'scratchEmbed', attrs: { projectId: value } }).run(); break;
      case 'sketchfab': editor.chain().focus().insertContent({ type: 'sketchfabEmbed', attrs: { modelId: value } }).run(); break;
      case 'link': editor.chain().focus().extendMarkRange('link').setLink({ href: value }).run(); break;
    }
    setPromptConfig(p => ({ ...p, isOpen: false }));
  };

  const openPrompt = (type: PromptType, title: string, placeholder: string, defaultValue = '', secondaryPlaceholder?: string) => {
    setPromptConfig({ isOpen: true, type, title, placeholder, defaultValue, secondaryPlaceholder });
  };

  const handleMagicMarkdown = async () => {
    if (!editor) return;
    const rawContent = editor.getText(); // Lấy văn bản thô
    const workflowHtml = convertWorkflowMarkdownSections(rawContent);

    if (workflowHtml) {
      editor.commands.setContent(workflowHtml);
      toast.success('Đã nhận diện workflow trong Markdown và chuyển đúng block quy trình.');
      return;
    }
    
    // Sử dụng thư viện marked với cấu hình tối ưu
    const html = await marked.parse(rawContent, {
      gfm: true,
      breaks: true
    });

    editor.commands.setContent(html);
  };

  const insertWorkflowTimeline = () => {
    editor.chain().focus().insertContent({
      type: 'workflowTimeline',
      attrs: {
        title: 'Quy trình triển khai thực hành',
        intro: 'Dùng block này cho các nội dung dạng quy trình, timeline, roadmap hoặc vận hành hệ thống nhiều bước.',
      },
    }).run();
  };

  const insertKnowledgeCallout = () => {
    editor.chain().focus().insertContent({
      type: 'knowledgeCallout',
      attrs: {
        variant: 'insight',
        title: 'Insight trọng tâm',
        body: 'Viết kết luận, cảnh báo, nguyên tắc hoặc ghi chú quan trọng cần người đọc chú ý.',
      },
    }).run();
  };

  const insertChartBlock = () => {
    editor.chain().focus().insertContent({
      type: 'chartBlock',
      attrs: {
        title: 'Đồ thị dữ liệu',
        description: 'Mô tả dữ liệu, đơn vị đo và insight chính của biểu đồ tại đây.',
      },
    }).run();
  };

  const insertDrawingBoard = () => {
    editor.chain().focus().insertContent({
      type: 'drawingBoard',
      attrs: {
        title: 'Bảng vẽ minh họa',
        description: 'Dùng để giữ chỗ cho sơ đồ, field map, kiến trúc hệ thống hoặc bản phác thảo kỹ thuật.',
      },
    }).run();
  };

  const handleAssetUpload = async (file?: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('provider', assetProvider);

    setIsUploadingAsset(true);
    try {
      const result = await uploadEditorAsset(formData);

      if (!result.success || !('url' in result) || !result.url) {
        toast.error('error' in result ? result.error : 'Không thể tải ảnh lên.');
        return;
      }

      editor.chain().focus().setImage({ src: result.url as string, alt: file.name }).run();
      toast.success(`Đã tải ảnh lên ${result.provider === 'github' ? 'GitHub' : 'Supabase'} và chèn vào bài viết.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
    } finally {
      setIsUploadingAsset(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`cyber-editor-wrapper transition-all duration-500 ${isFullView ? 'fixed inset-0 z-[200] bg-cyber-black p-2 overflow-hidden flex flex-col' : 'relative flex flex-col'}`}>
      {/* Mode Switcher & Expand Toggle - Sticky only in FullView */}
      <div className={`flex justify-center items-center ${isFullView ? 'sticky top-0 z-[110] bg-cyber-black/90 backdrop-blur-md py-4 mb-2 shrink-0' : 'relative py-4 mb-4 border-b border-white/5'}`}>
        <div className="inline-flex bg-cyber-black/90 border border-brand-orange/20 p-1 backdrop-blur-xl shadow-[0_0_30px_rgba(255,87,34,0.1)]">
          {[
            { id: 'agent', label: 'AI AGENT', icon: Cpu },
            { id: 'matrix', label: 'MA TRẬN', icon: Command },
            { id: 'simple', label: 'ĐƠN GIẢN', icon: Type },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id as EditorMode)}
              className={`flex items-center gap-2 px-6 py-2.5 font-orbitron text-[10px] font-bold tracking-[0.2em] transition-all relative ${
                mode === m.id ? 'text-cyber-black' : 'text-muted-foreground hover:text-brand-orange'
              }`}
            >
              {mode === m.id && (
                <motion.div layoutId="activeMode" className="absolute inset-0 bg-brand-orange shadow-[0_0_15px_rgba(249,115,22,0.5)]" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <m.icon size={14} className={mode === m.id ? 'animate-pulse' : ''} />
                {m.label}
              </span>
            </button>
          ))}
        </div>

        <button 
          type="button"
          onClick={() => setIsFullView(!isFullView)}
          className="ml-4 p-3 bg-cyber-black border border-brand-orange/20 text-brand-orange hover:bg-brand-orange/10 transition-all shadow-[0_0_15px_rgba(255,87,34,0.05)]"
          title={isFullView ? "Thu nhỏ" : "Mở rộng tối đa"}
        >
          {isFullView ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      <div className={`cyber-editor-container border border-brand-orange/20 bg-cyber-black/40 relative transition-all shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col ${isFullView ? 'flex-grow overflow-hidden' : 'min-h-[600px]'}`}>
        {/* Toolbar - Standard positioning (non-sticky as requested) */}
        <div className="border-b border-white/10 bg-cyber-black/40 p-2 flex flex-wrap items-center justify-between gap-y-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1">
            {/* Group 1: History & Magic */}
              <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-2 text-muted-foreground hover:text-white disabled:opacity-20" title="Hoàn tác"><Undo size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-2 text-muted-foreground hover:text-white disabled:opacity-20" title="Làm lại"><Redo size={16} /></button>
              <button type="button" onClick={handleMagicMarkdown} className="p-2 text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all animate-pulse" title="Phép thuật Markdown: Chuyển MD sang HTML"><Wand2 size={16} /></button>
            </div>

            <div className="w-[1px] bg-white/10 mx-1 self-stretch"></div>

            {/* Group 2: Structure */}
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-2 ${editor.isActive('heading', { level: 1 }) ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Tiêu đề 1"><Heading1 size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 ${editor.isActive('heading', { level: 2 }) ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Tiêu đề 2"><Heading2 size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 ${editor.isActive('bulletList') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Danh sách dấu chấm"><List size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 ${editor.isActive('orderedList') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Danh sách số"><ListOrdered size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-2 ${editor.isActive('taskList') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Danh sách công việc"><ListTodo size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-2 ${editor.isActive('codeBlock') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Khối mã lệnh"><Monitor size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 ${editor.isActive('blockquote') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Trích dẫn"><Quote size={18} /></button>
            </div>

            <div className="w-[1px] bg-white/10 mx-1 self-stretch"></div>

            {/* Group 3: Formatting */}
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 ${editor.isActive('bold') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="In đậm"><Bold size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 ${editor.isActive('italic') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="In nghiêng"><Italic size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 ${editor.isActive('strike') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Gạch ngang"><Minus size={18} className="rotate-45" /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={`p-2 ${editor.isActive('code') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Mã dòng"><Code size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 ${editor.isActive('underline') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Gạch chân"><UnderIcon size={18} /></button>
              
              {/* Text Color Picker */}
              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => { setShowTextColor(!showTextColor); setShowBgColor(false); }} 
                  className={`p-2 ${editor.isActive('textStyle', { color: editor.getAttributes('textStyle').color }) ? 'text-brand-orange' : 'text-muted-foreground'}`} 
                  title="Màu chữ"
                >
                  <Palette size={18} style={{ color: editor.getAttributes('textStyle').color || 'currentColor' }} />
                </button>
                {showTextColor && (
                  <div className="absolute top-full left-0 z-50 mt-2">
                    <ColorPicker 
                      title="CHỌN MÀU CHỮ"
                      color={editor.getAttributes('textStyle').color || '#ffffff'} 
                      onColorChange={(c) => { editor.chain().focus().setColor(c).run(); setShowTextColor(false); }} 
                    />
                  </div>
                )}
              </div>

              {/* Highlight Picker */}
              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => { setShowBgColor(!showBgColor); setShowTextColor(false); }} 
                  className={`p-2 ${editor.isActive('highlight') ? 'text-brand-orange' : 'text-muted-foreground'}`} 
                  title="Màu nền chữ"
                >
                  <PaintBucket size={18} />
                </button>
                {showBgColor && (
                  <div className="absolute top-full left-0 z-50 mt-2">
                    <ColorPicker 
                      title="CHỌN MÀU NỀN"
                      color={editor.getAttributes('highlight').color || '#ff5722'} 
                      onColorChange={(c) => { editor.chain().focus().setHighlight({ color: c }).run(); setShowBgColor(false); }} 
                    />
                  </div>
                )}
              </div>

              <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`p-2 ${editor.isActive('highlight') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Tô màu nhanh"><Highlighter size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().run()} className="p-2 text-muted-foreground hover:text-brand-orange" title="Xóa định dạng"><Eraser size={18} /></button>
              <button type="button" onClick={() => openPrompt('link', 'LIÊN KẾT', 'URL...')} className={`p-2 ${editor.isActive('link') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Chèn liên kết"><LinkIcon size={18} /></button>
            </div>

            <div className="w-[1px] bg-white/10 mx-1 self-stretch"></div>

            {/* Group 4: Scripts */}
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => editor.chain().focus().toggleSuperscript().run()} className={`p-2 ${editor.isActive('superscript') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Chỉ số trên"><Supra size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleSubscript().run()} className={`p-2 ${editor.isActive('subscript') ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Chỉ số dưới"><Infra size={18} /></button>
            </div>

            <div className="w-[1px] bg-white/10 mx-1 self-stretch"></div>

            {/* Group 5: Alignment */}
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 ${editor.isActive({ textAlign: 'left' }) ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Căn trái"><AlignLeft size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 ${editor.isActive({ textAlign: 'center' }) ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Căn giữa"><AlignCenter size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-2 ${editor.isActive({ textAlign: 'right' }) ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Căn phải"><AlignRight size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`p-2 ${editor.isActive({ textAlign: 'justify' }) ? 'text-brand-orange' : 'text-muted-foreground'}`} title="Căn đều"><AlignJustify size={18} /></button>
            </div>

            <div className="w-[1px] bg-white/10 mx-1 self-stretch"></div>

            {/* Group 6: Content Blocks */}
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={insertWorkflowTimeline} className="p-2 text-muted-foreground hover:text-brand-orange" title="Chèn quy trình / timeline"><GitBranch size={18} /></button>
              <button type="button" onClick={insertKnowledgeCallout} className="p-2 text-muted-foreground hover:text-brand-orange" title="Chèn callout / ghi chú nổi bật"><PanelTop size={18} /></button>
              <button type="button" onClick={insertChartBlock} className="p-2 text-muted-foreground hover:text-brand-orange" title="Chèn đồ thị"><BarChart3 size={18} /></button>
              <button type="button" onClick={insertDrawingBoard} className="p-2 text-muted-foreground hover:text-brand-orange" title="Chèn bảng vẽ"><PenTool size={18} /></button>
            </div>

            <div className="w-[1px] bg-white/10 mx-1 self-stretch"></div>

            {/* Group 7: Media & Tables */}
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => openPrompt('image', 'HÌNH ẢNH', 'URL...', '', 'Alt text (tuỳ chọn)...')} className="p-2 text-muted-foreground hover:text-brand-orange" title="Chèn ảnh"><ImageIcon size={18} /></button>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAsset} className="p-2 text-muted-foreground hover:text-brand-orange disabled:opacity-40" title="Tải ảnh từ máy lên storage"><UploadCloud size={18} /></button>
              <button type="button" onClick={() => openPrompt('youtube', 'YOUTUBE', 'Link video...')} className="p-2 text-muted-foreground hover:text-brand-orange" title="Chèn Video YouTube"><YoutubeIcon size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="p-2 text-muted-foreground hover:text-brand-orange" title="Chèn bảng"><TableIcon size={18} /></button>
              <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-2 text-muted-foreground hover:text-brand-orange" title="Đường kẻ ngang"><Minus size={18} /></button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2">
            <ImagePlus size={14} className="text-brand-orange" />
            <select
              value={assetProvider}
              onChange={(event) => setAssetProvider(event.target.value as 'supabase' | 'github')}
              className="bg-cyber-black border border-brand-orange/20 px-2 py-1 font-mono text-[9px] uppercase text-muted-foreground outline-none hover:text-brand-orange"
              title="Nơi lưu ảnh upload"
            >
              <option value="supabase">Supabase</option>
              <option value="github">GitHub</option>
            </select>
            <span className="font-mono text-[9px] uppercase text-muted-foreground">
              {isUploadingAsset ? 'Đang tải ảnh...' : 'Upload ảnh'}
            </span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(event) => handleAssetUpload(event.target.files?.[0])}
        />

        {/* Bubble Menu - Contextual formatting */}
        {editor.view && (
          <BubbleMenu editor={editor}>
            <div className="flex bg-[#0a0a0a] border border-[#ff5722]/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-1 backdrop-blur-md rounded-none mb-2">
              <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 transition-colors ${editor.isActive('bold') ? 'text-[#ff5722]' : 'text-white hover:text-[#ff5722]'}`} title="In đậm"><Bold size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 transition-colors ${editor.isActive('italic') ? 'text-[#ff5722]' : 'text-white hover:text-[#ff5722]'}`} title="In nghiêng"><Italic size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 transition-colors ${editor.isActive('underline') ? 'text-[#ff5722]' : 'text-white hover:text-[#ff5722]'}`} title="Gạch chân"><UnderIcon size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 transition-colors ${editor.isActive('strike') ? 'text-[#ff5722]' : 'text-white hover:text-[#ff5722]'}`} title="Gạch ngang"><Minus size={16} className="rotate-45" /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={`p-2 transition-colors ${editor.isActive('code') ? 'text-[#ff5722]' : 'text-white hover:text-[#ff5722]'}`} title="Mã dòng"><Code size={16} /></button>
              <div className="w-[1px] bg-white/10 mx-1 self-stretch"></div>
              <button type="button" onClick={() => openPrompt('link', 'LIÊN KẾT', 'URL...')} className={`p-2 transition-colors ${editor.isActive('link') ? 'text-[#ff5722]' : 'text-white hover:text-[#ff5722]'}`} title="Liên kết"><LinkIcon size={16} /></button>
            </div>
          </BubbleMenu>
        )}

        {/* Floating Menu for Matrix - Safety check for view */}
        {mode === 'matrix' && editor.view && (
          <FloatingMenu editor={editor}>
            <div className="flex flex-col bg-cyber-black border border-brand-orange/30 shadow-2xl p-1 min-w-[180px]">
              <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange transition-all"><Heading1 size={14} /> Tiêu đề 1</button>
              <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange transition-all"><Heading2 size={14} /> Tiêu đề 2</button>
              <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange transition-all"><List size={14} /> Danh sách</button>
              <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()} className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange transition-all"><CheckSquare size={14} /> Công việc</button>
              <button type="button" onClick={insertWorkflowTimeline} className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange transition-all"><LayoutTemplate size={14} /> Quy trình</button>
            </div>
          </FloatingMenu>
        )}

        <EditorContent 
          editor={editor} 
          className={`king-dragon-content flex-grow overflow-y-auto custom-scrollbar ${isFullView ? 'h-full' : ''}`}
        />

        {/* Status Bar */}
        <div className="border-t border-brand-orange/10 px-6 py-2.5 bg-cyber-black/80 flex justify-between items-center font-mono text-[9px] text-muted-foreground uppercase tracking-[0.2em] backdrop-blur-md shrink-0">
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2"><Zap size={10} className="text-brand-orange" /> GIAO THỨC: {mode}</span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="text-brand-orange">{editor.storage.characterCount.characters()} KÝ TỰ</span>
            <span className="text-brand-orange/20">|</span>
            <span className="text-brand-orange">{editor.storage.characterCount.words()} TỪ</span>
          </div>
        </div>
      </div>

      <CyberPrompt {...promptConfig} onConfirm={handlePromptConfirm} onCancel={() => setPromptConfig(p => ({ ...p, isOpen: false }))} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 87, 34, 0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 87, 34, 0.6); }

        .ProseMirror { 
          flex-grow: 1; 
          outline: none; 
          min-height: ${isFullView ? '100%' : '500px'};
          padding-bottom: 50px;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(255, 87, 34, 0.2);
          pointer-events: none;
          height: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          text-transform: uppercase;
        }
        ul[data-type="taskList"] { list-style: none; padding: 0; }
        ul[data-type="taskList"] li { display: flex; align-items: flex-start; margin-bottom: 0.5rem; }
        ul[data-type="taskList"] li > label { margin-right: 0.75rem; user-select: none; }
        input[type="checkbox"] { appearance: none; width: 1.2rem; height: 1.2rem; border: 1px solid rgba(255, 87, 34, 0.4); background: transparent; cursor: pointer; position: relative; }
        input[type="checkbox"]:checked:after { content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #ff5722; font-size: 0.8rem; }
        .ProseMirror table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 2rem 0; overflow: hidden; border: 1px solid rgba(255, 87, 34, 0.1); }
        .ProseMirror td, .ProseMirror th { min-width: 1em; border: 1px solid rgba(255, 87, 34, 0.2); padding: 12px 15px; vertical-align: top; box-sizing: border-box; position: relative; }
        .ProseMirror th { background: rgba(255, 87, 34, 0.05); font-weight: bold; text-align: left; }

        /* Code Block Styling - Responsive Theme */
        .ProseMirror pre {
          background: #f8f9fa !important; /* Light Mode Background */
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          border-radius: 8px !important;
          padding: 2rem 1.5rem !important;
          margin: 2rem 0 !important;
          position: relative;
          transition: all 0.3s ease;
        }

        .dark .ProseMirror pre {
          background: #0d1117 !important; /* Dark Mode Background */
          border: 1px solid rgba(255, 87, 34, 0.3) !important;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        }

        .ProseMirror pre::before {
          content: 'CODE_BLOCK';
          position: absolute;
          top: 0;
          left: 1rem;
          transform: translateY(-50%);
          background: #333;
          color: #fff;
          font-family: 'Orbitron', sans-serif;
          font-size: 8px;
          font-weight: bold;
          padding: 2px 8px;
          letter-spacing: 2px;
        }

        .dark .ProseMirror pre::before {
          background: #ff5722;
          color: #000;
        }

        .ProseMirror pre code {
          background: none !important;
          padding: 0 !important;
          color: #24292e !important; /* Light Mode Text */
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 0.95rem !important;
          line-height: 1.6 !important;
          white-space: pre !important;
        }

        .dark .ProseMirror pre code {
          color: #e6edf3 !important; /* Dark Mode Text */
        }
        
        /* Syntax Highlighting - Adaptive Colors */
        .ProseMirror .hljs-comment { color: #6a737d !important; }
        .dark .ProseMirror .hljs-comment { color: #8b949e !important; }

        .ProseMirror .hljs-keyword { color: #d73a49 !important; font-weight: bold !important; }
        .dark .ProseMirror .hljs-keyword { color: #ff7b72 !important; }

        .ProseMirror .hljs-string { color: #032f62 !important; }
        .dark .ProseMirror .hljs-string { color: #a5d6ff !important; }

        .ProseMirror .hljs-number, .ProseMirror .hljs-literal { color: #005cc5 !important; }
        .dark .ProseMirror .hljs-number, .dark .ProseMirror .hljs-literal { color: #d2a8ff !important; }

        .ProseMirror .hljs-title, .ProseMirror .hljs-function { color: #6f42c1 !important; }
        .dark .ProseMirror .hljs-title, .dark .ProseMirror .hljs-function { color: #d2a8ff !important; }

        .ProseMirror .hljs-attr, .ProseMirror .hljs-variable { color: #e36209 !important; }
        .dark .ProseMirror .hljs-attr, .dark .ProseMirror .hljs-variable { color: #79c0ff !important; }

        /* Typography & Blocks - Adaptive Colors */
        .ProseMirror h1 { display: block !important; font-size: 2.2rem !important; font-weight: 800 !important; margin-top: 2rem !important; margin-bottom: 1.5rem !important; border-left: 5px solid #ff5722 !important; padding-left: 1rem !important; line-height: 1.2 !important; }
        .ProseMirror h2 { display: block !important; font-size: 1.7rem !important; font-weight: 700 !important; margin-top: 1.8rem !important; margin-bottom: 1.2rem !important; border-bottom: 1px solid rgba(255, 87, 34, 0.3) !important; padding-bottom: 0.3rem !important; }
        .ProseMirror h3 { display: block !important; font-size: 1.3rem !important; font-weight: 600 !important; margin-top: 1.5rem !important; margin-bottom: 0.8rem !important; }
        
        .ProseMirror p { line-height: 1.7 !important; margin-bottom: 1.2rem !important; display: block !important; }
        
        /* List Fixes - Bắt buộc hiển thị dấu chấm và số */
        .ProseMirror ul { list-style-type: disc !important; padding-left: 2rem !important; margin-bottom: 1.5rem !important; display: block !important; }
        .ProseMirror ol { list-style-type: decimal !important; padding-left: 2rem !important; margin-bottom: 1.5rem !important; display: block !important; }
        .ProseMirror li { display: list-item !important; margin-bottom: 0.5rem !important; }
        .ProseMirror li > p { display: inline-block !important; margin: 0 !important; }

        .ProseMirror blockquote { border-left: 3px solid #ff5722 !important; background: rgba(255, 87, 34, 0.05) !important; padding: 1rem 1.5rem !important; margin: 1.5rem 0 !important; font-style: italic !important; position: relative !important; }
        .ProseMirror strong { color: #ff5722 !important; font-weight: 700 !important; }
      `}</style>
    </div>
  );
}
