export type InfographicLayout = {
  type: "rubric_matrix" | "workflow_steps" | "comparison" | "scene";
  rows?: number;
  columns?: number;
};

export type InfographicSpec = {
  visual_goal?: string;
  required_labels?: string[];
  must_show?: string[];
  layout?: InfographicLayout;
  text_language?: string;
};

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLabel(text: string, max = 28): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function tspans(lines: string[], x: number, y: number, size = 18, fill = "#1a1a1a"): string {
  return lines
    .map((line, index) =>
      `<tspan x="${x}" y="${y + index * (size + 6)}" font-size="${size}" fill="${fill}">${xml(line)}</tspan>`
    )
    .join("");
}

function svgShell(inner: string, width = 1600, height = 900): Buffer {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#fffaf5"/>
  ${inner}
</svg>`;
  return Buffer.from(svg, "utf8");
}

export function shouldRenderInfographic(input: {
  purpose: string;
  required_labels?: string[];
  layout_spec?: InfographicLayout;
  text_accuracy_required?: boolean;
  text_policy?: string;
}): boolean {
  if (input.text_policy === "optional_text" || input.text_policy === "no_text") return false;
  const labels = input.required_labels?.filter(Boolean) || [];
  const type = input.layout_spec?.type;
  if (type === "scene") return false;
  if (type === "rubric_matrix" || type === "workflow_steps" || type === "comparison") return labels.length > 0;
  if (input.text_accuracy_required && labels.length > 0) return true;
  if (["workflow", "comparison", "explainer", "rubric", "timeline", "table", "framework"].includes(input.purpose) && labels.length > 0) return true;
  return false;
}

export function assertInfographicContract(input: {
  purpose: string;
  required_labels?: string[];
  layout_spec?: InfographicLayout;
}): void {
  if (!["workflow", "comparison", "explainer", "rubric", "timeline", "table", "framework"].includes(input.purpose)) return;
  const labels = input.required_labels?.filter((item) => item.trim()) || [];
  if (!labels.length) {
    throw new Error(
      `QUALITY_GATE_FAILED: IMAGE_LAYOUT_REQUIRED: purpose=${input.purpose} needs required_labels and layout_spec. Server renders exact Vietnamese text as SVG. Do not ask Flux to draw readable text.`
    );
  }
}

export function renderInfographicSvg(spec: InfographicSpec): Buffer {
  const type = spec.layout?.type || "workflow_steps";
  const labels = (spec.required_labels || []).map((item) => item.trim()).filter(Boolean);
  if (type === "rubric_matrix") return renderRubric(spec.visual_goal, labels, spec.layout?.rows, spec.layout?.columns);
  if (type === "comparison") return renderComparison(spec.visual_goal, labels);
  return renderWorkflow(spec.visual_goal, labels);
}

function renderWorkflow(title: string | undefined, labels: string[]): Buffer {
  const steps = labels.slice(0, 6);
  const boxW = Math.min(280, Math.floor(1400 / Math.max(steps.length, 1)) - 20);
  const startX = (1600 - (steps.length * (boxW + 40) - 40)) / 2;
  const boxes = steps.map((label, index) => {
    const x = startX + index * (boxW + 40);
    const y = 320;
    const lines = wrapLabel(label, 18);
    const arrow =
      index < steps.length - 1
        ? `<polygon points="${x + boxW + 6},365 ${x + boxW + 34},380 ${x + boxW + 6},395" fill="#f97316"/>`
        : "";
    return `
      <rect x="${x}" y="${y}" width="${boxW}" height="180" rx="12" fill="#ffffff" stroke="#f97316" stroke-width="3"/>
      <circle cx="${x + 28}" cy="${y + 28}" r="18" fill="#f97316"/>
      <text x="${x + 28}" y="${y + 34}" text-anchor="middle" font-size="20" font-weight="700" fill="#ffffff" font-family="Arial, sans-serif">${index + 1}</text>
      <text font-family="Arial, sans-serif" font-weight="600">${tspans(lines, x + 20, y + 78, 18)}</text>
      ${arrow}
    `;
  }).join("");
  const heading = wrapLabel(title || "Quy trình", 48);
  return svgShell(`
    <text font-family="Arial, sans-serif" font-weight="700">${tspans(heading, 80, 80, 36, "#111111")}</text>
    ${boxes}
  `);
}

function renderRubric(title: string | undefined, labels: string[], rows = 3, columns = 4): Buffer {
  const rowCount = Math.max(1, rows || 3);
  const colCount = Math.max(2, columns || 4);
  const rowHeaders = labels.slice(0, rowCount);
  const colHeaders = labels.slice(rowCount, rowCount + colCount);
  const startX = 360;
  const startY = 180;
  const colW = Math.floor(1180 / colCount);
  const rowH = Math.floor(640 / rowCount);
  const headerCells = colHeaders.map((label, index) => {
    const x = startX + index * colW;
    return `
      <rect x="${x}" y="${startY - 88}" width="${colW - 10}" height="78" rx="8" fill="#f97316"/>
      <text font-family="Arial, sans-serif" font-weight="700">${tspans(wrapLabel(label, 16), x + 12, startY - 56, 16, "#ffffff")}</text>
    `;
  }).join("");
  const body = rowHeaders.map((label, row) => {
    const y = startY + row * rowH;
    const cells = Array.from({ length: colCount }, (_, col) => {
      const x = startX + col * colW;
      return `<rect x="${x}" y="${y}" width="${colW - 10}" height="${rowH - 12}" rx="8" fill="#ffffff" stroke="#f3d0b8" stroke-width="2"/>`;
    }).join("");
    return `
      <rect x="48" y="${y}" width="300" height="${rowH - 12}" rx="8" fill="#fff1e6" stroke="#f97316" stroke-width="2"/>
      <text font-family="Arial, sans-serif" font-weight="600">${tspans(wrapLabel(label, 22), 64, y + 36, 18)}</text>
      ${cells}
    `;
  }).join("");
  const heading = wrapLabel(title || "Bảng tiêu chí", 48);
  return svgShell(`
    <text font-family="Arial, sans-serif" font-weight="700">${tspans(heading, 48, 64, 32, "#111111")}</text>
    ${headerCells}
    ${body}
  `);
}

function renderComparison(title: string | undefined, labels: string[]): Buffer {
  const mid = Math.ceil(labels.length / 2);
  const left = labels.slice(0, mid);
  const right = labels.slice(mid);
  const list = (items: string[], x: number) =>
    items.map((item, index) =>
      `<text font-family="Arial, sans-serif">${tspans(wrapLabel(`• ${item}`, 32), x, 240 + index * 90, 22)}</text>`
    ).join("");
  const heading = wrapLabel(title || "So sánh", 48);
  return svgShell(`
    <text font-family="Arial, sans-serif" font-weight="700">${tspans(heading, 80, 70, 32, "#111111")}</text>
    <rect x="70" y="150" width="700" height="680" rx="16" fill="#ffffff" stroke="#f97316" stroke-width="3"/>
    <rect x="830" y="150" width="700" height="680" rx="16" fill="#ffffff" stroke="#f97316" stroke-width="3"/>
    ${list(left, 100)}
    ${list(right, 860)}
  `);
}
