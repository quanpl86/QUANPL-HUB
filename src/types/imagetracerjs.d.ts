declare module 'imagetracerjs' {
  export function imageToSVG(url: string, options?: any, callback?: (svgStr: string) => void): void;
  export function imagedataToSVG(imgd: ImageData, options?: any): string;
  export function appendSVGString(svgstr: string, parentid: string): void;
  // Add other methods if necessary
}
