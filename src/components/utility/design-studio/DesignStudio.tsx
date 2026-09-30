'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { toast } from 'sonner';
import { ToolTab, ImageAdjustments, DesignTemplate, DesignLayout, HubDesignFile, ShapeType } from '@/types/design-studio';
import { PanelLeft, PanelRight } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { DesignStudioTopBar } from './DesignStudioTopBar';
import { DesignStudioSidebar } from './DesignStudioSidebar';
import { DesignStudioCanvas } from './DesignStudioCanvas';
import { DesignStudioInspector } from './DesignStudioInspector';
import {
  configureFabricDefaults,
  addText,
  addShape,
  setCanvasDrawingMode,
  addSvgIcon,
  addTextInsideShape,
  applyLayoutToCanvas,
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
  setCanvasBackground,
  resizeFabricCanvas,
} from './services/fabric-service';
import { removeImageBackground } from './services/ai-remover';

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const AUTOSAVE_STORAGE_KEY = 'hub_design_studio_autosave_v2';

interface AutoSaveData {
  version: '2.0';
  updatedAt: number;
  projectName: string;
  activePresetName: string;
  canvasWidth: number;
  canvasHeight: number;
  canvasBgColor: string;
  canvasBgGradientStops?: [string, string];
  fabricJson: Record<string, unknown>;
}

const DEFAULT_IMAGE_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  hue: 0,
  presetFilter: 'none',
};

