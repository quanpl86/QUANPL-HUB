export type PdfTextAlign = 'left' | 'center' | 'right';

export type PdfTextBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  sourceFont: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  color: string;
  highlight: string;
  align: PdfTextAlign;
  background: string;
  dirty: boolean;
  deleted: boolean;
  layer?: number;
};

export type PdfImageBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  rotation: number;
  opacity: number;
  dirty: boolean;
  deleted: boolean;
  layer?: number;
};

export type PdfPatch = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

export type PdfPageModel = {
  pageNumber: number;
  width: number;
  height: number;
  background: string;
  pageColor: string;
  texts: PdfTextBox[];
  images: PdfImageBox[];
  patches: PdfPatch[];
};

export type ImportedPdfDocument = {
  pages: PdfPageModel[];
  pageCount: number;
  title: string;
  textCharacters: number;
};
