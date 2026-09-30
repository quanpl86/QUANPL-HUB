export type ToolTab = 'templates' | 'text' | 'shapes' | 'images' | 'filters' | 'ai';

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