export const DesignStudio: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // References
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  // States
  const [projectName, setProjectName] = useState('Thiết kế STEM chưa đặt tên');
  const [activePresetName, setActivePresetName] = useState('YouTube Thumbnail');
  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(DEFAULT_HEIGHT);
  const [canvasBgColor, setCanvasBgColor] = useState(isDark ? '#090d16' : '#ffffff');
  const [canvasBgGradientStops, setCanvasBgGradientStops] = useState<[string, string] | undefined>(undefined);
  const [zoom, setZoom] = useState(0.85);

  // Auto-Save States & Dynamic Refs
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const projectNameRef = useRef(projectName);
  projectNameRef.current = projectName;
  const activePresetNameRef = useRef(activePresetName);
  activePresetNameRef.current = activePresetName;
  const canvasWidthRef = useRef(canvasWidth);
  canvasWidthRef.current = canvasWidth;
  const canvasHeightRef = useRef(canvasHeight);
  canvasHeightRef.current = canvasHeight;
  const canvasBgColorRef = useRef(canvasBgColor);
  canvasBgColorRef.current = canvasBgColor;
  const canvasBgGradientStopsRef = useRef(canvasBgGradientStops);
  canvasBgGradientStopsRef.current = canvasBgGradientStops;

  // Debounced Auto-Save to LocalStorage
  const scheduleAutoSave = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    setAutoSaveStatus('saving');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      if (!fabricCanvasRef.current) return;
      try {
        const canvas = fabricCanvasRef.current;
        const data: AutoSaveData = {
          version: '2.0',
          updatedAt: Date.now(),
          projectName: projectNameRef.current,
          activePresetName: activePresetNameRef.current,
          canvasWidth: canvasWidthRef.current,
          canvasHeight: canvasHeightRef.current,
          canvasBgColor: canvasBgColorRef.current,
          canvasBgGradientStops: canvasBgGradientStopsRef.current,
          fabricJson: canvas.toObject() as Record<string, unknown>,
        };
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(data));
        setAutoSaveStatus('saved');
        const d = new Date();
        const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        setLastSavedTime(timeStr);
      } catch (err) {
        console.warn('Auto-save error:', err);
        setAutoSaveStatus('saved');
      }
    }, 400);
  }, []);

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

  // Save current canvas state to history stack & trigger Auto-Save
  const saveHistory = useCallback(() => {
    if (!fabricCanvasRef.current || isHistoryActionRef.current) return;
    try {
      const jsonStr = JSON.stringify(fabricCanvasRef.current.toObject());
      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      newHistory.push(jsonStr);

      if (newHistory.length > 30) {
        newHistory.shift();
      }

      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;

      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);

      // Trigger debounced auto-save
      scheduleAutoSave();
    } catch (e) {
      console.error('History save error:', e);
    }
  }, [scheduleAutoSave]);

  // AI & Exporting States
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiProgressMessage, setAiProgressMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Resizable Panels States (Left Sidebar & Right Inspector)
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(360);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [rightInspectorWidth, setRightInspectorWidth] = useState(320);
  const [isRightInspectorOpen, setIsRightInspectorOpen] = useState(true);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Focus Mode (Chế độ tập trung - Toàn màn hình)
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Freehand Vector Drawing Brush States
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#10b981');
  const [drawingWidth, setDrawingWidth] = useState(4);

  const handleToggleDrawingMode = useCallback((enabled: boolean) => {
    setIsDrawingMode(enabled);
    if (fabricCanvasRef.current) {
      setCanvasDrawingMode(fabricCanvasRef.current, enabled, drawingColor, drawingWidth);
      if (enabled) {
        toast.info('Đã bật Bút Vẽ Vector. Rê chuột trên canvas để vẽ tự do!');
      } else {
        toast.info('Đã tắt Bút Vẽ. Nét vẽ là một layer vector có thể chọn và di chuyển.');
        saveHistory();
      }
    }
  }, [drawingColor, drawingWidth, saveHistory]);

  const handleDrawingColorChange = useCallback((color: string) => {
    setDrawingColor(color);
    if (fabricCanvasRef.current?.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.color = color;
    }
  }, []);

  const handleDrawingWidthChange = useCallback((width: number) => {
    setDrawingWidth(width);
    if (fabricCanvasRef.current?.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.width = width;
    }
  }, []);

  const handleToggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => {
      const next = !prev;
      if (next) {
        toast.info('Đã bật Chế độ Tập trung (Toàn màn hình). Nhấn Esc hoặc phím F để trở về.');
        if (typeof document !== 'undefined' && document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        toast.info('Đã thoát Chế độ Tập trung.');
        if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  }, []);

  // Keyboard shortcut listener (Esc to exit, F to toggle) and fullscreen sync
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === 'Escape' && isFocusMode) {
        handleToggleFocusMode();
      } else if ((e.key === 'f' || e.key === 'F') && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handleToggleFocusMode();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFocusMode, handleToggleFocusMode]);

  // Drag handler for left sidebar divider
  const handleLeftDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
    const startX = e.clientX;
    const startWidth = leftSidebarWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(560, Math.max(280, startWidth + delta));
      setLeftSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDraggingLeft(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Drag handler for right inspector divider
  const handleRightDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
    const startX = e.clientX;
    const startWidth = rightInspectorWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(520, Math.max(260, startWidth + delta));
      setRightInspectorWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDraggingRight(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Calculate responsive zoom so canvas always fits 100% inside available workspace without clipping
  const calculateFitZoom = useCallback((w: number, h: number) => {
    if (typeof window === 'undefined') return 0.85;
    const currentLeft = isLeftSidebarOpen ? leftSidebarWidth : 0;
    const currentRight = isRightInspectorOpen ? rightInspectorWidth : 0;
    const availableW = Math.max(300, window.innerWidth - currentLeft - currentRight - 48);
    const availableH = Math.max(300, window.innerHeight - 56 - 48);
    const fitW = (availableW - 32) / w;
    const fitH = (availableH - 32) / h;
    const fit = Math.min(1, Math.min(fitW, fitH));
    return Number(Math.max(0.2, fit).toFixed(2));
  }, [isLeftSidebarOpen, leftSidebarWidth, isRightInspectorOpen, rightInspectorWidth]);

  // Recalibrate fit-zoom whenever focus mode changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const fit = calculateFitZoom(canvasWidth, canvasHeight);
      setZoom(fit);
    }, 150);
    return () => clearTimeout(timer);
  }, [isFocusMode, calculateFitZoom, canvasWidth, canvasHeight]);

  // Sync active selection state
  const syncSelectionState = useCallback((target: fabric.FabricObject | null) => {
    if (!target) {
      setSelectedObject(null);
      setSelectedType(null);
      return;
    }

    setSelectedObject(target.toObject() as Record<string, unknown>);
    const type = target.type?.toLowerCase() || '';

    if (type === 'fabricimage' || type === 'image') {
      setSelectedType('image');
    } else if (type === 'textbox' || type === 'text' || type === 'i-text') {
      setSelectedType('textbox');
    } else {
      setSelectedType(type || 'shape');
    }
  }, []);

  // Reactive property update function: updates BOTH fabric canvas and React state (Supports single shapes & vector groups)
  const updateActiveObjectProperties = useCallback((props: Record<string, unknown>) => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (!activeObj || !fabricCanvasRef.current) return;

    activeObj.set(props);

    // If it's a vector group (such as a Lucide icon or SVG sticker/badge), recursively update child paths
    if (activeObj.type === 'group' && typeof (activeObj as fabric.Group).forEachObject === 'function') {
      (activeObj as fabric.Group).forEachObject((child) => {
        if (props.fill !== undefined) child.set('fill', props.fill);
        if (props.stroke !== undefined) child.set('stroke', props.stroke);
        if (props.strokeWidth !== undefined) child.set('strokeWidth', props.strokeWidth);
        if (props.opacity !== undefined) child.set('opacity', props.opacity);
      });
    }

    activeObj.setCoords();
    fabricCanvasRef.current.requestRenderAll();

    // Immediately reflect new values in Inspector state so sliders & inputs update in real time
    setSelectedObject((prev) => (prev ? { ...prev, ...props } : (activeObj.toObject() as Record<string, unknown>)));
    saveHistory();
  }, [saveHistory]);

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

  // Double click shape handler: adds or edits centered text inside the shape
  const handleShapeDoubleClick = useCallback((shape: fabric.FabricObject) => {
    if (!fabricCanvasRef.current) return;
    const type = shape.type?.toLowerCase() || '';
    if (type === 'rect' || type === 'circle' || type === 'triangle') {
      addTextInsideShape(fabricCanvasRef.current, shape);
      saveHistory();
      toast.success('Đã thêm chữ vào giữa hình. Hãy nhập nội dung!');
    }
  }, [saveHistory]);

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

    // Update selection state on transform events
    canvas.on('object:modified', (e) => {
      syncSelectionState(e.target || null);
      saveHistory();
    });
    canvas.on('object:scaling', (e) => syncSelectionState(e.target || null));
    canvas.on('object:rotating', (e) => syncSelectionState(e.target || null));
    canvas.on('object:moving', (e) => syncSelectionState(e.target || null));

    canvas.on('object:added', () => saveHistory());
    canvas.on('object:removed', () => saveHistory());
    canvas.on('path:created', () => saveHistory());

    // Double click on shape event
    canvas.on('mouse:dblclick', (e) => {
      if (e.target) {
        handleShapeDoubleClick(e.target);
      }
    });

    // Attempt to restore state from LocalStorage Auto-Save
    let hasRestored = false;
    try {
      const savedStr = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
      if (savedStr) {
        const saved: AutoSaveData = JSON.parse(savedStr);
        if (saved && saved.fabricJson) {
          hasRestored = true;
          if (saved.projectName) setProjectName(saved.projectName);
          if (saved.activePresetName) setActivePresetName(saved.activePresetName);

          const targetW = saved.canvasWidth || DEFAULT_WIDTH;
          const targetH = saved.canvasHeight || DEFAULT_HEIGHT;
          setCanvasWidth(targetW);
          setCanvasHeight(targetH);

          const targetBg = saved.canvasBgColor || (isDark ? '#090d16' : '#ffffff');
          setCanvasBgColor(targetBg);
          if (saved.canvasBgGradientStops) {
            setCanvasBgGradientStops(saved.canvasBgGradientStops);
          }

          resizeFabricCanvas(canvas, targetW, targetH, targetBg, saved.canvasBgGradientStops);

          canvas.loadFromJSON(saved.fabricJson).then(() => {
            canvas.calcOffset();
            canvas.requestRenderAll();
            const fit = calculateFitZoom(targetW, targetH);
            setZoom(fit);
            saveHistory();
            toast.success('Đã tự động khôi phục thiết kế từ phiên làm việc trước!', { id: 'autosave-restore' });
          });
        }
      }
    } catch (e) {
      console.error('Failed to load auto-save:', e);
    }

    if (!hasRestored) {
      // Calculate initial responsive zoom to fit container
      const initialFit = calculateFitZoom(DEFAULT_WIDTH, DEFAULT_HEIGHT);
      setZoom(initialFit);

      // Initial default heading with ample width and NO grapheme splitting
      addText(canvas, 'TIÊU ĐỀ BÀI HỌC STEM', {
        top: 180,
        width: 800,
        fontSize: 54,
        fontWeight: 'bold',
        fill: '#10b981',
        splitByGrapheme: false,
      });
      addText(canvas, 'Nhấp đúp chuột để chỉnh sửa văn bản hoặc chọn ảnh để tách nền AI', {
        top: 270,
        width: 760,
        fontSize: 22,
        fill: '#94a3b8',
        splitByGrapheme: false,
      });

      saveHistory();
    }

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [syncSelectionState, saveHistory, handleShapeDoubleClick, calculateFitZoom, isDark]);

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

    resizeFabricCanvas(fabricCanvasRef.current, width, height, canvasBgColor, canvasBgGradientStops);

    const newFit = calculateFitZoom(width, height);
    setZoom(newFit);

    saveHistory();
    toast.success(`Đã đổi kích thước canvas: ${width} × ${height} px`);
  };

  // Canvas Background Color Handler (Supports Solid, Transparent, Gradients)
  const handleCanvasBgColorChange = (color: string, gradientStops?: [string, string]) => {
    if (!fabricCanvasRef.current) return;
    setCanvasBgColor(color);
    setCanvasBgGradientStops(gradientStops);
    setCanvasBackground(fabricCanvasRef.current, color, gradientStops);
    saveHistory();
    if (color === 'transparent') {
      toast.success('Đã đổi nền canvas sang TRONG SUỐT (Transparent)');
    } else if (gradientStops) {
      toast.success('Đã áp dụng nền Gradient chuyển sắc');
    } else {
      toast.success(`Đã đổi màu nền canvas: ${color}`);
    }
  };

  // Add Text Handler
  const handleAddText = (type: 'title' | 'subtitle' | 'body' | 'neon') => {
    if (!fabricCanvasRef.current) return;
    switch (type) {
      case 'title':
        addText(fabricCanvasRef.current, 'Tiêu đề lớn', {
          fontSize: 48,
          width: 700,
          fontWeight: 'bold',
          fill: '#ffffff',
          splitByGrapheme: false,
        });
        break;
      case 'subtitle':
        addText(fabricCanvasRef.current, 'Tiêu đề phụ', {
          fontSize: 28,
          width: 600,
          fontWeight: '600',
          fill: '#38bdf8',
          splitByGrapheme: false,
        });
        break;
      case 'body':
        addText(fabricCanvasRef.current, 'Nội dung bài viết chi tiết ở đây...', {
          fontSize: 18,
          width: 500,
          fill: '#cbd5e1',
          splitByGrapheme: false,
        });
        break;
      case 'neon':
        addText(fabricCanvasRef.current, 'ROBOTICS CYBER 2026', {
          fontSize: 44,
          width: 750,
          fontWeight: 'bold',
          fill: '#34d399',
          shadow: new fabric.Shadow({
            color: '#10b981',
            blur: 20,
            offsetX: 0,
            offsetY: 0,
          }),
          splitByGrapheme: false,
        });
        break;
    }
    toast.success('Đã thêm chữ vào canvas');
  };

  // Add Shape Handler (All 21+ vector shapes)
  const handleAddShape = (type: ShapeType) => {
    if (!fabricCanvasRef.current) return;
    addShape(fabricCanvasRef.current, type);
    saveHistory();
    toast.success('Đã thêm hình vào canvas (Nhấp đúp để gõ chữ vào trong)');
  };

  // Add Text inside Selected Shape (From Inspector button)
  const handleAddTextToShape = () => {
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (activeObj && fabricCanvasRef.current) {
      handleShapeDoubleClick(activeObj);
    }
  };

  // Add SVG Sticker or Badge
  const handleAddSvgSticker = async (svgString: string) => {
    if (!fabricCanvasRef.current) return;
    try {
      await addSvgIcon(fabricCanvasRef.current, svgString);
      saveHistory();
      toast.success('Đã chèn huy hiệu / sticker SVG vào canvas');
    } catch (e) {
      console.error('Add SVG sticker error:', e);
      toast.error('Lỗi khi nạp SVG sticker.');
    }
  };

  // Apply Layout (Preserves current background & adapts dynamically to canvas dimensions)
  const handleApplyLayout = (layout: DesignLayout) => {
    if (!fabricCanvasRef.current) return;
    applyLayoutToCanvas(fabricCanvasRef.current, layout, canvasBgColor, canvasBgGradientStops);
    saveHistory();
    toast.success(`Đã áp dụng bố cục: ${layout.name} (Bảo toàn màu nền)`);
  };

  // Upload and Add Image Handler
  const handleUploadImage = async (file: File) => {
    if (!fabricCanvasRef.current) return;
    try {
      const url = URL.createObjectURL(file);
      await addImageFromUrl(fabricCanvasRef.current, url);
      saveHistory();
      toast.success('Đã tải ảnh lên canvas');
    } catch (e) {
      console.error('Image load error:', e);
      toast.error('Không thể nạp ảnh. Vui lòng thử lại.');
    }
  };

  // Select Template Handler (Synchronizes dimensions, background, and objects)
  const handleSelectTemplate = async (template: DesignTemplate) => {
    if (!fabricCanvasRef.current) return;
    try {
      fabricCanvasRef.current.clear();
      setCanvasWidth(template.dimensions.width);
      setCanvasHeight(template.dimensions.height);

      const targetBg = (template.data.background as string) || (isDark ? '#090d16' : '#ffffff');
      setCanvasBgColor(targetBg);
      setCanvasBgGradientStops(undefined);

      resizeFabricCanvas(fabricCanvasRef.current, template.dimensions.width, template.dimensions.height, targetBg);

      await fabricCanvasRef.current.loadFromJSON(template.data);
      fabricCanvasRef.current.calcOffset();
      fabricCanvasRef.current.requestRenderAll();
      setProjectName(template.name);
      setActivePresetName(template.name);

      // Auto-fit zoom so newly selected template is immediately balanced & centered in screen
      const newFit = calculateFitZoom(template.dimensions.width, template.dimensions.height);
      setZoom(newFit);

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
      saveHistory();
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
      const dataUrl = (activeObj as fabric.FabricImage).toDataURL({ format: 'png' });

      const transparentBlob = await removeImageBackground(dataUrl, {
        onProgress: (percent, msg) => {
          setAiProgressMessage(`${percent}% - ${msg}`);
        },
      });

      const left = activeObj.left;
      const top = activeObj.top;
      const scaleX = activeObj.scaleX;
      const scaleY = activeObj.scaleY;
      const angle = activeObj.angle;
      const flipX = activeObj.flipX;
      const flipY = activeObj.flipY;

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
      saveHistory();
    }
  };

  const handleResetImageAdjustments = async () => {
    await handleApplyImageAdjustments(DEFAULT_IMAGE_ADJUSTMENTS);
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

  // Create New Project (Reset state & clean autosave)
  const handleNewProject = () => {
    if (!fabricCanvasRef.current) return;
    const confirmNew = window.confirm('Bạn có chắc muốn tạo dự án mới? Toàn bộ nội dung hiện tại sẽ được làm mới.');
    if (!confirmNew) return;

    try {
      localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
      fabricCanvasRef.current.clear();

      setProjectName('Thiết kế STEM chưa đặt tên');
      setActivePresetName('YouTube Thumbnail (16:9)');
      setCanvasWidth(DEFAULT_WIDTH);
      setCanvasHeight(DEFAULT_HEIGHT);

      const defaultBg = isDark ? '#090d16' : '#ffffff';
      setCanvasBgColor(defaultBg);
      setCanvasBgGradientStops(undefined);

      resizeFabricCanvas(fabricCanvasRef.current, DEFAULT_WIDTH, DEFAULT_HEIGHT, defaultBg);

      addText(fabricCanvasRef.current, 'BẮT ĐẦU DỰ ÁN MỚI', {
        top: 220,
        width: 800,
        fontSize: 50,
        fontWeight: 'bold',
        fill: '#10b981',
        splitByGrapheme: false,
      });

      const fit = calculateFitZoom(DEFAULT_WIDTH, DEFAULT_HEIGHT);
      setZoom(fit);

      historyRef.current = [];
      historyIndexRef.current = -1;
      saveHistory();
      toast.success('Đã tạo dự án mới thành công!');
    } catch (e) {
      console.error('New project error:', e);
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
        resizeFabricCanvas(
          fabricCanvasRef.current,
          meta.dimensions.width,
          meta.dimensions.height,
          meta.backgroundColor || canvasBgColor
        );
        const fit = calculateFitZoom(meta.dimensions.width, meta.dimensions.height);
        setZoom(fit);
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
    <div className={`flex flex-col font-sans transition-all duration-200 ${
      isFocusMode
        ? 'fixed inset-0 z-[100] h-screen w-screen overflow-hidden'
        : 'h-screen overflow-hidden'
    } ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* 1. TOP BAR */}
      <DesignStudioTopBar
        projectName={projectName}
        onProjectNameChange={(name) => {
          setProjectName(name);
          scheduleAutoSave();
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
        onZoomOut={() => setZoom((z) => Math.max(0.2, Number((z - 0.1).toFixed(2))))}
        onZoomFit={() => {
          const fit = calculateFitZoom(canvasWidth, canvasHeight);
          setZoom(fit);
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
        isDark={isDark}
        canvasBgColor={canvasBgColor}
        onCanvasBgColorChange={handleCanvasBgColorChange}
        onOpenBackgroundTab={() => setActiveTab('background')}
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
        isRightInspectorOpen={isRightInspectorOpen}
        onToggleRightInspector={() => setIsRightInspectorOpen((prev) => !prev)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={handleToggleFocusMode}
        autoSaveStatus={autoSaveStatus}
        lastSavedTime={lastSavedTime}
        onNewProject={handleNewProject}
      />

      {/* 2. MAIN 3-ZONE STUDIO WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Transparent global drag overlay to ensure smooth dragging over canvas */}
        {(isDraggingLeft || isDraggingRight) && (
          <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
        )}

        {/* LEFT SIDEBAR (Templates, Layouts, Background, Text, Shapes, Stickers, Uploads, AI Tools) */}
        {isLeftSidebarOpen && (
          <DesignStudioSidebar
            width={leftSidebarWidth}
            onToggleCollapse={() => setIsLeftSidebarOpen(false)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onAddText={handleAddText}
            onAddShape={handleAddShape}
            onUploadImage={handleUploadImage}
            onSelectTemplate={handleSelectTemplate}
            onApplyLayout={handleApplyLayout}
            onAddSvgSticker={handleAddSvgSticker}
            onQuickAiRemoveBg={handleQuickAiRemoveBg}
            isAiProcessing={isAiProcessing}
            aiProgressMessage={aiProgressMessage}
            isDark={isDark}
            canvasBgColor={canvasBgColor}
            onCanvasBgColorChange={handleCanvasBgColorChange}
            isDrawingMode={isDrawingMode}
            onToggleDrawingMode={handleToggleDrawingMode}
            drawingColor={drawingColor}
            onDrawingColorChange={handleDrawingColorChange}
            drawingWidth={drawingWidth}
            onDrawingWidthChange={handleDrawingWidthChange}
          />
        )}

        {/* LEFT DRAG DIVIDER */}
        {isLeftSidebarOpen && (
          <div
            onMouseDown={handleLeftDividerMouseDown}
            className={`w-1.5 hover:w-2 z-20 cursor-col-resize select-none shrink-0 transition-all flex items-center justify-center group ${
              isDraggingLeft
                ? 'bg-emerald-500 w-2'
                : isDark
                ? 'bg-slate-850 hover:bg-emerald-500/60'
                : 'bg-slate-300 hover:bg-emerald-500/60'
            }`}
            title="Kéo sang trái/phải để đổi độ rộng bảng công cụ"
          >
            <div
              className={`h-8 w-0.5 rounded-full transition-colors ${
                isDraggingLeft ? 'bg-white' : 'bg-slate-500/40 group-hover:bg-white'
              }`}
            />
          </div>
        )}

        {/* CENTER CANVAS WORKSPACE WITH FLOATING TOGGLE BUTTONS */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Quick Floating Reopen Button (Left) */}
          {!isLeftSidebarOpen && (
            <button
              onClick={() => setIsLeftSidebarOpen(true)}
              className={`absolute top-3 left-3 z-30 p-2 px-2.5 rounded-xl shadow-lg border flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md transition group ${
                isDark
                  ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:text-emerald-400 hover:border-emerald-500/50'
                  : 'bg-white/95 border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-500/50'
              }`}
              title="Mở thanh công cụ (Trái)"
            >
              <PanelLeft className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Công cụ</span>
            </button>
          )}

          {/* Quick Floating Reopen Button (Right) */}
          {!isRightInspectorOpen && (
            <button
              onClick={() => setIsRightInspectorOpen(true)}
              className={`absolute top-3 right-3 z-30 p-2 px-2.5 rounded-xl shadow-lg border flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md transition group ${
                isDark
                  ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:text-emerald-400 hover:border-emerald-500/50'
                  : 'bg-white/95 border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-500/50'
              }`}
              title="Mở bảng thuộc tính (Phải)"
            >
              <PanelRight className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Thuộc tính</span>
            </button>
          )}

          <DesignStudioCanvas
            canvasRef={canvasElRef}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            zoom={zoom}
            onDropImage={handleUploadImage}
            isDark={isDark}
            canvasBgColor={canvasBgColor}
          />
        </div>

        {/* RIGHT DRAG DIVIDER */}
        {isRightInspectorOpen && (
          <div
            onMouseDown={handleRightDividerMouseDown}
            className={`w-1.5 hover:w-2 z-20 cursor-col-resize select-none shrink-0 transition-all flex items-center justify-center group ${
              isDraggingRight
                ? 'bg-emerald-500 w-2'
                : isDark
                ? 'bg-slate-850 hover:bg-emerald-500/60'
                : 'bg-slate-300 hover:bg-emerald-500/60'
            }`}
            title="Kéo sang trái/phải để đổi độ rộng bảng thuộc tính"
          >
            <div
              className={`h-8 w-0.5 rounded-full transition-colors ${
                isDraggingRight ? 'bg-white' : 'bg-slate-500/40 group-hover:bg-white'
              }`}
            />
          </div>
        )}

        {/* RIGHT INSPECTOR PANEL (Photo Editor Sliders, AI 1-Click Rembg, Typography, Styles) */}
        {isRightInspectorOpen && (
          <DesignStudioInspector
            width={rightInspectorWidth}
            onToggleCollapse={() => setIsRightInspectorOpen(false)}
            selectedObject={selectedObject}
            selectedType={selectedType}
            canvasBgColor={canvasBgColor}
            onCanvasBgColorChange={handleCanvasBgColorChange}
            onUpdateTextProps={updateActiveObjectProperties}
            onUpdateShapeProps={updateActiveObjectProperties}
            onAddTextToShape={handleAddTextToShape}
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
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
};
