import { vectorize, type Config } from '@neplex/vectorizer';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ALLOWED_MODES = new Set(['spline', 'polygon']);
const ALLOWED_HIERARCHY = new Set(['stacked', 'cutout']);

type VectorizeOptions = {
  colorPrecision: number;
  filterSpeckle: number;
  spliceThreshold: number;
  pathPrecision: number;
  mode: 'spline' | 'polygon';
  cornerThreshold: number;
  lengthThreshold: number;
  hierarchical: 'stacked' | 'cutout';
  maxIterations: number;
  layerDifference: number;
};

function clampNumber(value: FormDataEntryValue | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function getTextOption(value: FormDataEntryValue | null, allowed: Set<string>, fallback: string) {
  const text = typeof value === 'string' ? value : fallback;
  return allowed.has(text) ? text : fallback;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Yêu cầu upload phải dùng multipart/form-data.' }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Vui lòng chọn một file ảnh hợp lệ.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Chỉ hỗ trợ PNG, JPG/JPEG và WebP.' }, { status: 415 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Ảnh vượt quá giới hạn 10MB.' }, { status: 413 });
    }

    const options: VectorizeOptions = {
      colorPrecision: clampNumber(formData.get('colorPrecision'), 6, 1, 8),
      filterSpeckle: clampNumber(formData.get('filterSpeckle'), 4, 0, 128),
      spliceThreshold: clampNumber(formData.get('spliceThreshold'), 45, 0, 180),
      pathPrecision: clampNumber(formData.get('pathPrecision'), 2, 0, 5),
      mode: getTextOption(formData.get('mode'), ALLOWED_MODES, 'spline') as VectorizeOptions['mode'],
      cornerThreshold: clampNumber(formData.get('cornerThreshold'), 60, 0, 180),
      lengthThreshold: clampNumber(formData.get('lengthThreshold'), 4, 0, 20),
      hierarchical: getTextOption(
        formData.get('hierarchical'),
        ALLOWED_HIERARCHY,
        'stacked'
      ) as VectorizeOptions['hierarchical'],
      maxIterations: clampNumber(formData.get('maxIterations'), 10, 1, 80),
      layerDifference: clampNumber(formData.get('layerDifference'), 16, 0, 255),
    };

    const vectorizerConfig: Config = {
      colorMode: 0,
      colorPrecision: options.colorPrecision,
      filterSpeckle: options.filterSpeckle,
      spliceThreshold: options.spliceThreshold,
      pathPrecision: options.pathPrecision,
      mode: options.mode === 'polygon' ? 1 : 2,
      cornerThreshold: options.cornerThreshold,
      lengthThreshold: options.lengthThreshold,
      hierarchical: options.hierarchical === 'cutout' ? 1 : 0,
      maxIterations: options.maxIterations,
      layerDifference: options.layerDifference,
    };

    const svg = await vectorize(Buffer.from(await file.arrayBuffer()), vectorizerConfig);

    return NextResponse.json({ svg });
  } catch (error) {
    console.error('Vectorize error:', error);
    return NextResponse.json(
      { error: 'Không thể vector hóa ảnh. Hãy thử ảnh nhỏ hơn hoặc giảm mức chi tiết.' },
      { status: 500 }
    );
  }
}
