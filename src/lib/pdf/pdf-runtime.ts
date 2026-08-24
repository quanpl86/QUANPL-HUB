const LOCAL_WORKER_SRC = '/pdf.worker.min.mjs';

type PdfJsModule = typeof import('pdfjs-dist');

let pdfjsPromise: Promise<PdfJsModule> | null = null;

export function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = LOCAL_WORKER_SRC;
      return pdfjsLib;
    });
  }
  return pdfjsPromise;
}
