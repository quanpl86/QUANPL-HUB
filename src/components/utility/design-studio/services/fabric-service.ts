import * as fabric from 'fabric';
import { ImageAdjustments, HubDesignFile, DesignProjectMeta, DesignLayout, ShapeType } from '@/types/design-studio';
import jsPDF from 'jspdf';

/**
 * Configure default styling for Fabric controls (bounding box, rotation and scale handles)
 */
export function configureFabricDefaults() {
  const commonDefaults = {
    originX: 'left' as const,
    originY: 'top' as const,
    transparentCorners: false,
    cornerColor: '#10b981',
    cornerStrokeColor: '#064e3b',
    borderColor: '#10b981',
    cornerSize: 10,
    cornerStyle: 'circle' as const,
    borderScaleFactor: 1.5,
    padding: 6,
  };

  fabric.FabricObject.ownDefaults = {
    ...fabric.FabricObject.ownDefaults,
    ...commonDefaults,
  };
  if (fabric.Rect) {
    fabric.Rect.ownDefaults = { ...fabric.Rect.ownDefaults, ...commonDefaults };
  }
  if (fabric.Circle) {
    fabric.Circle.ownDefaults = { ...fabric.Circle.ownDefaults, ...commonDefaults };
  }
  if (fabric.Triangle) {
    fabric.Triangle.ownDefaults = { ...fabric.Triangle.ownDefaults, ...commonDefaults };
  }
  if (fabric.Textbox) {
    fabric.Textbox.ownDefaults = { ...fabric.Textbox.ownDefaults, ...commonDefaults, splitByGrapheme: false };
  }
  if (fabric.FabricImage) {
    fabric.FabricImage.ownDefaults = { ...fabric.FabricImage.ownDefaults, ...commonDefaults };
  }
}

/**
 * Create a new Textbox with proper word wrapping (splitByGrapheme = false)
 */
export function addText(
  canvas: fabric.Canvas,
  text = 'Nội dung văn bản',
  options: Record<string, unknown> = {}
): fabric.Textbox {
  const canvasW = canvas.width || 800;
  const canvasH = canvas.height || 600;
  const targetWidth = Math.min(600, canvasW * 0.75);

  const textbox = new fabric.Textbox(text, {
    originX: 'left',
    originY: 'top',
    left: canvasW / 2 - targetWidth / 2,
    top: canvasH / 2 - 25,
    width: targetWidth,
    fontSize: 36,
    fontFamily: 'Inter',
    fill: '#ffffff',
    textAlign: 'center',
    splitByGrapheme: false,
    ...options,
  });

  canvas.add(textbox);
  canvas.setActiveObject(textbox);
  canvas.requestRenderAll();
  return textbox;
}

/**
 * Set Canvas Freehand Vector Drawing Mode
 */
