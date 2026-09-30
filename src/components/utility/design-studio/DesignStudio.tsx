'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { toast } from 'sonner';
import { ToolTab, ImageAdjustments, DesignTemplate, HubDesignFile } from '@/types/design-studio';
import { DesignStudioTopBar } from './DesignStudioTopBar';
import { DesignStudioSidebar } from './DesignStudioSidebar';
import { DesignStudioCanvas } from './DesignStudioCanvas';
import { DesignStudioInspector } from './DesignStudioInspector';
import {
  configureFabricDefaults,
  addText,
  addRect,
  addCircle,
  addTriangle,
  addLine,
  addImageFromUrl,
  applyImageAdjustments,
  rotateObject,
  flipObject,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  duplicateObject,
  deleteObject,
  exportCanvasAsImage,
  exportCanvasAsSVG,
  exportCanvasAsPDF,
  exportProjectJson,
  loadProjectJson,
} from './services/fabric-service';
import { removeImageBackground } from './services/ai-remover';

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

const DEFAULT_IMAGE_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  hue: 0,
  presetFilter: 'none',
};

export const DesignStudio: React.FC = () => {
  // References
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  // States
  const [projectName, setProjectName] = useState('Thiết kế STEM chưa đặt tên');
  const [activePresetName, setActivePresetName] = useState('YouTube Thumbnail');
  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(DEFAULT_HEIGHT);
  const [canvasBgColor, setCanvasBgColor] = useState('#090d16');
  const [zoom, setZoom] = useState(0.85);

  // Tab & Selection States
  const [activeTab, setActiveTab] = useState<ToolTab>('templates');
  const [selectedObject, setSelectedObject] = useState<Record<string, unknown> | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Photo Editor Adjustments
  const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments>(DEFAULT_IMAGE_ADJUSTMENTS);

  // History (Undo / Redo)
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isHistoryActionRef = useRef(false);

  // AI & Exporting States
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiProgressMessage, setAiProgressMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Save current canvas state to history stack
  const saveHistory = useCallback(() => {
    if (!fabricCanvasRef.current || isHistoryActionRef.current) return;
    try {
      const jsonStr = JSON.stringify(fabricCanvasRef.current.toObject());
      // Truncate future states if we performed an action after undoing
      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      newHistory.push(jsonStr);

      // Limit history to 30 steps
      if (newHistory.length > 30) {
        newHistory.shift();
      }

      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;

      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);
    } catch (e) {
      console.error('History save error:', e);
    }
  }, []);

  // Sync active selection state
  const syncSelectionState = useCallback((target: fabric.FabricObject | null) => {
    if (!target) {
      setSelectedObject(null);
      setSelectedType(null);
      return;
    }

    setSelectedObject(target as unknown as Record<string, unknown>);
    const type = target.type?.toLowerCase() || '';

    if (type === 'fabricimage' || type === 'image') {
      setSelectedType('image');
    } else if (type === 'textbox' || type === 'text' || type === 'i-text') {
      setSelectedType('textbox');
    } else {
      setSelectedType(type || 'shape');
    }
  }, []);

  // Undo Function
  const handleUndo = async () => {
    if (!fabricCanvasRef.current || historyIndexRef.current <= 0) return;
    isHistoryActionRef.current = true;
    try {
      historyIndexRef.current -= 1;
      const previousState = historyRef.current[historyIndexRef.current];
      await fabricCanvasRef.current.loadFromJSON(JSON.parse(previousState));
      fabricCanvasRef.current.requestRenderAll();
      syncSelectionState(null);
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    } catch (e) {
      console.error('Undo failed:', e);
    } finally {
      isHistoryActionRef.current = false;
    }
  };

  // Redo Function
  const handleRedo = async () => {
    if (!fabricCanvasRef.current || historyIndexRef.current >= historyRef.current.length - 1) return;
    isHistoryActionRef.current = true;
    try {
      historyIndexRef.current += 1;
      const nextState = historyRef.current[historyIndexRef.current];
      await fabricCanvasRef.current.loadFromJSON(JSON.parse(nextState));
      fabricCanvasRef.current.requestRenderAll();
      syncSelectionState(null);
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    } catch (e) {
      console.error('Redo failed:', e);
    } finally {
      isHistoryActionRef.current = false;
    }
  };

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasElRef.current || fabricCanvasRef.current) return;

    configureFabricDefaults();

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      backgroundColor: '#090d16',
      preserveObjectStacking: true,
      selectionColor: 'rgba(16, 185, 129, 0.15)',
      selectionBorderColor: '#10b981',
      selectionLineWidth: 1.5,
    });

    fabricCanvasRef.current = canvas;

    // Attach Event Listeners
    canvas.on('selection:created', (e) => syncSelectionState(e.selected?.[0] || null));
    canvas.on('selection:updated', (e) => syncSelectionState(e.selected?.[0] || null));
    canvas.on('selection:cleared', () => syncSelectionState(null));
    canvas.on('object:modified', () => saveHistory());
    canvas.on('object:added', () => saveHistory());
    canvas.on('object:removed', () => saveHistory());

    // Calculate initial responsive zoom to fit container
    const autoFitZoom = () => {
      const availableW = window.innerWidth - 320 - 288 - 64; // Subtracted sidebars and margins
      const availableH = window.innerHeight - 56 - 64;
      const fitW = availableW / DEFAULT_WIDTH;
      const fitH = availableH / DEFAULT_HEIGHT;
      const calculated = Math.min(1, Math.max(0.3, Math.min(fitW, fitH)));
      setZoom(Number(calculated.toFixed(2)));
    };
    autoFitZoom();

    // Initial default heading to guide user
    addText(canvas, 'TIÊU ĐỀ BÀI HỌC STEM', {
      top: 180,
      fontSize: 54,
      fontWeight: 'bold',
      fill: '#10b981',
    });
    addText(canvas, 'Nhấp đúp chuột để chỉnh sửa văn bản hoặc chọn ảnh để tách nền AI', {
      top: 270,
      fontSize: 22,
      fill: '#94a3b8',
    });

    saveHistory();

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [syncSelectionState, saveHistory]);

  // Window Paste listener (Ctrl+V image) & Keyboard Shortcuts
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file && fabricCanvasRef.current) {
            const url = URL.createObjectURL(file);
            await addImageFromUrl(fabricCanvasRef.current, url);
            toast.success('Đã dán ảnh từ Clipboard thành công!');
          }
          break;
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      // Delete key
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        const activeObj = fabricCanvasRef.current?.getActiveObject();
        // Check if editing text inside textbox
        if (activeObj && (activeObj as unknown as { isEditing?: boolean }).isEditing) return;

        if (activeObj && fabricCanvasRef.current) {
          e.preventDefault();
          deleteObject(fabricCanvasRef.current, activeObj);
          toast.success('Đã xóa đối tượng');
        }
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey && !isInput) {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl+Y or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !isInput) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z' && !isInput)
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Canvas Resize Handler
  const handleResizeCanvas = (width: number, height: number, presetName?: string) => {
    if (!fabricCanvasRef.current) return;
    setCanvasWidth(width);
    setCanvasHeight(height);
    if (presetName) setActivePresetName(presetName);

    fabricCanvasRef.current.setDimensions({ width, height });
    fabricCanvasRef.current.requestRenderAll();
    saveHistory();
    toast.success(`Đã đổi kích thước canvas: ${width} × ${height} px`);
  };

  // Canvas Background Color Handler
  const handleCanvasBgColorChange = (color: string) => {
    if (!fabricCanvasRef.current) return;
    setCanvasBgColor(color);
    fabricCanvasRef.current.backgroundColor = color;
    fabricCanvasRef.current.requestRenderAll();
    saveHistory();
  };

  // Add Text Handler
  const handleAddText = (type: 'title' | 'subtitle' | 'body' | 'neon') => {
    if (!fabricCanvasRef.current) return;
    switch (type) {
      case 'title':
        addText(fabricCanvasRef.current, 'Tiêu đề lớn', {
          fontSize: 48,
          fontWeight: 'bold',
          fill: '#ffffff',
        });
        break;
      case 'subtitle':
        addText(fabricCanvasRef.current, 'Tiêu đề phụ', {
          fontSize: 28,
          fontWeight: '600',
          fill: '#38bdf8',
        });
        break;
      case 'body':
        addText(fabricCanvasRef.current, 'Nội dung bài viết chi tiết ở đây...', {
          fontSize: 18,
          fill: '#cbd5e1',
        });
        break;
      case 'neon':
        addText(fabricCanvasRef.current, 'ROBOTICS CYBER 2026', {
          fontSize: 44,
          fontWeight: 'bold',
          fill: '#34d399',
          shadow: new fabric.Shadow({
            color: '#10b981',
            blur: 20,
            offsetX: 0,
            offsetY: 0,
          }),
        });
        break;
    }
    toast.success('Đã thêm chữ vào canvas');
  };

  // Add Shape Handler
  const handleAddShape = (type: 'rect' | 'circle' | 'triangle' | 'line' | 'star' | 'arrow') => {
    if (!fabricCanvasRef.current) return;
    switch (type) {
      case 'rect':
        addRect(fabricCanvasRef.current);
        break;
      case 'circle':
        addCircle(fabricCanvasRef.current);
        break;
      case 'triangle':
        addTriangle(fabricCanvasRef.current);
        break;
      case 'line':
        addLine(fabricCanvasRef.current);
        break;
      default:
        addRect(fabricCanvasRef.current);
        break;
    }
    toast.success('Đã thêm hình vào canvas');
  };

  // Upload and Add Image Handler
  const handleUploadImage = async (file: File) => {
    if (!fabricCanvasRef.current) return;
    try {
      const url = URL.createObjectURL(file);
      await addImageFromUrl(fabricCanvasRef.current, url);
      toast.success('Đã tải ảnh lên canvas');
    } catch (e) {
      console.error('Image load error:', e);
      toast.error('Không thể nạp ảnh. Vui lòng thử lại.');
    }
  };

  // Select Template Handler
  const handleSelectTemplate = async (template: DesignTemplate) => {
    if (!fabricCanvasRef.current) return;
    try {
      fabricCanvasRef.current.clear();
      setCanvasWidth(template.dimensions.width);
      setCanvasHeight(template.dimensions.height);
      fabricCanvasRef.current.setDimensions(template.dimensions);

      if (template.data.background) {
        setCanvasBgColor(template.data.background as string);
        fabricCanvasRef.current.backgroundColor = template.data.background as string;
      }

      await fabricCanvasRef.current.loadFromJSON(template.data);
      fabricCanvasRef.current.requestRenderAll();
      setProjectName(template.name);
      saveHistory();
      toast.success(`Đã áp dụng mẫu: ${template.name}`);
    } catch (e) {
      console.error('Template apply error:', e);
      toast.error('Lỗi khi tải mẫu thiết kế.');
    }
  };

  // Quick AI Remove Background for newly uploaded file
  const handleQuickAiRemoveBg = async (file: File) => {
    if (!fabricCanvasRef.current) return;
    setIsAiProcessing(true);
    setAiProgressMessage('Đang khởi tạo model AI tách nền...');
    try {
      const transparentBlob = await removeImageBackground(file, {
        onProgress: (percent, msg) => {
          setAiProgressMessage(`${percent}% - ${msg}`);
        },
      });

      const url = URL.createObjectURL(transparentBlob);
      await addImageFromUrl(fabricCanvasRef.current, url);
      toast.success('✨ Đã tách nền AI thành công và đưa vào canvas!');
    } catch (e) {
      console.error('AI removal error:', e);
      toast.error('Không thể tách nền ảnh này. Vui lòng thử ảnh khác.');
    } finally {
      setIsAiProcessing(false);
      setAiProgressMessage('');
    }
  };

  // AI Remove Background for SELECTED Image Layer (Seamless In-Place Replacement)
  const handleAiRemoveBgSelected = async () => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (!activeObj || !fabricCanvasRef.current) {
      toast.error('Vui lòng chọn một layer ảnh trước');
      return;
    }

    const type = activeObj.type?.toLowerCase() || '';
    if (type !== 'fabricimage' && type !== 'image') {
      toast.error('Vật thể đang chọn không phải là hình ảnh');
      return;
    }

    setIsAiProcessing(true);
    setAiProgressMessage('Đang trích xuất ảnh layer...');

    try {
      // 1. Export active image to temporary dataUrl
      const dataUrl = (activeObj as fabric.FabricImage).toDataURL({ format: 'png' });

      // 2. Run local AI background removal
      const transparentBlob = await removeImageBackground(dataUrl, {
        onProgress: (percent, msg) => {
          setAiProgressMessage(`${percent}% - ${msg}`);
        },
      });

      // 3. Save position & transformation metrics
      const left = activeObj.left;
      const top = activeObj.top;
      const scaleX = activeObj.scaleX;
      const scaleY = activeObj.scaleY;
      const angle = activeObj.angle;
      const flipX = activeObj.flipX;
      const flipY = activeObj.flipY;

      // 4. Create new transparent image element
      const newImgUrl = URL.createObjectURL(transparentBlob);
      const newImage = await fabric.FabricImage.fromURL(newImgUrl, {
        crossOrigin: 'anonymous',
      });

      newImage.set({
        left,
        top,
        scaleX,
        scaleY,
        angle,
        flipX,
        flipY,
      });

      // 5. Replace on canvas
      const canvas = fabricCanvasRef.current;
      canvas.remove(activeObj);
      canvas.add(newImage);
      canvas.setActiveObject(newImage);
      canvas.requestRenderAll();

      syncSelectionState(newImage);
      saveHistory();
      toast.success('✨ Tách nền AI hoàn tất! Ảnh đã được thay thế ngay tại chỗ.');
    } catch (e) {
      console.error('In-place AI removal failed:', e);
      toast.error('Tách nền AI thất bại. Hãy kiểm tra kết nối WebAssembly.');
    } finally {
      setIsAiProcessing(false);
      setAiProgressMessage('');
    }
  };

  // Photo Editor Adjustments Handler
  const handleApplyImageAdjustments = async (adjustments: ImageAdjustments) => {
    setImageAdjustments(adjustments);
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (!activeObj || !fabricCanvasRef.current) return;

    const type = activeObj.type?.toLowerCase() || '';
    if (type === 'fabricimage' || type === 'image') {
      await applyImageAdjustments(activeObj as fabric.FabricImage, adjustments);
      fabricCanvasRef.current.requestRenderAll();
    }
  };

  const handleResetImageAdjustments = async () => {
    handleApplyImageAdjustments(DEFAULT_IMAGE_ADJUSTMENTS);
  };

  // Text Properties Update Handler
  const handleUpdateTextProps = (props: Record<string, unknown>) => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (!activeObj || !fabricCanvasRef.current) return;
    activeObj.set(props);
    fabricCanvasRef.current.requestRenderAll();
    saveHistory();
  };

  // Shape Properties Update Handler
  const handleUpdateShapeProps = (props: Record<string, unknown>) => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (!activeObj || !fabricCanvasRef.current) return;
    activeObj.set(props);
    fabricCanvasRef.current.requestRenderAll();
    saveHistory();
  };

  // Layer & Transform actions
  const handleRotate = (delta: number) => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (activeObj && fabricCanvasRef.current) {
      rotateObject(fabricCanvasRef.current, activeObj, delta);
      saveHistory();
    }
  };

  const handleFlip = (dir: 'horizontal' | 'vertical') => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (activeObj && fabricCanvasRef.current) {
      flipObject(fabricCanvasRef.current, activeObj, dir);
      saveHistory();
    }
  };

  const handleBringForward = () => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (activeObj && fabricCanvasRef.current) {
      bringForward(fabricCanvasRef.current, activeObj);
      saveHistory();
    }
  };

  const handleSendBackward = () => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (activeObj && fabricCanvasRef.current) {
      sendBackward(fabricCanvasRef.current, activeObj);
      saveHistory();
    }
  };

  const handleBringToFront = () => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (activeObj && fabricCanvasRef.current) {
      bringToFront(fabricCanvasRef.current, activeObj);
      saveHistory();
    }
  };

  const handleSendToBack = () => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (activeObj && fabricCanvasRef.current) {
      sendToBack(fabricCanvasRef.current, activeObj);
      saveHistory();
    }
  };

  const handleDuplicate = async () => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (activeObj && fabricCanvasRef.current) {
      await duplicateObject(fabricCanvasRef.current, activeObj);
      saveHistory();
      toast.success('Đã nhân bản đối tượng');
    }
  };

  const handleDelete = () => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (activeObj && fabricCanvasRef.current) {
      deleteObject(fabricCanvasRef.current, activeObj);
      saveHistory();
      toast.success('Đã xóa đối tượng');
    }
  };

  // Save Project as JSON (.hubdesign)
  const handleSaveProject = () => {
    if (!fabricCanvasRef.current) return;
    const jsonString = exportProjectJson(fabricCanvasRef.current, {
      version: '1.0.0',
      id: `proj_${Date.now()}`,
      name: projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dimensions: { width: canvasWidth, height: canvasHeight },
      backgroundColor: canvasBgColor,
    });

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.hubdesign`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Đã lưu file dự án .hubdesign thành công!');
  };

  // Load Project from JSON (.hubdesign)
  const handleLoadProject = async (file: File) => {
    if (!fabricCanvasRef.current) return;
    try {
      const text = await file.text();
      const hubDesign: HubDesignFile = JSON.parse(text);
      const meta = await loadProjectJson(fabricCanvasRef.current, hubDesign);

      if (meta?.name) setProjectName(meta.name);
      if (meta?.dimensions) {
        setCanvasWidth(meta.dimensions.width);
        setCanvasHeight(meta.dimensions.height);
      }
      if (meta?.backgroundColor) {
        setCanvasBgColor(meta.backgroundColor);
      }

      saveHistory();
      toast.success(`Đã mở dự án "${meta.name || file.name}" thành công!`);
    } catch (e) {
      console.error('Load project error:', e);
      toast.error('File không hợp lệ hoặc bị hỏng.');
    }
  };

  // Export Canvas Image
  const handleExportImage = async (format: 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf') => {
    if (!fabricCanvasRef.current) return;
    setIsExporting(true);
    const cleanFilename = projectName.toLowerCase().replace(/\s+/g, '-');

    try {
      if (format === 'pdf') {
        await exportCanvasAsPDF(fabricCanvasRef.current, `${cleanFilename}.pdf`);
        toast.success('Đã xuất file PDF thành công!');
      } else if (format === 'svg') {
        const svgContent = exportCanvasAsSVG(fabricCanvasRef.current);
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${cleanFilename}.svg`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Đã xuất file SVG thành công!');
      } else {
        const dataUrl = exportCanvasAsImage(fabricCanvasRef.current, format, 0.95, 1.5);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${cleanFilename}.${format === 'jpeg' ? 'jpg' : format}`;
        link.click();
        toast.success(`Đã xuất ảnh .${format.toUpperCase()} chất lượng cao!`);
      }
    } catch (e) {
      console.error('Export error:', e);
      toast.error('Không thể xuất file. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP BAR */}
      <DesignStudioTopBar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
        onZoomOut={() => setZoom((z) => Math.max(0.2, Number((z - 0.1).toFixed(2))))}
        onZoomFit={() => {
          const availableW = window.innerWidth - 320 - 288 - 64;
          const availableH = window.innerHeight - 56 - 64;
          const fit = Math.min(availableW / canvasWidth, availableH / canvasHeight);
          setZoom(Number(Math.min(1.5, Math.max(0.2, fit)).toFixed(2)));
        }}
        onZoomReset={() => setZoom(1)}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onResizeCanvas={handleResizeCanvas}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onExportImage={handleExportImage}
        isExporting={isExporting}
        activePresetName={activePresetName}
      />

      {/* 2. MAIN 3-ZONE STUDIO WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR (Templates, Text, Shapes, Uploads, AI Tools) */}
        <DesignStudioSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onAddText={handleAddText}
          onAddShape={handleAddShape}
          onUploadImage={handleUploadImage}
          onSelectTemplate={handleSelectTemplate}
          onQuickAiRemoveBg={handleQuickAiRemoveBg}
          isAiProcessing={isAiProcessing}
          aiProgressMessage={aiProgressMessage}
        />

        {/* CENTER CANVAS WORKSPACE */}
        <DesignStudioCanvas
          canvasRef={canvasElRef}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          zoom={zoom}
          onDropImage={handleUploadImage}
        />

        {/* RIGHT INSPECTOR PANEL (Photo Editor Sliders, AI 1-Click Rembg, Typography, Styles) */}
        <DesignStudioInspector
          selectedObject={selectedObject}
          selectedType={selectedType}
          canvasBgColor={canvasBgColor}
          onCanvasBgColorChange={handleCanvasBgColorChange}
          onUpdateTextProps={handleUpdateTextProps}
          onUpdateShapeProps={handleUpdateShapeProps}
          onApplyImageAdjustments={handleApplyImageAdjustments}
          imageAdjustments={imageAdjustments}
          onResetImageAdjustments={handleResetImageAdjustments}
          onRotate={handleRotate}
          onFlip={handleFlip}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onAiRemoveBgSelected={handleAiRemoveBgSelected}
          isAiProcessing={isAiProcessing}
          aiProgressMessage={aiProgressMessage}
        />
      </div>
    </div>
  );
};
