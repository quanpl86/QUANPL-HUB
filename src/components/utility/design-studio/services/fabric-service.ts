import * as fabric from 'fabric';
import { ImageAdjustments, HubDesignFile, DesignProjectMeta } from '@/types/design-studio';
import jsPDF from 'jspdf';

/**
 * Configure default styling for Fabric controls (bounding box, rotation and scale handles)
 */
export function configureFabricDefaults() {
  fabric.FabricObject.ownDefaults = {
    ...fabric.FabricObject.ownDefaults,
    transparentCorners: false,
    cornerColor: '#10b981',
    cornerStrokeColor: '#064e3b',
    borderColor: '#10b981',
    cornerSize: 10,
    cornerStyle: 'circle',
    borderScaleFactor: 1.5,
    padding: 6,
  };
}

/**
 * Create a new Textbox
 */
export function addText(
  canvas: fabric.Canvas,
  text = 'Nội dung văn bản',
  options: Record<string, unknown> = {}
): fabric.Textbox {
  const textbox = new fabric.Textbox(text, {
    left: canvas.width ? canvas.width / 2 - 150 : 100,
    top: canvas.height ? canvas.height / 2 - 25 : 100,
    width: 300,
    fontSize: 32,
    fontFamily: 'Inter',
    fill: '#ffffff',
    textAlign: 'center',
    splitByGrapheme: true,
    ...options,
  });

  canvas.add(textbox);
  canvas.setActiveObject(textbox);
  canvas.requestRenderAll();
  return textbox;
}

/**
 * Add Rectangle
 */
export function addRect(
  canvas: fabric.Canvas,
  options: Record<string, unknown> = {}
): fabric.Rect {
  const rect = new fabric.Rect({
    left: canvas.width ? canvas.width / 2 - 100 : 100,
    top: canvas.height ? canvas.height / 2 - 75 : 100,
    width: 200,
    height: 150,
    fill: '#10b981',
    rx: 8,
    ry: 8,
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
  const circle = new fabric.Circle({
    left: canvas.width ? canvas.width / 2 - 75 : 100,
    top: canvas.height ? canvas.height / 2 - 75 : 100,
    radius: 75,
    fill: '#38bdf8',
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
  const triangle = new fabric.Triangle({
    left: canvas.width ? canvas.width / 2 - 75 : 100,
    top: canvas.height ? canvas.height / 2 - 75 : 100,
    width: 150,
    height: 130,
    fill: '#f59e0b',
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
  const line = new fabric.Line(
    [
      canvas.width ? canvas.width / 2 - 100 : 50,
      canvas.height ? canvas.height / 2 : 100,
      canvas.width ? canvas.width / 2 + 100 : 250,
      canvas.height ? canvas.height / 2 : 100,
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
 * Export canvas to image (PNG, JPEG, WebP)
 */
export function exportCanvasAsImage(
  canvas: fabric.Canvas,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 0.95,
  multiplier = 1
): string {
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
    canvas.setDimensions({
      width: hubDesign.meta.dimensions.width,
      height: hubDesign.meta.dimensions.height,
    });
  }

  if (hubDesign.meta?.backgroundColor) {
    canvas.backgroundColor = hubDesign.meta.backgroundColor;
  }

  if (hubDesign.fabricJson) {
    await canvas.loadFromJSON(hubDesign.fabricJson);
  }

  canvas.requestRenderAll();
  return hubDesign.meta;
}