export function setCanvasDrawingMode(
  canvas: fabric.Canvas,
  isDrawing: boolean,
  color = '#10b981',
  width = 4
): void {
  canvas.isDrawingMode = isDrawing;
  if (isDrawing) {
    if (!canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = width;
  }
}

/**
 * Add Diverse Vector Shapes to Canvas
 */
export function addShape(
  canvas: fabric.Canvas,
  type: ShapeType,
  options: Record<string, unknown> = {}
): fabric.FabricObject {
  const canvasW = canvas.width || 800;
  const canvasH = canvas.height || 600;
  const cx = canvasW / 2;
  const cy = canvasH / 2;

  let obj: fabric.FabricObject;

  switch (type) {
    case 'rect':
      obj = new fabric.Rect({
        left: cx - 120,
        top: cy - 90,
        width: 240,
        height: 180,
        fill: '#10b981',
        rx: 0,
        ry: 0,
        stroke: '#ffffff',
        strokeWidth: 0,
        ...options,
      });
      break;

    case 'rounded-rect':
      obj = new fabric.Rect({
        left: cx - 120,
        top: cy - 90,
        width: 240,
        height: 180,
        fill: '#10b981',
        rx: 28,
        ry: 28,
        stroke: '#ffffff',
        strokeWidth: 0,
        ...options,
      });
      break;

    case 'circle':
      obj = new fabric.Circle({
        left: cx - 90,
        top: cy - 90,
        radius: 90,
        fill: '#38bdf8',
        stroke: '#ffffff',
        strokeWidth: 0,
        ...options,
      });
      break;

    case 'ellipse':
      obj = new fabric.Ellipse({
        left: cx - 120,
        top: cy - 80,
        rx: 120,
        ry: 80,
        fill: '#6366f1',
        stroke: '#ffffff',
        strokeWidth: 0,
        ...options,
      });
      break;

    case 'triangle':
      obj = new fabric.Triangle({
        left: cx - 90,
        top: cy - 80,
        width: 180,
        height: 160,
        fill: '#f59e0b',
        stroke: '#ffffff',
        strokeWidth: 0,
        ...options,
      });
      break;

    case 'diamond':
      obj = new fabric.Path('M 100 0 L 200 100 L 100 200 L 0 100 Z', {
        left: cx - 90,
        top: cy - 90,
        fill: '#ec4899',
        stroke: '#ffffff',
        strokeWidth: 0,
        scaleX: 0.9,
        scaleY: 0.9,
        ...options,
      });
      break;

    case 'star':
      obj = new fabric.Path('M 100 0 L 125 70 L 200 70 L 140 115 L 160 185 L 100 145 L 40 185 L 60 115 L 0 70 L 75 70 Z', {
        left: cx - 90,
        top: cy - 90,
        fill: '#fbbf24',
        stroke: '#f59e0b',
        strokeWidth: 2,
        scaleX: 0.9,
        scaleY: 0.9,
        ...options,
      });
      break;

    case 'heart':
      obj = new fabric.Path('M 100 40 A 30 30 0 0 0 40 100 C 40 150 100 190 100 190 C 100 190 160 150 160 100 A 30 30 0 0 0 100 40 Z', {
        left: cx - 85,
        top: cy - 80,
        fill: '#f43f5e',
        stroke: '#ffffff',
        strokeWidth: 0,
        scaleX: 1.1,
        scaleY: 1.1,
        ...options,
      });
      break;

    case 'hexagon':
      obj = new fabric.Path('M 50 0 L 150 0 L 200 86.6 L 150 173.2 L 50 173.2 L 0 86.6 Z', {
        left: cx - 90,
        top: cy - 80,
        fill: '#06b6d4',
        stroke: '#ffffff',
        strokeWidth: 0,
        scaleX: 0.9,
        scaleY: 0.9,
        ...options,
      });
      break;

    case 'pentagon':
      obj = new fabric.Path('M 100 0 L 195 69 L 159 181 L 41 181 L 5 69 Z', {
        left: cx - 90,
        top: cy - 80,
        fill: '#8b5cf6',
        stroke: '#ffffff',
        strokeWidth: 0,
        scaleX: 0.9,
        scaleY: 0.9,
        ...options,
      });
      break;

    case 'octagon':
      obj = new fabric.Path('M 58 0 L 142 0 L 200 58 L 200 142 L 142 200 L 58 200 L 0 142 L 0 58 Z', {
        left: cx - 90,
        top: cy - 90,
        fill: '#14b8a6',
        stroke: '#ffffff',
        strokeWidth: 0,
        scaleX: 0.9,
        scaleY: 0.9,
        ...options,
      });
      break;

    case 'arrow-right':
      obj = new fabric.Path('M 0 60 L 120 60 L 120 20 L 200 100 L 120 180 L 120 140 L 0 140 Z', {
        left: cx - 100,
        top: cy - 60,
        fill: '#10b981',
        stroke: '#ffffff',
        strokeWidth: 0,
        scaleX: 1,
        scaleY: 0.8,
        ...options,
      });
      break;

    case 'arrow-left':
      obj = new fabric.Path('M 200 60 L 80 60 L 80 20 L 0 100 L 80 180 L 80 140 L 200 140 Z', {
        left: cx - 100,
        top: cy - 60,
        fill: '#10b981',
        stroke: '#ffffff',
        strokeWidth: 0,
        scaleX: 1,
        scaleY: 0.8,
        ...options,
      });
      break;

    case 'arrow-double':
      obj = new fabric.Path('M 70 20 L 0 100 L 70 180 L 70 140 L 130 140 L 130 180 L 200 100 L 130 20 L 130 60 L 70 60 Z', {
        left: cx - 100,
        top: cy - 60,
        fill: '#0284c7',
        stroke: '#ffffff',
        strokeWidth: 0,
        scaleX: 1,
        scaleY: 0.8,
        ...options,
      });
      break;

    case 'speech-bubble':
      obj = new fabric.Path('M 20 20 C 10 20 0 30 0 40 L 0 130 C 0 140 10 150 20 150 L 50 150 L 30 190 L 90 150 L 180 150 C 190 150 200 140 200 130 L 200 40 C 200 30 190 20 180 20 Z', {
        left: cx - 90,
        top: cy - 80,
        fill: '#3b82f6',
        stroke: '#ffffff',
        strokeWidth: 0,
        scaleX: 1,
        scaleY: 0.9,
        ...options,
      });
      break;

    case 'thought-bubble':
      obj = new fabric.Path('M 50 130 A 30 30 0 0 1 70 80 A 45 45 0 0 1 140 70 A 35 35 0 0 1 180 110 A 30 30 0 0 1 170 145 A 25 25 0 0 1 130 155 L 70 155 A 25 25 0 0 1 50 130 Z', {
        left: cx - 90,
        top: cy - 80,
        fill: '#8b5cf6',
        stroke: '#ffffff',
        strokeWidth: 0,
        scaleX: 1.2,
        scaleY: 1.1,
        ...options,
      });
      break;

    case 'lightning':
      obj = new fabric.Path('M 110 0 L 20 110 L 90 110 L 70 200 L 170 80 L 100 80 Z', {
        left: cx - 70,
        top: cy - 90,
        fill: '#eab308',
        stroke: '#ca8a04',
        strokeWidth: 1,
        scaleX: 0.9,
        scaleY: 0.9,
        ...options,
      });
      break;

    case 'badge-ribbon':
      obj = new fabric.Path('M 0 0 L 160 0 L 200 50 L 160 100 L 0 100 L 30 50 Z', {
        left: cx - 100,
        top: cy - 50,
        fill: '#e11d48',
        stroke: '#ffffff',
        strokeWidth: 0,
        scaleX: 1.1,
        scaleY: 0.9,
        ...options,
      });
      break;

    case 'cross':
      obj = new fabric.Path('M 70 0 L 130 0 L 130 70 L 200 70 L 200 130 L 130 130 L 130 200 L 70 200 L 70 130 L 0 130 L 0 70 L 70 70 Z', {
        left: cx - 80,
        top: cy - 80,
        fill: '#ef4444',
        stroke: '#ffffff',
        strokeWidth: 0,
        scaleX: 0.8,
        scaleY: 0.8,
        ...options,
      });
      break;

    case 'line':
      obj = new fabric.Line([cx - 150, cy, cx + 150, cy], {
        stroke: '#e2e8f0',
        strokeWidth: 4,
        ...options,
      });
      break;

    case 'dashed-line':
      obj = new fabric.Line([cx - 150, cy, cx + 150, cy], {
        stroke: '#38bdf8',
        strokeWidth: 4,
        strokeDashArray: [12, 8],
        ...options,
      });
      break;

    case 'arrow-line':
      obj = new fabric.Path('M 0 10 L 260 10 L 250 0 M 260 10 L 250 20', {
        left: cx - 130,
        top: cy - 10,
        fill: '',
        stroke: '#10b981',
        strokeWidth: 4,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        ...options,
      });
      break;

    default:
      obj = new fabric.Rect({
        left: cx - 120,
        top: cy - 90,
        width: 240,
        height: 180,
        fill: '#10b981',
        ...options,
      });
      break;
  }

  canvas.add(obj);
  canvas.setActiveObject(obj);
  canvas.requestRenderAll();
  return obj;
}

/**
 * Add Rectangle
 */
export function addRect(
  canvas: fabric.Canvas,
  options: Record<string, unknown> = {}
): fabric.Rect {
  const canvasW = canvas.width || 800;
  const canvasH = canvas.height || 600;

  const rect = new fabric.Rect({
    originX: 'left',
    originY: 'top',
    left: canvasW / 2 - 120,
    top: canvasH / 2 - 90,
    width: 240,
    height: 180,
    fill: '#10b981',
    rx: 8,
    ry: 8,
    stroke: '#ffffff',
    strokeWidth: 0,
    ...options,
  });

  canvas.add(rect);
  canvas.setActiveObject(rect);
  canvas.requestRenderAll();
  return rect;
}

/**
 * Add Circle
 */
export function addCircle(
  canvas: fabric.Canvas,
  options: Record<string, unknown> = {}
): fabric.Circle {
  const canvasW = canvas.width || 800;
  const canvasH = canvas.height || 600;

  const circle = new fabric.Circle({
    originX: 'left',
    originY: 'top',
    left: canvasW / 2 - 90,
    top: canvasH / 2 - 90,
    radius: 90,
    fill: '#38bdf8',
    stroke: '#ffffff',
    strokeWidth: 0,
    ...options,
  });

  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.requestRenderAll();
  return circle;
}

/**
 * Add Triangle
 */
export function addTriangle(
  canvas: fabric.Canvas,
  options: Record<string, unknown> = {}
): fabric.Triangle {
  const canvasW = canvas.width || 800;
  const canvasH = canvas.height || 600;

  const triangle = new fabric.Triangle({
    originX: 'left',
    originY: 'top',
    left: canvasW / 2 - 90,
    top: canvasH / 2 - 80,
    width: 180,
    height: 160,
    fill: '#f59e0b',
    stroke: '#ffffff',
    strokeWidth: 0,
    ...options,
  });

  canvas.add(triangle);
  canvas.setActiveObject(triangle);
  canvas.requestRenderAll();
  return triangle;
}

/**
 * Add Line
 */
export function addLine(
  canvas: fabric.Canvas,
  options: Record<string, unknown> = {}
): fabric.Line {
  const canvasW = canvas.width || 800;
  const canvasH = canvas.height || 600;

  const line = new fabric.Line(
    [
      canvasW / 2 - 150,
      canvasH / 2,
      canvasW / 2 + 150,
      canvasH / 2,
    ],
    {
      stroke: '#e2e8f0',
      strokeWidth: 4,
      ...options,
    }
  );

  canvas.add(line);
  canvas.setActiveObject(line);
  canvas.requestRenderAll();
  return line;
}

/**
 * Add SVG Icon or Badge to Canvas
 */
export async function addSvgIcon(
  canvas: fabric.Canvas,
  svgString: string,
  options: Record<string, unknown> = {}
): Promise<fabric.FabricObject> {
  const canvasW = canvas.width || 800;
  const canvasH = canvas.height || 600;

  // Use DataURL for highest SVG rendering fidelity across all browsers
  const encoded = encodeURIComponent(svgString);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`;

  const img = await fabric.FabricImage.fromURL(dataUrl);
  img.set({
    left: canvasW / 2 - ((img.width || 100) * (img.scaleX || 1)) / 2,
    top: canvasH / 2 - ((img.height || 100) * (img.scaleY || 1)) / 2,
    ...options,
  });

  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.requestRenderAll();
  return img;
}

/**
 * Add Text inside a Shape (Centered text)
 */
export function addTextInsideShape(
  canvas: fabric.Canvas,
  shape: fabric.FabricObject,
  initialText = 'Nhập văn bản...'
): fabric.Textbox {
  const bound = shape.getBoundingRect();
  const shapeWidth = bound.width;
  const targetWidth = Math.max(100, shapeWidth - 24);

  const textbox = new fabric.Textbox(initialText, {
    left: bound.left + (bound.width / 2) - (targetWidth / 2),
    top: bound.top + (bound.height / 2) - 16,
    width: targetWidth,
    fontSize: Math.min(24, Math.max(14, Math.round(bound.height / 4))),
    fontFamily: 'Inter',
    fill: shape.fill === '#ffffff' ? '#0f172a' : '#ffffff',
    textAlign: 'center',
    splitByGrapheme: false,
  });

  canvas.add(textbox);
  canvas.setActiveObject(textbox);
  const editableText = textbox as unknown as { enterEditing?: () => void; selectAll?: () => void };
  editableText.enterEditing?.();
  editableText.selectAll?.();
  canvas.requestRenderAll();
  return textbox;
}

/**
 * Fully synchronize and resize Fabric Canvas dimensions across all buffer, wrapper, and DOM elements
 */
export function resizeFabricCanvas(
  canvas: fabric.Canvas,
  width: number,
  height: number,
  bgColor?: string,
  gradientStops?: [string, string]
): void {
  canvas.setDimensions({ width, height });

  if (canvas.wrapperEl) {
    canvas.wrapperEl.style.width = `${width}px`;
    canvas.wrapperEl.style.height = `${height}px`;
  }
  if (canvas.lowerCanvasEl) {
    canvas.lowerCanvasEl.width = width;
    canvas.lowerCanvasEl.height = height;
    canvas.lowerCanvasEl.style.width = `${width}px`;
    canvas.lowerCanvasEl.style.height = `${height}px`;
  }
  if (canvas.upperCanvasEl) {
    canvas.upperCanvasEl.width = width;
    canvas.upperCanvasEl.height = height;
    canvas.upperCanvasEl.style.width = `${width}px`;
    canvas.upperCanvasEl.style.height = `${height}px`;
  }

  if (bgColor) {
    setCanvasBackground(canvas, bgColor, gradientStops);
  }

  canvas.calcOffset();
  canvas.requestRenderAll();
}

/**
 * Apply a structured Layout to the Canvas while preserving background & canvas dimensions
 */
export function applyLayoutToCanvas(
  canvas: fabric.Canvas,
  layout: DesignLayout,
  currentBgColor?: string,
  gradientStops?: [string, string]
): void {
  // Capture current background before clear
  const prevBg = canvas.backgroundColor;

  canvas.clear();

  // Preserve background!
  if (currentBgColor) {
    setCanvasBackground(canvas, currentBgColor, gradientStops);
  } else if (prevBg) {
    canvas.backgroundColor = prevBg;
  }

  const canvasW = canvas.width || 1280;
  const canvasH = canvas.height || 720;

  // Base canvas dimensions used in design layout template: 1280 x 720
  const scaleX = canvasW / 1280;
  const scaleY = canvasH / 720;

  layout.boxes.forEach((box) => {
    const left = Math.round(box.left * scaleX);
    const top = Math.round(box.top * scaleY);
    const width = Math.round(box.width * scaleX);
    const height = Math.round(box.height * scaleY);

    // Background frame
    const rect = new fabric.Rect({
      left,
      top,
      width,
      height,
      fill: box.fill,
      stroke: box.stroke,
      strokeWidth: 2,
      strokeDashArray: [8, 6],
      rx: 12,
      ry: 12,
    });

    // Centered label inside frame
    const label = new fabric.Textbox(box.label, {
      left: left + 20,
      top: top + height / 2 - 14,
      width: Math.max(60, width - 40),
      fontSize: Math.max(14, Math.min(22, Math.round(width / 20))),
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: box.stroke,
      textAlign: 'center',
      splitByGrapheme: false,
      selectable: false,
    });

    canvas.add(rect);
    canvas.add(label);
  });

  canvas.calcOffset();
  canvas.requestRenderAll();
}

/**
 * Add Image from URL or Base64/Blob
 */
export async function addImageFromUrl(
  canvas: fabric.Canvas,
  url: string,
  options: Record<string, unknown> = {}
): Promise<fabric.FabricImage> {
  const img = await fabric.FabricImage.fromURL(url, {
    crossOrigin: 'anonymous',
  });

  // Scale down if image is bigger than 50% of canvas
  const canvasW = canvas.width || 800;
  const canvasH = canvas.height || 600;
  let scale = 1;

  if (img.width && img.height) {
    const maxTargetW = canvasW * 0.6;
    const maxTargetH = canvasH * 0.6;
    const scaleW = maxTargetW / img.width;
    const scaleH = maxTargetH / img.height;
    scale = Math.min(1, Math.min(scaleW, scaleH));
  }

  img.set({
    left: canvasW / 2 - (img.width ? (img.width * scale) / 2 : 50),
    top: canvasH / 2 - (img.height ? (img.height * scale) / 2 : 50),
    scaleX: scale,
    scaleY: scale,
    ...options,
  });

  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.requestRenderAll();
  return img;
}

/**
 * Apply filters (Brightness, Contrast, Saturation, Blur, Hue, Presets) to FabricImage
 */
export async function applyImageAdjustments(
  image: fabric.FabricImage,
  adjustments: ImageAdjustments
): Promise<void> {
  const filters: fabric.filters.BaseFilter<string, Record<string, unknown>>[] = [];

  // Brightness: -1 to 1
  if (adjustments.brightness !== 0) {
    filters.push(new fabric.filters.Brightness({ brightness: adjustments.brightness }));
  }

  // Contrast: -1 to 1
  if (adjustments.contrast !== 0) {
    filters.push(new fabric.filters.Contrast({ contrast: adjustments.contrast }));
  }

  // Saturation: -1 to 1
  if (adjustments.saturation !== 0) {
    filters.push(new fabric.filters.Saturation({ saturation: adjustments.saturation }));
  }

  // Blur: 0 to 1
  if (adjustments.blur > 0) {
    filters.push(new fabric.filters.Blur({ blur: adjustments.blur }));
  }

  // Hue: -1 to 1
  if (adjustments.hue !== 0) {
    filters.push(new fabric.filters.HueRotation({ rotation: adjustments.hue }));
  }

  // Presets
  switch (adjustments.presetFilter) {
    case 'grayscale':
      filters.push(new fabric.filters.Grayscale());
      break;
    case 'sepia':
      filters.push(new fabric.filters.Sepia());
      break;
    case 'vintage':
      filters.push(new fabric.filters.Vintage());
      break;
    case 'polaroid':
      filters.push(new fabric.filters.Polaroid());
      break;
    case 'kodachrome':
      filters.push(new fabric.filters.Kodachrome());
      break;
    case 'blackwhite':
      filters.push(new fabric.filters.BlackWhite());
      break;
    case 'invert':
      filters.push(new fabric.filters.Invert());
      break;
    default:
      break;
  }

  image.filters = filters;
  image.applyFilters();
}

/**
 * Rotate object by angle delta (e.g. +90 or -90)
 */
export function rotateObject(canvas: fabric.Canvas, object: fabric.FabricObject, angleDelta: number) {
  const currentAngle = object.angle || 0;
  object.rotate((currentAngle + angleDelta + 360) % 360);
  canvas.requestRenderAll();
}

/**
 * Flip object horizontally or vertically
 */
export function flipObject(canvas: fabric.Canvas, object: fabric.FabricObject, direction: 'horizontal' | 'vertical') {
  if (direction === 'horizontal') {
    object.set('flipX', !object.flipX);
  } else {
    object.set('flipY', !object.flipY);
  }
  canvas.requestRenderAll();
}

/**
 * Bring forward / Send backward
 */
export function bringForward(canvas: fabric.Canvas, object: fabric.FabricObject) {
  canvas.bringObjectForward(object);
  canvas.requestRenderAll();
}

export function sendBackward(canvas: fabric.Canvas, object: fabric.FabricObject) {
  canvas.sendObjectBackwards(object);
  canvas.requestRenderAll();
}

export function bringToFront(canvas: fabric.Canvas, object: fabric.FabricObject) {
  canvas.bringObjectToFront(object);
  canvas.requestRenderAll();
}

export function sendToBack(canvas: fabric.Canvas, object: fabric.FabricObject) {
  canvas.sendObjectToBack(object);
  canvas.requestRenderAll();
}

/**
 * Duplicate active object
 */
export async function duplicateObject(canvas: fabric.Canvas, object: fabric.FabricObject): Promise<fabric.FabricObject> {
  const cloned = await object.clone();
  cloned.set({
    left: (object.left || 0) + 30,
    top: (object.top || 0) + 30,
  });
  canvas.add(cloned);
  canvas.setActiveObject(cloned);
  canvas.requestRenderAll();
  return cloned;
}

/**
 * Delete object
 */
export function deleteObject(canvas: fabric.Canvas, object: fabric.FabricObject) {
  canvas.remove(object);
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}

/**
 * Set Canvas Background (Solid, Transparent, or Gradient)
 */
export function setCanvasBackground(
  canvas: fabric.Canvas,
  color: string,
  gradientStops?: [string, string]
) {
  if (color === 'transparent' || color === '') {
    canvas.backgroundColor = '';
    canvas.requestRenderAll();
    return;
  }

  if (gradientStops && gradientStops.length === 2) {
    const width = canvas.width || 1280;
    const height = canvas.height || 720;
    const gradient = new fabric.Gradient({
      type: 'linear',
      gradientUnits: 'pixels',
      coords: {
        x1: 0,
        y1: 0,
        x2: width,
        y2: height,
      },
      colorStops: [
        { offset: 0, color: gradientStops[0] },
        { offset: 1, color: gradientStops[1] },
      ],
    });
    canvas.backgroundColor = gradient;
    canvas.requestRenderAll();
    return;
  }

  canvas.backgroundColor = color;
  canvas.requestRenderAll();
}

/**
 * Export canvas to image (PNG, JPEG, WebP)
 */
export function exportCanvasAsImage(
  canvas: fabric.Canvas,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 0.95,
  multiplier = 1
): string {
  const originalBg = canvas.backgroundColor;
  const isTransparent = !originalBg || originalBg === 'transparent' || originalBg === '';

  // JPEG cannot handle transparent alpha channels, temporarily use white background
  if (format === 'jpeg' && isTransparent) {
    canvas.backgroundColor = '#ffffff';
    canvas.requestRenderAll();
    const dataUrl = canvas.toDataURL({ format, quality, multiplier });
    canvas.backgroundColor = '';
    canvas.requestRenderAll();
    return dataUrl;
  }

  return canvas.toDataURL({
    format,
    quality,
    multiplier,
  });
}

/**
 * Export canvas to SVG string
 */
export function exportCanvasAsSVG(canvas: fabric.Canvas): string {
  return canvas.toSVG();
}

/**
 * Export canvas to PDF
 */
export async function exportCanvasAsPDF(
  canvas: fabric.Canvas,
  filename = 'design-export.pdf'
): Promise<void> {
  const width = canvas.width || 1280;
  const height = canvas.height || 720;
  const orientation = width >= height ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [width, height],
  });

  const imgData = canvas.toDataURL({
    format: 'png',
    multiplier: 1.5,
  });

  pdf.addImage(imgData, 'PNG', 0, 0, width, height);
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Export project file (.hubdesign JSON)
 */
export function exportProjectJson(canvas: fabric.Canvas, meta: DesignProjectMeta): string {
  const fabricJson = canvas.toObject();
  const hubDesign: HubDesignFile = {
    meta: {
      ...meta,
      updatedAt: new Date().toISOString(),
      dimensions: {
        width: canvas.width || 1280,
        height: canvas.height || 720,
      },
      backgroundColor: (canvas.backgroundColor as string) || '#0f172a',
    },
    fabricJson,
  };
  return JSON.stringify(hubDesign, null, 2);
}

/**
 * Load project file (.hubdesign JSON)
 */
export async function loadProjectJson(
  canvas: fabric.Canvas,
  hubDesign: HubDesignFile
): Promise<DesignProjectMeta> {
  canvas.clear();

  if (hubDesign.meta?.dimensions) {
    resizeFabricCanvas(
      canvas,
      hubDesign.meta.dimensions.width,
      hubDesign.meta.dimensions.height,
      hubDesign.meta.backgroundColor
    );
  } else if (hubDesign.meta?.backgroundColor) {
    setCanvasBackground(canvas, hubDesign.meta.backgroundColor);
  }

  if (hubDesign.fabricJson) {
    await canvas.loadFromJSON(hubDesign.fabricJson);
  }

  canvas.calcOffset();
  canvas.requestRenderAll();
  return hubDesign.meta;
}
