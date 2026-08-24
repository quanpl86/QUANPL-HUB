'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ChevronRight,
  Download,
  Eye,
  FilePlus2,
  FileUp,
  Loader2,
  Maximize,
  PenTool,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';
import { PdfLayoutEditor } from '@/components/utility/pdf-editor/PdfLayoutEditor';
import { createBlankPdfPage, importPdfFile } from '@/lib/pdf/import-pdf';
import { exportPdfPages } from '@/lib/pdf/export-pdf';
import type { PdfPageModel } from '@/lib/pdf/types';

export default function PdfEditorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pages, setPages] = useState<PdfPageModel[]>([]);
  const [documentTitle, setDocumentTitle] = useState('Tai_lieu_PDF');
  const [sourceName, setSourceName] = useState('');
  const [hasDocument, setHasDocument] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editorEpoch, setEditorEpoch] = useState(0);

  useEffect(() => {
    if (isZenMode) document.body.classList.add('zen-mode-active');
    else document.body.classList.remove('zen-mode-active');
    if (hasDocument) document.body.classList.add('pdf-workspace-active');
    else document.body.classList.remove('pdf-workspace-active');
    return () => {
      document.body.classList.remove('zen-mode-active');
      document.body.classList.remove('pdf-workspace-active');
    };
  }, [isZenMode, hasDocument]);

  const wordCount = useMemo(() => {
    const text = pages.flatMap((page) => page.texts.map((box) => box.text)).join(' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }, [pages]);

  const openPages = (nextPages: PdfPageModel[], title: string, source = '') => {
    setPages(nextPages);
    setDocumentTitle(title);
    setSourceName(source);
    setHasDocument(true);
    setEditorEpoch((value) => value + 1);
  };

  const handlePdfFile = async (file?: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Chỉ hỗ trợ file PDF.');
      return;
    }

    setIsImporting(true);
    setImportProgress('Đang render trang PDF...');
    try {
      const imported = await importPdfFile(file, (done, total) => {
        setImportProgress(`Đang giữ nguyên trang ${done}/${total}...`);
      });
      openPages(imported.pages, imported.title || file.name.replace(/\.pdf$/i, ''), file.name);
      toast.success(`Đã mở ${imported.pageCount} trang đúng layout gốc. Click chữ/ảnh để chỉnh.`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Không đọc được file PDF.');
    } finally {
      setIsImporting(false);
      setImportProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    if (pages.length === 0) {
      toast.error('Tài liệu đang trống.');
      return;
    }
    setIsExporting(true);
    try {
      const safeName = `${documentTitle.replace(/[^\w\-]+/g, '_') || 'KingDragon_PDF'}.pdf`;
      await exportPdfPages(pages, safeName);
      toast.success('Đã xuất file PDF.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Không xuất được PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const startBlank = () => {
    openPages([createBlankPdfPage('Tài liệu mới')], 'Tai_lieu_moi');
    toast.success('Đã tạo trang PDF trắng. Thêm chữ và ảnh ngay trên trang.');
  };

  return (
    <div className={`min-h-screen bg-background text-foreground ${hasDocument ? '' : ''}`}>
      {!hasDocument && (
      <>
      <div className="bg-white border-b border-slate-200 pb-8">
        <div className={isZenMode ? '' : 'max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8'}>
          {!isZenMode && (
            <div className="flex items-center space-x-2 text-sm text-foreground/50 mb-6">
              <Link href="/utility-hub" className="hover:text-brand-orange transition-colors">Utility Hub</Link>
              <ChevronRight size={16} />
              <Link href="/utility-hub/pdf-studio" className="hover:text-brand-orange transition-colors">PDF Studio</Link>
              <ChevronRight size={16} />
              <span className="text-foreground font-medium">PDF Editor</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-rose-100 dark:bg-brand-orange/10 rounded-xl flex items-center justify-center text-rose-600 dark:text-brand-orange shadow-sm">
                  <PenTool size={24} />
                </div>
                <h1 className="text-3xl font-bold font-[family-name:var(--font-inter)]">PDF Editor</h1>
              </div>
              <p className="text-foreground/70 max-w-2xl leading-relaxed">
                Mở PDF đúng như khi xem file: giữ layout, ảnh, màu và vị trí chữ. Thanh công cụ định dạng/ảnh dùng để sửa tại chỗ trên từng trang.
              </p>
            </div>

            {hasDocument && (
              <div className="flex flex-wrap gap-3">
                <CyberButton
                  type="button"
                  variant="outline"
                  className="!min-h-0 !px-4 !py-2 text-xs"
                  onClick={() => setIsZenMode(!isZenMode)}
                >
                  <Maximize size={16} />
                  {isZenMode ? 'Thoát tập trung' : 'Chế độ tập trung'}
                </CyberButton>
                <CyberButton
                  type="button"
                  variant="outline"
                  className="!min-h-0 !px-4 !py-2 text-xs"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  <Eye size={16} />
                  Xem trước
                </CyberButton>
                <CyberButton
                  type="button"
                  variant="primary"
                  className="!min-h-0 !px-4 !py-2 text-xs"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {isExporting ? 'Đang xuất...' : 'Xuất PDF'}
                </CyberButton>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={isZenMode ? 'pt-4' : 'max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {!hasDocument ? (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                handlePdfFile(event.dataTransfer.files?.[0]);
              }}
              className={`flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
                isDragging
                  ? 'border-brand-orange bg-brand-orange/10'
                  : 'border-foreground/15 bg-foreground/[0.02] hover:border-brand-orange/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => handlePdfFile(event.target.files?.[0])}
              />
              {isImporting ? (
                <>
                  <Loader2 size={36} className="animate-spin text-brand-orange mb-4" />
                  <p className="font-semibold">{importProgress || 'Đang nhập PDF...'}</p>
                  <p className="text-sm text-foreground/60 mt-2">Đang render từng trang để giữ nguyên ảnh, layout và chữ.</p>
                </>
              ) : (
                <>
                  <FileUp size={36} className="text-brand-orange mb-4" />
                  <h2 className="text-xl font-bold mb-2">Kéo thả file PDF vào đây</h2>
                  <p className="text-sm text-foreground/60 max-w-md">
                    Mỗi trang được mở như bản xem PDF gốc. Click vào chữ hoặc ảnh để thêm, xóa, sửa, cắt và định dạng.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-orange text-white px-5 py-2.5 text-xs font-bold">
                    Chọn file PDF
                  </span>
                </>
              )}
            </label>

            <div className="rounded-3xl border border-foreground/10 bg-foreground/[0.02] p-8 flex flex-col">
              <div className="inline-flex p-3 rounded-xl bg-background border border-foreground/10 text-brand-orange mb-4 w-fit">
                <FilePlus2 size={22} />
              </div>
              <h2 className="text-xl font-bold mb-2">Tạo PDF mới</h2>
              <p className="text-sm text-foreground/60 mb-6 leading-relaxed">
                Trang A4 trắng với cùng tab công cụ: định dạng văn bản, căn lề, chèn ảnh, crop và phóng to toàn màn hình.
              </p>
              <CyberButton type="button" variant="outline" className="mt-auto" onClick={startBlank}>
                <Sparkles size={16} />
                Bắt đầu soạn thảo
              </CyberButton>
            </div>
          </div>
        ) : null}
      </div>
      </>
      )}

      {hasDocument && (
        <div className="flex flex-col h-[calc(100dvh-72px)] bg-slate-50">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/utility-hub/pdf-studio" className="text-sm text-slate-500 hover:text-rose-600 shrink-0">PDF Studio</Link>
              <span className="text-slate-300">/</span>
              <input
                value={documentTitle}
                title={sourceName || documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none"
              />
              <span className="hidden sm:inline text-xs text-slate-400 shrink-0">
                {pages.length} trang · {wordCount} từ
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-rose-300">
                <FileUp size={14} /> Nhập khác
              </button>
              <button type="button" onClick={() => setIsPreviewOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-rose-300">
                <Eye size={14} /> Xem trước
              </button>
              <button type="button" onClick={handleExport} disabled={isExporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 disabled:opacity-60">
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Xuất PDF
              </button>
              <button type="button" onClick={() => { setHasDocument(false); setPages([]); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-rose-300">
                <RotateCcw size={14} /> Đóng
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => handlePdfFile(event.target.files?.[0])}
          />
          <div className="flex-1 min-h-0">
            <PdfLayoutEditor key={editorEpoch} pages={pages} onChange={setPages} />
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-brand-orange">Xem trước PDF</p>
                <h2 className="text-white text-2xl font-bold">{documentTitle}</h2>
              </div>
              <button type="button" onClick={() => setIsPreviewOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white/10 text-white">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-8">
              {pages.map((page) => (
                <div key={page.pageNumber} className="bg-white shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={page.background} alt={`Trang ${page.pageNumber}`} className="max-w-full h-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
