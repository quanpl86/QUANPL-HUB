import { jsPDF } from 'jspdf';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'));
  return Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          image.onload = () => resolve();
          image.onerror = () => resolve();
        }),
    ),
  );
}

function styleExportRoot(root: HTMLElement) {
  root.querySelectorAll('img').forEach((image) => {
    image.style.maxWidth = '100%';
    image.style.height = 'auto';
    image.style.display = 'block';
    image.style.margin = '12px auto';
  });
  root.querySelectorAll('table').forEach((table) => {
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
  });
  root.querySelectorAll('th, td').forEach((cell) => {
    const el = cell as HTMLElement;
    el.style.border = '1px solid #d4d4d8';
    el.style.padding = '6px 8px';
    el.style.fontSize = '13px';
  });
}

export async function exportHtmlToPdf(html: string, filename: string) {
  const html2canvas = (await import('html2canvas')).default;
  const mount = document.createElement('div');
  mount.setAttribute('data-pdf-export-root', 'true');
  mount.style.cssText = [
    'position:fixed',
    'left:-12000px',
    'top:0',
    'width:794px',
    'padding:36px 42px 48px',
    'background:#ffffff',
    'color:#18181b',
    'font-family:"Be Vietnam Pro",system-ui,-apple-system,sans-serif',
    'font-size:15px',
    'line-height:1.65',
    'z-index:-1',
  ].join(';');
  mount.innerHTML = html || '<p></p>';
  styleExportRoot(mount);
  document.body.appendChild(mount);

  try {
    await waitForImages(mount);
    const canvas = await html2canvas(mount, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
    });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const imgWidth = A4_WIDTH_MM;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeightPx = (A4_HEIGHT_MM * canvas.width) / imgWidth;

    if (imgHeight <= A4_HEIGHT_MM) {
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(filename);
      return;
    }

    let rendered = 0;
    let pageIndex = 0;
    while (rendered < canvas.height) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - rendered);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext('2d');
      if (!ctx) break;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(canvas, 0, rendered, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      const sliceHeightMm = (sliceHeight * imgWidth) / canvas.width;
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgWidth, sliceHeightMm);
      rendered += sliceHeight;
      pageIndex += 1;
    }

    pdf.save(filename);
  } finally {
    mount.remove();
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không tải được ảnh trang PDF.'));
    image.src = src;
  });
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign,
) {
  ctx.textAlign = align;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);

  let drawX = x;
  if (align === 'center') drawX = x + maxWidth / 2;
  if (align === 'right') drawX = x + maxWidth;

  lines.forEach((line, index) => {
    ctx.fillText(line, drawX, y + index * lineHeight);
  });
}

export async function exportPdfPages(
  pages: import('./types').PdfPageModel[],
  filename: string,
) {
  if (pages.length === 0) throw new Error('Không có trang để xuất.');

  const { jsPDF } = await import('jspdf');
  let pdf: InstanceType<typeof jsPDF> | null = null;

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const widthMm = page.width * (25.4 / 72);
    const heightMm = page.height * (25.4 / 72);
    const orientation = page.width >= page.height ? 'l' : 'p';

    if (!pdf) {
      pdf = new jsPDF({ unit: 'mm', format: [widthMm, heightMm], orientation });
    } else {
      pdf.addPage([widthMm, heightMm], orientation);
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(page.width * 2));
    canvas.height = Math.max(1, Math.round(page.height * 2));
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / page.width;
    const scaleY = canvas.height / page.height;

    if (page.background) {
      try {
        const background = await loadImage(page.background);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      } catch {
        // Keep white page if snapshot is missing.
      }
    }

    (page.patches || []).forEach((patch) => {
      ctx.fillStyle = patch.color || page.pageColor || '#ffffff';
      ctx.fillRect(patch.x * scaleX, patch.y * scaleY, patch.width * scaleX, patch.height * scaleY);
    });

    page.texts.forEach((box) => {
      if (!box.dirty && !box.deleted) return;
      const x = box.x * scaleX;
      const y = box.y * scaleY;
      const width = box.width * scaleX;
      const height = box.height * scaleY;
      ctx.fillStyle = box.highlight || box.background || '#ffffff';
      ctx.fillRect(x - 1, y - 1, width + 2, height + 2);
      if (box.deleted || !box.text.trim()) return;
      ctx.fillStyle = box.color || '#111111';
      const fontSize = box.fontSize * scaleY;
      ctx.font = `${box.italic ? 'italic ' : ''}${box.bold ? 'bold ' : ''}${fontSize}px ${box.fontFamily}`;
      ctx.textBaseline = 'top';
      wrapCanvasText(
        ctx,
        box.text,
        x,
        y + fontSize * 0.08,
        width,
        fontSize * 1.2,
        box.align === 'center' ? 'center' : box.align === 'right' ? 'right' : 'left',
      );
      if (box.underline || box.strike) {
        ctx.strokeStyle = box.color || '#111111';
        ctx.lineWidth = Math.max(1, fontSize * 0.06);
        if (box.underline) {
          ctx.beginPath();
          ctx.moveTo(x, y + fontSize * 1.05);
          ctx.lineTo(x + width, y + fontSize * 1.05);
          ctx.stroke();
        }
        if (box.strike) {
          ctx.beginPath();
          ctx.moveTo(x, y + fontSize * 0.55);
          ctx.lineTo(x + width, y + fontSize * 0.55);
          ctx.stroke();
        }
      }
    });

    for (const image of page.images) {
      if (image.deleted) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(image.x * scaleX, image.y * scaleY, image.width * scaleX, image.height * scaleY);
        continue;
      }
      if (!image.dirty && page.background) continue;
      try {
        const drawn = await loadImage(image.src);
        const x = image.x * scaleX;
        const y = image.y * scaleY;
        const width = image.width * scaleX;
        const height = image.height * scaleY;
        ctx.save();
        ctx.globalAlpha = image.opacity ?? 1;
        if (image.rotation) {
          ctx.translate(x + width / 2, y + height / 2);
          ctx.rotate((image.rotation * Math.PI) / 180);
          ctx.drawImage(drawn, -width / 2, -height / 2, width, height);
        } else {
          ctx.drawImage(drawn, x, y, width, height);
        }
        ctx.restore();
      } catch {
        // Skip broken image overlays.
      }
    }

    pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, widthMm, heightMm);
  }

  pdf?.save(filename);
}
