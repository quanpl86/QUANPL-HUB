export type ToolTab = 'templates' | 'layouts' | 'background' | 'text' | 'shapes' | 'stickers' | 'images' | 'ai';

export interface CanvasDimensions {
  width: number;
  height: number;
  name: string;
}

export interface PresetSize {
  name: string;
  width: number;
  height: number;
  description: string;
  aspectRatio: string;
  icon?: string;
}

export interface ImageAdjustments {
  brightness: number; // -1 to 1 (0 default)
  contrast: number;   // -1 to 1 (0 default)
  saturation: number; // -1 to 1 (0 default)
  blur: number;       // 0 to 1 (0 default)
  hue: number;        // -1 to 1 (0 default)
  presetFilter: string; // 'none' | 'grayscale' | 'sepia' | 'vintage' | 'polaroid' | 'kodachrome' | 'blackwhite' | 'invert'
}

export interface DesignProjectMeta {
  version: string;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  dimensions: {
    width: number;
    height: number;
  };
  backgroundColor: string;
}

export interface HubDesignFile {
  meta: DesignProjectMeta;
  fabricJson: Record<string, unknown>;
}

export interface DesignTemplate {
  id: string;
  name: string;
  category: 'stem' | 'robotics' | 'certificate' | 'thumbnail' | 'social';
  dimensions: { width: number; height: number };
  thumbnail: string;
  description: string;
  data: Record<string, unknown>; // Fabric JSON representation
}

export interface DesignLayout {
  id: string;
  name: string;
  description: string;
  icon: string;
  boxes: Array<{
    left: number;
    top: number;
    width: number;
    height: number;
    label: string;
    fill: string;
    stroke: string;
  }>;
}

export interface StickerItem {
  id: string;
  name: string;
  category: 'lucide' | 'badge' | 'stem' | 'ribbon' | 'education' | 'arrow' | 'ui' | 'science';
  tags?: string[];
  svg: string;
  paths?: string;
}

export type ShapeType =
  | 'rect'
  | 'rounded-rect'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'heart'
  | 'hexagon'
  | 'pentagon'
  | 'octagon'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-double'
  | 'speech-bubble'
  | 'thought-bubble'
  | 'lightning'
  | 'badge-ribbon'
  | 'cross'
  | 'line'
  | 'dashed-line'
  | 'arrow-line';

export interface VectorShapeItem {
  id: string;
  name: string;
  category: 'flowchart' | 'stem' | 'arrows' | 'badges';
  svg: string;
}

export type DrawingTool = 'brush' | 'eraser';
export type BrushType = 'pencil' | 'highlighter' | 'circle' | 'spray';
export type BrushLineCap = 'round' | 'square' | 'butt';
export type BrushDashStyle = 'solid' | 'dashed' | 'dotted';
export type EraserType = 'brush' | 'stroke';

export interface DrawingSettings {
  isDrawingMode: boolean;
  tool: DrawingTool;
  brushType: BrushType;
  color: string;
  opacity: number; // 0.05 to 1.0 (5% - 100%)
  width: number;   // 1 to 100
  lineCap: BrushLineCap;
  dashStyle: BrushDashStyle;
  eraserType: EraserType;
  eraserWidth: number; // 2 to 120
}

