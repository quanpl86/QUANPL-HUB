export type PdfFontInfo = {
  label: string;
  css: string;
  bold: boolean;
  italic: boolean;
  source: string;
};

export const SYSTEM_FONTS = [
  { label: 'Montserrat', css: 'Montserrat, Arial, sans-serif' },
  { label: 'Myriad Pro', css: 'Myriad Pro, Arial, sans-serif' },
  { label: 'Arial', css: 'Arial, Helvetica, sans-serif' },
  { label: 'Helvetica', css: 'Helvetica, Arial, sans-serif' },
  { label: 'Times New Roman', css: 'Times New Roman, Times, serif' },
  { label: 'Georgia', css: 'Georgia, serif' },
  { label: 'Verdana', css: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', css: 'Tahoma, sans-serif' },
  { label: 'Trebuchet MS', css: 'Trebuchet MS, sans-serif' },
  { label: 'Courier New', css: 'Courier New, Courier, monospace' },
  { label: 'Palatino', css: 'Palatino, Palatino Linotype, serif' },
  { label: 'Garamond', css: 'Garamond, serif' },
  { label: 'Impact', css: 'Impact, Haettenschweiler, sans-serif' },
  { label: 'Comic Sans MS', css: 'Comic Sans MS, cursive' },
  { label: 'Be Vietnam Pro', css: 'Be Vietnam Pro, sans-serif' },
  { label: 'Inter', css: 'Inter, sans-serif' },
  { label: 'Roboto', css: 'Roboto, sans-serif' },
  { label: 'Segoe UI', css: 'Segoe UI, sans-serif' },
  { label: 'Calibri', css: 'Calibri, sans-serif' },
  { label: 'Cambria', css: 'Cambria, serif' },
  { label: 'Century Gothic', css: 'Century Gothic, sans-serif' },
  { label: 'Franklin Gothic', css: 'Franklin Gothic Medium, sans-serif' },
] as const;

const FAMILY_ALIASES: Record<string, string> = {
  montserrat: 'Montserrat, Arial, sans-serif',
  myriad: 'Myriad Pro, Arial, sans-serif',
  'myriad pro': 'Myriad Pro, Arial, sans-serif',
  'myriadpro': 'Myriad Pro, Arial, sans-serif',
  arial: 'Arial, Helvetica, sans-serif',
  helvetica: 'Helvetica, Arial, sans-serif',
  'times new roman': 'Times New Roman, Times, serif',
  times: 'Times New Roman, Times, serif',
  timesroman: 'Times New Roman, Times, serif',
  georgia: 'Georgia, serif',
  verdana: 'Verdana, Geneva, sans-serif',
  tahoma: 'Tahoma, sans-serif',
  trebuchet: 'Trebuchet MS, sans-serif',
  'trebuchet ms': 'Trebuchet MS, sans-serif',
  courier: 'Courier New, Courier, monospace',
  'courier new': 'Courier New, Courier, monospace',
  couriernew: 'Courier New, Courier, monospace',
  palatino: 'Palatino, Palatino Linotype, serif',
  garamond: 'Garamond, serif',
  impact: 'Impact, Haettenschweiler, sans-serif',
  comic: 'Comic Sans MS, cursive',
  'comic sans ms': 'Comic Sans MS, cursive',
  roboto: 'Roboto, sans-serif',
  inter: 'Inter, sans-serif',
  calibri: 'Calibri, sans-serif',
  cambria: 'Cambria, serif',
  segoe: 'Segoe UI, sans-serif',
  'segoe ui': 'Segoe UI, sans-serif',
  'be vietnam': 'Be Vietnam Pro, sans-serif',
  'be vietnam pro': 'Be Vietnam Pro, sans-serif',
  'century gothic': 'Century Gothic, sans-serif',
  gothic: 'Century Gothic, sans-serif',
  franklin: 'Franklin Gothic Medium, sans-serif',
  noto: 'Arial, Helvetica, sans-serif',
};

function splitCamel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parsePdfFontName(raw: string): PdfFontInfo {
  const source = String(raw || '').trim() || 'Unknown';
  const stripped = source.replace(/^[A-Z0-9]{4,}\+/, '').replace(/,#.*$/, '');
  const lower = stripped.toLowerCase();
  const bold = /bold|black|heavy|semibold|demibold|extrabold/.test(lower);
  const italic = /italic|oblique/.test(lower);

  const familyRaw = stripped
    .replace(/[-,]?(Bold|Italic|Oblique|Regular|Medium|Light|Black|SemiBold|DemiBold|ExtraBold|Roman)*MT$/gi, '')
    .replace(/PSMT$|PS$/i, '')
    .replace(/[-_](Bold|Italic|Oblique|Regular|Medium|Light|Black|SemiBold|Demi|Roman).*$/i, '')
    .replace(/Bold$|Italic$|Oblique$|Regular$|Medium$/i, '');

  const family = splitCamel(familyRaw) || 'Arial';
  const aliasKey = family.toLowerCase();
  const css = FAMILY_ALIASES[aliasKey] || FAMILY_ALIASES[aliasKey.replace(/\s+/g, '')] || `"${family}", Arial, sans-serif`;
  const label = `${family}${bold ? ' Bold' : ''}${italic ? ' Italic' : ''}`.trim();

  return { label, css, bold, italic, source };
}

export function fontPickerOptions(detected: string[]) {
  const extras = detected
    .filter(Boolean)
    .filter((css, index, list) => list.indexOf(css) === index)
    .filter((css) => !SYSTEM_FONTS.some((font) => font.css === css))
    .map((css) => ({ label: css.split(',')[0].replace(/['"]/g, ''), css }));

  return {
    detected: extras,
    system: SYSTEM_FONTS,
  };
}
