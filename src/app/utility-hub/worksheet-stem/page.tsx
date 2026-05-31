'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Bot,
  Check,
  Clipboard,
  Download,
  FileJson,
  FileSpreadsheet,
  Heart,
  Key,
  Layers3,
  Loader2,
  Medal,
  Plus,
  RotateCcw,
  Smile,
  Sparkles,
  Star,
  Settings,
  Table2,
  Trash2,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Criterion = {
  id: string;
  name: string;
  description: string;
  bloom: string;
  standard: string;
  weight: number;
  levels: [string, string, string, string];
};

type DisplayMode = 'standard' | 'stickers';
type StickerKey = 'star' | 'award' | 'badge' | 'trophy' | 'medal' | 'sparkles' | 'smile' | 'heart';
type CurriculumTrack = 'international' | 'vietnam';

type StickerOption = {
  key: StickerKey;
  label: string;
  description: string;
  markdownSymbol: string;
  Icon: LucideIcon;
};

type RubricSuggestion = {
  title: string;
  rationale: string;
  criteria: Criterion[];
};

const curriculumTracks: Record<CurriculumTrack, {
  label: string;
  description: string;
  defaultStandards: string;
}> = {
  international: {
    label: 'Chuẩn quốc tế',
    description: 'Bloom, NGSS, ISTE, CSTA; phù hợp STEM/PBL quốc tế, LMS và GitHub Classroom.',
    defaultStandards: 'Bloom Taxonomy; NGSS Science & Engineering Practices; ISTE Standards; CSTA Computer Science Standards.',
  },
  vietnam: {
    label: 'Chuẩn Việt Nam',
    description: 'Bám GDPT 2018, định hướng STEM, năng lực số 2025 và ngữ cảnh trường phổ thông Việt Nam.',
    defaultStandards: 'Chương trình GDPT 2018; phẩm chất và năng lực cốt lõi; năng lực tin học/công nghệ; Khung năng lực số ban hành năm 2025; hoạt động trải nghiệm và định hướng giáo dục STEM Việt Nam.',
  },
};

const defaultCriteria: Criterion[] = [
  {
    id: 'conceptual',
    name: 'Conceptual Understanding',
    description: 'Hiểu đúng khái niệm STEM cốt lõi, giải thích được nguyên lý và giới hạn của giải pháp.',
    bloom: 'Analyze / Explain',
    standard: 'NGSS Practice 6',
    weight: 25,
    levels: [
      'Giải thích sai hoặc rời rạc, thiếu liên hệ với hiện tượng thực tế.',
      'Nêu được ý chính nhưng còn thiếu bằng chứng hoặc ví dụ kiểm chứng.',
      'Giải thích đúng khái niệm, có ví dụ và liên hệ với yêu cầu dự án.',
      'Phân tích sâu, chỉ ra trade-off và dùng bằng chứng để bảo vệ lựa chọn.',
    ],
  },
  {
    id: 'functionality',
    name: 'Functionality & Testing',
    description: 'Sản phẩm hoạt động ổn định, có kiểm thử, có ghi nhận lỗi và cải tiến.',
    bloom: 'Apply / Evaluate',
    standard: 'CSTA 2-CS-03',
    weight: 30,
    levels: [
      'Prototype chưa chạy được hoặc không có kiểm thử rõ ràng.',
      'Chạy được một phần, kiểm thử còn thủ công và thiếu dữ liệu.',
      'Hoạt động đúng yêu cầu chính, có test case và kết quả đo lường.',
      'Ổn định, có kiểm thử lặp lại, log lỗi và phương án tối ưu tiếp theo.',
    ],
  },
  {
    id: 'design',
    name: 'Design & Iteration',
    description: 'Thiết kế có mục tiêu rõ, biết lặp lại dựa trên phản hồi và ràng buộc thực tế.',
    bloom: 'Create / Iterate',
    standard: 'ISTE 4.4',
    weight: 25,
    levels: [
      'Thiết kế thiếu mục tiêu, không thể hiện quá trình cải tiến.',
      'Có ý tưởng thiết kế nhưng ít bằng chứng về thử nghiệm và chỉnh sửa.',
      'Có bản thiết kế, prototype, phản hồi và ít nhất một vòng cải tiến.',
      'Thiết kế chặt chẽ, tối ưu theo constraint và trình bày rõ quyết định kỹ thuật.',
    ],
  },
  {
    id: 'collaboration',
    name: 'Collaboration & Reflection',
    description: 'Làm việc nhóm, phân vai, phản tư và trình bày được bài học rút ra.',
    bloom: 'Reflect / Communicate',
    standard: 'ISTE 1.7',
    weight: 20,
    levels: [
      'Phân vai mờ, phản tư chung chung hoặc thiếu bằng chứng đóng góp.',
      'Có phân công nhưng phối hợp chưa đều, phản tư còn mô tả sự kiện.',
      'Phối hợp rõ, trình bày được đóng góp cá nhân và bài học cải tiến.',
      'Có bằng chứng cộng tác mạnh, phản tư sâu và đề xuất bước phát triển tiếp.',
    ],
  },
];

const levelLabels = ['1 - Cần hỗ trợ', '2 - Đạt cơ bản', '3 - Thành thạo', '4 - Xuất sắc'] as const;

const stickerOptions: StickerOption[] = [
  {
    key: 'star',
    label: 'Sao',
    description: 'Phù hợp đánh giá nhanh cho học sinh tiểu học.',
    markdownSymbol: '★',
    Icon: Star,
  },
  {
    key: 'badge',
    label: 'Huy hiệu',
    description: 'Dùng cho nhiệm vụ hoàn thành theo cấp độ.',
    markdownSymbol: '✓',
    Icon: BadgeCheck,
  },
  {
    key: 'trophy',
    label: 'Cúp',
    description: 'Nhấn mạnh thành tích và thử thách.',
    markdownSymbol: '🏆',
    Icon: Trophy,
  },
  {
    key: 'award',
    label: 'Giải thưởng',
    description: 'Hợp rubric dự án hoặc trình bày sản phẩm.',
    markdownSymbol: '◎',
    Icon: Award,
  },
  {
    key: 'medal',
    label: 'Huy chương',
    description: 'Tốt cho milestone học tập theo chặng.',
    markdownSymbol: '●',
    Icon: Medal,
  },
  {
    key: 'sparkles',
    label: 'Lấp lánh',
    description: 'Tạo cảm giác vui, nhẹ, thân thiện.',
    markdownSymbol: '✦',
    Icon: Sparkles,
  },
  {
    key: 'smile',
    label: 'Mặt cười',
    description: 'Phù hợp phản hồi tích cực, ít áp lực.',
    markdownSymbol: '☺',
    Icon: Smile,
  },
  {
    key: 'heart',
    label: 'Trái tim',
    description: 'Dùng cho thái độ, hợp tác và phản tư.',
    markdownSymbol: '♥',
    Icon: Heart,
  },
];

function createCriterion(): Criterion {
  const id = `criterion-${Date.now()}`;
  return {
    id,
    name: 'Tiêu chí mới',
    description: 'Mô tả ngắn tiêu chí đánh giá.',
    bloom: 'Apply',
    standard: 'Custom',
    weight: 10,
    levels: [
      'Chưa đạt yêu cầu.',
      'Đạt một phần yêu cầu.',
      'Đạt yêu cầu chính.',
      'Vượt yêu cầu và có bằng chứng thuyết phục.',
    ],
  };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'stem-rubric';
}

function csvEscape(value: string | number) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function extractJsonObject(text: string) {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI không trả về JSON hợp lệ.');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeSuggestionCriteria(input: unknown): Criterion[] {
  if (!Array.isArray(input)) return [];

  return input.slice(0, 8).map((item, index) => {
    const source = item as Partial<Criterion> & Record<string, unknown>;
    const rawLevels = Array.isArray(source.levels) ? source.levels : [];
    const levels = [0, 1, 2, 3].map((levelIndex) => {
      const value = rawLevels[levelIndex];
      return typeof value === 'string' && value.trim()
        ? value.trim()
        : `Mức ${levelIndex + 1}: mô tả bằng chứng đánh giá.`;
    }) as Criterion['levels'];

    return {
      id: typeof source.id === 'string' && source.id ? source.id : `ai-criterion-${Date.now()}-${index}`,
      name: typeof source.name === 'string' && source.name ? source.name.trim() : `Tiêu chí ${index + 1}`,
      description: typeof source.description === 'string' ? source.description.trim() : 'Mô tả tiêu chí đánh giá.',
      bloom: typeof source.bloom === 'string' ? source.bloom.trim() : 'Apply',
      standard: typeof source.standard === 'string' ? source.standard.trim() : 'Custom',
      weight: Number(source.weight) > 0 ? Number(source.weight) : 25,
      levels,
    };
  });
}

const geminiModelGroups = [
  {
    label: 'Thế hệ 3.x (Mới nhất 2026)',
    models: [
      ['gemini-3.5-flash', 'Gemini 3.5 Flash (SOTA)'],
      ['gemini-3.1-pro-preview', 'Gemini 3.1 Pro Preview (Suy luận chuyên sâu)'],
      ['gemini-3.1-flash-lite', 'Gemini 3.1 Flash Lite (Tiết kiệm, Tốc độ cao)'],
      ['gemini-3-flash-preview', 'Gemini 3 Flash Preview'],
    ],
  },
  {
    label: 'Aliases (Luôn cập nhật)',
    models: [
      ['gemini-pro-latest', 'Gemini Pro Latest'],
      ['gemini-flash-latest', 'Gemini Flash Latest'],
      ['gemini-flash-lite-latest', 'Gemini Flash-Lite Latest'],
    ],
  },
  {
    label: 'Thế hệ 2.x',
    models: [
      ['gemini-2.5-flash', 'Gemini 2.5 Flash'],
      ['gemini-2.5-pro', 'Gemini 2.5 Pro'],
      ['gemini-2.0-flash', 'Gemini 2.0 Flash'],
      ['gemini-2.0-flash-lite-preview-02-05', 'Gemini 2.0 Flash-Lite'],
      ['gemini-2.0-pro-exp-02-05', 'Gemini 2.0 Pro Experimental'],
    ],
  },
  {
    label: 'Thế hệ 1.5 (Cổ điển)',
    models: [
      ['gemini-1.5-flash', 'Gemini 1.5 Flash'],
      ['gemini-1.5-pro', 'Gemini 1.5 Pro'],
      ['gemini-1.5-flash-8b', 'Gemini 1.5 Flash-8B'],
    ],
  },
];

export default function WorksheetStemPage() {
  const [title, setTitle] = useState('Template Rubric STEM: Map Bloom -> NGSS -> ISTE -> CSTA');
  const [projectContext, setProjectContext] = useState('Dùng cho dự án STEM/PBL 5E, chấm prototype kỹ thuật, lesson plan hoặc sản phẩm học sinh.');
  const [audience, setAudience] = useState('Giáo viên STEM, trainer, admin LMS, curriculum designer');
  const [curriculumTrack, setCurriculumTrack] = useState<CurriculumTrack>('international');
  const [gradeBand, setGradeBand] = useState('Tiểu học / THCS / THPT tùy bài học');
  const [standardsContext, setStandardsContext] = useState(curriculumTracks.international.defaultStandards);
  const [criteria, setCriteria] = useState<Criterion[]>(defaultCriteria);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('standard');
  const [selectedSticker, setSelectedSticker] = useState<StickerKey>('star');
  const [copied, setCopied] = useState<'markdown' | 'json' | 'csv' | null>(null);
  const [apiKey, setApiKey] = useState(() => (
    typeof window === 'undefined' ? '' : localStorage.getItem('gemini_api_key') || ''
  ));
  const [aiModel, setAiModel] = useState(() => (
    typeof window === 'undefined' ? 'gemini-3.1-flash-lite' : localStorage.getItem('gemini_model') || 'gemini-3.1-flash-lite'
  ));
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [rubricSuggestions, setRubricSuggestions] = useState<RubricSuggestion[]>([]);

  const selectedStickerOption = useMemo(
    () => stickerOptions.find((option) => option.key === selectedSticker) || stickerOptions[0],
    [selectedSticker],
  );

  const selectedCurriculumTrack = curriculumTracks[curriculumTrack];

  const handleSaveAiConfig = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    localStorage.setItem('gemini_model', aiModel);
    setShowAiSettings(false);
  };

  const totalWeight = useMemo(
    () => criteria.reduce((sum, criterion) => sum + Number(criterion.weight || 0), 0),
    [criteria],
  );

  const normalizedCriteria = useMemo(() => criteria.map((criterion) => ({
    ...criterion,
    normalizedWeight: totalWeight ? Math.round((criterion.weight / totalWeight) * 100) : 0,
  })), [criteria, totalWeight]);

  const markdownOutput = useMemo(() => {
    const formatLevel = (level: string, index: number) => {
      if (displayMode !== 'stickers') return level;
      return `${selectedStickerOption.markdownSymbol.repeat(index + 1)} ${level}`;
    };

    const rows = normalizedCriteria.map((criterion) => [
      criterion.name,
      criterion.bloom,
      criterion.standard,
      `${criterion.weight} điểm (${criterion.normalizedWeight}%)`,
      ...criterion.levels.map(formatLevel),
    ]);

    const table = [
      '| Tiêu chí | Bloom | Chuẩn | Trọng số | Mức 1 | Mức 2 | Mức 3 | Mức 4 |',
      '| --- | --- | --- | ---: | --- | --- | --- | --- |',
      ...rows.map((row) => `| ${row.map((cell) => String(cell).replace(/\|/g, '/')).join(' | ')} |`),
    ].join('\n');

    return `# ${title}

### ${projectContext}

**Đối tượng sử dụng:** ${audience}
**Hệ chuẩn chương trình:** ${selectedCurriculumTrack.label}
**Cấp/lớp áp dụng:** ${gradeBand}
**Chuẩn/năng lực bám theo:** ${standardsContext}

## Rubric đánh giá

**Kiểu hiển thị:** ${displayMode === 'stickers' ? `Sticker tiểu học - ${selectedStickerOption.label}` : 'Mặc định'}

${table}

## Hướng dẫn sử dụng nhanh

- Tổng trọng số hiện tại: ${totalWeight} điểm.
- Có thể import bảng này vào LMS, GitHub Classroom hoặc copy vào bài viết KING DRAGON HUB.
- Khi chấm điểm, dùng mức 1-4 cho từng tiêu chí rồi nhân theo trọng số.
`;
  }, [audience, displayMode, gradeBand, normalizedCriteria, projectContext, selectedCurriculumTrack.label, selectedStickerOption, standardsContext, title, totalWeight]);

  const jsonOutput = useMemo(() => JSON.stringify({
    title,
    projectContext,
    audience,
    curriculumTrack,
    curriculumTrackLabel: selectedCurriculumTrack.label,
    gradeBand,
    standardsContext,
    displayMode,
    sticker: displayMode === 'stickers' ? {
      key: selectedStickerOption.key,
      label: selectedStickerOption.label,
      markdownSymbol: selectedStickerOption.markdownSymbol,
    } : null,
    totalWeight,
    criteria: normalizedCriteria,
  }, null, 2), [audience, curriculumTrack, displayMode, gradeBand, normalizedCriteria, projectContext, selectedCurriculumTrack.label, selectedStickerOption, standardsContext, title, totalWeight]);

  const csvOutput = useMemo(() => {
    const header = ['criterion', 'description', 'bloom', 'standard', 'weight', ...levelLabels];
    const rows = normalizedCriteria.map((criterion) => [
      criterion.name,
      criterion.description,
      criterion.bloom,
      criterion.standard,
      criterion.weight,
      ...criterion.levels,
    ]);
    return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
  }, [normalizedCriteria]);

  const copyOutput = async (type: 'markdown' | 'json' | 'csv') => {
    const content = type === 'markdown' ? markdownOutput : type === 'json' ? jsonOutput : csvOutput;
    await navigator.clipboard.writeText(content);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const updateCriterion = <T extends keyof Criterion>(id: string, key: T, value: Criterion[T]) => {
    setCriteria((current) => current.map((criterion) => (
      criterion.id === id ? { ...criterion, [key]: value } : criterion
    )));
  };

  const updateLevel = (id: string, levelIndex: number, value: string) => {
    setCriteria((current) => current.map((criterion) => {
      if (criterion.id !== id) return criterion;
      const levels = [...criterion.levels] as Criterion['levels'];
      levels[levelIndex] = value;
      return { ...criterion, levels };
    }));
  };

  const generateRubricSuggestions = async () => {
    if (!apiKey) {
      setShowAiSettings(true);
      setAiError('Vui lòng nhập Gemini API Key trước khi tạo gợi ý.');
      return;
    }

    setIsGenerating(true);
    setAiError(null);
    setRubricSuggestions([]);

    const prompt = `
Bạn là chuyên gia EdTech, trainer STEM và curriculum designer.
Hãy tạo đúng 2 phương án rubric chi tiết dựa trên form sau:

- Tên rubric: ${title}
- Bối cảnh dự án: ${projectContext}
- Đối tượng sử dụng: ${audience}
- Hệ chuẩn chương trình: ${selectedCurriculumTrack.label}
- Cấp/lớp áp dụng: ${gradeBand}
- Chuẩn/năng lực cần bám theo: ${standardsContext}
- Kiểu hiển thị hiện tại: ${displayMode === 'stickers' ? `Sticker cho học sinh tiểu học (${selectedStickerOption.label})` : 'Rubric mặc định'}

Yêu cầu:
- Trả về JSON thuần, không markdown, không giải thích ngoài JSON.
- Có đúng 2 phương án trong mảng "suggestions".
- Mỗi phương án có 4-6 tiêu chí.
- Tổng weight trong mỗi phương án phải bằng 100.
- Mỗi tiêu chí có: id, name, description, bloom, standard, weight, levels.
- levels bắt buộc có đúng 4 chuỗi theo thứ tự: cần hỗ trợ, đạt cơ bản, thành thạo, xuất sắc.
- Nội dung phải thực tế, dùng được cho giáo viên, có bằng chứng quan sát được.
- Nếu đối tượng là học sinh tiểu học, ngôn ngữ mức đánh giá phải thân thiện, cụ thể, không gây áp lực.
- Trường "standard" của từng tiêu chí phải bám sát hệ chuẩn đã chọn.
- Nếu hệ chuẩn là "Chuẩn quốc tế": ưu tiên mapping Bloom + NGSS Science & Engineering Practices + ISTE + CSTA; chỉ dùng mã/nhãn chuẩn khi chắc chắn, nếu không hãy ghi tên chuẩn mô tả rõ ràng.
- Nếu hệ chuẩn là "Chuẩn Việt Nam": ưu tiên Chương trình GDPT 2018, phẩm chất/năng lực cốt lõi, năng lực tin học/công nghệ, Khung năng lực số ban hành năm 2025, hoạt động trải nghiệm và định hướng giáo dục STEM Việt Nam; không bịa mã văn bản hoặc mã tiêu chuẩn nếu không chắc chắn.
- Phương án 1 nên thiên về triển khai thực hành trên lớp; phương án 2 nên thiên về năng lực/chuẩn hóa đánh giá.

Schema bắt buộc:
{
  "suggestions": [
    {
      "title": "Phương án 1: ...",
      "rationale": "Lý do phương án này phù hợp...",
      "criteria": [
        {
          "id": "conceptual",
          "name": "Tên tiêu chí",
          "description": "Mô tả tiêu chí",
          "bloom": "Bloom verb",
          "standard": "NGSS/ISTE/CSTA/Custom",
          "weight": 25,
          "levels": ["...", "...", "...", "..."]
        }
      ]
    }
  ]
}
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: 'Bạn chỉ trả về JSON hợp lệ. Không dùng markdown fence. Không thêm lời chào. Không tạo citation giả.',
            }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.55,
            responseMimeType: 'application/json',
          },
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'Gemini API Error');
      }

      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!replyText) {
        throw new Error('Gemini không trả về nội dung.');
      }

      const parsed = extractJsonObject(replyText) as { suggestions?: Array<Partial<RubricSuggestion>> };
      const suggestions = (parsed.suggestions || []).slice(0, 2).map((suggestion, index) => ({
        title: typeof suggestion.title === 'string' ? suggestion.title : `Phương án ${index + 1}`,
        rationale: typeof suggestion.rationale === 'string' ? suggestion.rationale : 'Phương án rubric do AI đề xuất.',
        criteria: normalizeSuggestionCriteria(suggestion.criteria),
      })).filter((suggestion) => suggestion.criteria.length > 0);

      if (!suggestions.length) {
        throw new Error('AI trả về dữ liệu nhưng không có tiêu chí hợp lệ.');
      }

      setRubricSuggestions(suggestions);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Không thể tạo gợi ý rubric.');
    } finally {
      setIsGenerating(false);
    }
  };

  const applySuggestion = (suggestion: RubricSuggestion) => {
    setCriteria(suggestion.criteria);
    setRubricSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showAiSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
            <h3 className="mb-6 flex items-center text-xl font-bold text-gray-900">
              <Settings className="mr-2 text-indigo-500" aria-hidden="true" />
              Cấu hình API Trợ lý Rubric
            </h3>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Google Gemini API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  placeholder="AIzaSy..."
                />
                <p className="mt-2 text-xs text-gray-500">Dữ liệu Key lưu hoàn toàn tại Local Storage của trình duyệt.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Mô hình AI (Model)</label>
                <select
                  value={aiModel}
                  onChange={(event) => setAiModel(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  {geminiModelGroups.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.models.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAiSettings(false)}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-bold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveAiConfig}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white shadow-md shadow-indigo-500/20 transition-colors hover:bg-indigo-700"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="border-b border-foreground/10 bg-foreground/[0.02]">
        <div className="container mx-auto px-6 py-8">
          <Link
            href="/utility-hub"
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 transition-colors hover:text-brand-orange"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Quay lại Utility Hub
          </Link>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/5 px-3 py-1">
                <Table2 size={14} className="text-brand-orange" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Worksheet STEM</span>
              </div>
              <h1 className="font-[family-name:var(--font-inter)] text-4xl font-black tracking-tight md:text-5xl">
                Rubric & Worksheet Builder
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/70">
                Tạo rubric STEM/PBL có mapping Bloom, NGSS, ISTE, CSTA; xem trước và xuất Markdown, JSON, CSV để đưa vào bài viết, LMS hoặc GitHub Classroom.
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm sm:grid-cols-3 lg:min-w-[430px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Tiêu chí</p>
                <p className="mt-1 text-sm font-black">{criteria.length}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Tổng trọng số</p>
                <p className={`mt-1 text-sm font-black ${totalWeight === 100 ? 'text-emerald-600' : 'text-brand-orange'}`}>{totalWeight}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Đầu ra</p>
                <p className="mt-1 text-sm font-black">MD / JSON / CSV</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-10">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
          <aside className="min-w-0 space-y-6">
            <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-orange">Cấu hình worksheet</p>
                  <h2 className="mt-1 text-xl font-black">Thông tin đầu vào</h2>
                </div>
                <Layers3 size={22} className="text-foreground/35" aria-hidden="true" />
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Tên rubric</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="mt-2 h-12 w-full min-w-0 rounded-xl border border-foreground/10 bg-background px-4 text-sm font-bold outline-none transition-colors focus:border-brand-orange"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Bối cảnh dự án</span>
                  <textarea
                    value={projectContext}
                    onChange={(event) => setProjectContext(event.target.value)}
                    rows={4}
                    className="mt-2 w-full resize-none rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-brand-orange"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Đối tượng</span>
                  <input
                    value={audience}
                    onChange={(event) => setAudience(event.target.value)}
                    className="mt-2 h-12 w-full min-w-0 rounded-xl border border-foreground/10 bg-background px-4 text-sm font-bold outline-none transition-colors focus:border-brand-orange"
                  />
                </label>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Hệ chuẩn chương trình</span>
                  <div className="mt-2 grid gap-3">
                    {(Object.entries(curriculumTracks) as Array<[CurriculumTrack, typeof curriculumTracks[CurriculumTrack]]>).map(([key, option]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setCurriculumTrack(key);
                          setStandardsContext(option.defaultStandards);
                        }}
                        className={`rounded-2xl border p-4 text-left transition-colors ${
                          curriculumTrack === key
                            ? 'border-brand-orange bg-brand-orange/10'
                            : 'border-foreground/10 bg-foreground/[0.02] hover:border-brand-orange/40'
                        }`}
                      >
                        <span className="block text-sm font-black">{option.label}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-foreground/55">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Cấp/lớp áp dụng</span>
                  <input
                    value={gradeBand}
                    onChange={(event) => setGradeBand(event.target.value)}
                    className="mt-2 h-12 w-full min-w-0 rounded-xl border border-foreground/10 bg-background px-4 text-sm font-bold outline-none transition-colors focus:border-brand-orange"
                    placeholder="VD: Lớp 4-5, THCS, THPT, workshop giáo viên..."
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Chuẩn / năng lực cần bám theo</span>
                  <textarea
                    value={standardsContext}
                    onChange={(event) => setStandardsContext(event.target.value)}
                    rows={5}
                    className="mt-2 w-full resize-none rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-brand-orange"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-foreground/10 bg-background p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Bot size={18} className="text-brand-orange" aria-hidden="true" />
                    <h2 className="text-lg font-black">AI gợi ý rubric</h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                    Gemini tạo 2 phương án dựa trên tên rubric, bối cảnh và đối tượng. Chọn một phương án để fill vào builder.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiSettings(true)}
                  className={`shrink-0 rounded-full border p-2 transition-colors ${
                    apiKey
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                      : 'border-red-500/20 bg-red-500/10 text-red-600'
                  }`}
                  aria-label="Cấu hình Gemini API"
                >
                  {apiKey ? <Check size={16} aria-hidden="true" /> : <Key size={16} aria-hidden="true" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => void generateRubricSuggestions()}
                disabled={isGenerating}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-black text-background transition-colors hover:bg-brand-orange disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
                {isGenerating ? 'Đang tạo 2 gợi ý...' : 'Tạo gợi ý bằng Gemini'}
              </button>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Model</p>
                  <p className="truncate text-xs font-bold text-foreground/70">{aiModel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiSettings(true)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-foreground/10 px-3 py-2 text-xs font-black transition-colors hover:border-brand-orange hover:text-brand-orange"
                >
                  <Settings size={14} aria-hidden="true" />
                  Cài đặt
                </button>
              </div>

              {aiError && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-bold text-red-600">
                  {aiError}
                </div>
              )}

              {rubricSuggestions.length > 0 && (
                <div className="mt-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-orange">Chọn phương án AI</p>
                  {rubricSuggestions.map((suggestion, index) => (
                    <article key={`${suggestion.title}-${index}`} className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Phương án {index + 1}</p>
                          <h3 className="mt-1 text-sm font-black text-foreground">{suggestion.title}</h3>
                        </div>
                        <span className="shrink-0 rounded-full bg-brand-orange/10 px-2 py-1 text-[10px] font-black text-brand-orange">
                          {suggestion.criteria.length} tiêu chí
                        </span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-foreground/60">{suggestion.rationale}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {suggestion.criteria.slice(0, 4).map((criterion) => (
                          <span key={criterion.id} className="rounded-full border border-foreground/10 bg-background px-3 py-1 text-[10px] font-bold text-foreground/60">
                            {criterion.name}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => applySuggestion(suggestion)}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-orange px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-brand-orange/90"
                      >
                        <Check size={16} aria-hidden="true" />
                        Chọn phương án {index + 1}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-foreground/10 bg-background p-6">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-brand-orange" aria-hidden="true" />
                <h2 className="text-lg font-black">Xuất dữ liệu</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                Markdown dùng cho bài viết, JSON dùng cho AI Agent/LMS, CSV dùng cho spreadsheet hoặc import rubric.
              </p>
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => copyOutput('markdown')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-orange/20 transition-colors hover:bg-brand-orange/90"
                >
                  {copied === 'markdown' ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}
                  Copy Markdown
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => copyOutput('json')}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/10 px-4 py-3 text-sm font-black transition-colors hover:border-brand-orange hover:text-brand-orange"
                  >
                    <FileJson size={16} aria-hidden="true" />
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => copyOutput('csv')}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/10 px-4 py-3 text-sm font-black transition-colors hover:border-brand-orange hover:text-brand-orange"
                  >
                    <FileSpreadsheet size={16} aria-hidden="true" />
                    CSV
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => downloadText(`${slugify(title)}.md`, markdownOutput, 'text/markdown;charset=utf-8')}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/10 px-4 py-3 text-sm font-black transition-colors hover:border-brand-orange hover:text-brand-orange"
                  >
                    <Download size={16} aria-hidden="true" />
                    MD
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadText(`${slugify(title)}.csv`, csvOutput, 'text/csv;charset=utf-8')}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/10 px-4 py-3 text-sm font-black transition-colors hover:border-brand-orange hover:text-brand-orange"
                  >
                    <Download size={16} aria-hidden="true" />
                    CSV
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCriteria(defaultCriteria);
                    setTitle('Template Rubric STEM: Map Bloom -> NGSS -> ISTE -> CSTA');
                    setProjectContext('Dùng cho dự án STEM/PBL 5E, chấm prototype kỹ thuật, lesson plan hoặc sản phẩm học sinh.');
                    setAudience('Giáo viên STEM, trainer, admin LMS, curriculum designer');
                    setCurriculumTrack('international');
                    setGradeBand('Tiểu học / THCS / THPT tùy bài học');
                    setStandardsContext(curriculumTracks.international.defaultStandards);
                    setDisplayMode('standard');
                    setSelectedSticker('star');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/10 px-4 py-3 text-sm font-black text-foreground/60 transition-colors hover:border-brand-orange hover:text-brand-orange"
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  Reset mẫu
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-foreground/10 bg-background p-6">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-brand-orange" aria-hidden="true" />
                <h2 className="text-lg font-black">Kiểu hiển thị đánh giá</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                Chọn dạng rubric nghiêm túc mặc định hoặc dạng sticker thân thiện cho học sinh tiểu học.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ['standard', 'Mặc định', 'Bảng rubric đầy đủ'],
                  ['stickers', 'Sticker', 'Sao, huy hiệu, cúp'],
                ].map(([mode, label, description]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDisplayMode(mode as DisplayMode)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      displayMode === mode
                        ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                        : 'border-foreground/10 bg-foreground/[0.02] hover:border-brand-orange/40'
                    }`}
                  >
                    <span className="block text-sm font-black">{label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-foreground/55">{description}</span>
                  </button>
                ))}
              </div>

              {displayMode === 'stickers' && (
                <div className="mt-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Chọn sticker</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {stickerOptions.map((option) => {
                      const Icon = option.Icon;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setSelectedSticker(option.key)}
                          className={`rounded-2xl border p-3 text-left transition-colors ${
                            selectedSticker === option.key
                              ? 'border-brand-orange bg-brand-orange/10'
                              : 'border-foreground/10 bg-foreground/[0.02] hover:border-brand-orange/40'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-orange/20 bg-brand-orange/10 text-brand-orange">
                              <Icon size={18} aria-hidden="true" />
                            </span>
                            <span className="text-sm font-black">{option.label}</span>
                          </span>
                          <span className="mt-2 block text-xs leading-relaxed text-foreground/55">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-2xl border border-brand-orange/20 bg-brand-orange/5 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-brand-orange">Preview sticker scale</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {levelLabels.map((label, index) => {
                        const Icon = selectedStickerOption.Icon;
                        return (
                          <div key={label} className="rounded-xl border border-foreground/10 bg-background p-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40">{label}</p>
                            <div className="mt-2 flex gap-1 text-brand-orange">
                              {Array.from({ length: index + 1 }).map((_, stickerIndex) => (
                                <Icon key={`${label}-${stickerIndex}`} size={16} aria-hidden="true" />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </aside>

          <section className="min-w-0 space-y-6">
            <div className="min-w-0 overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-orange">Rubric matrix</p>
                  <h2 className="mt-1 text-2xl font-black">Tiêu chí đánh giá</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCriteria((current) => [...current, createCriterion()])}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-black text-background transition-colors hover:bg-brand-orange"
                >
                  <Plus size={16} aria-hidden="true" />
                  Thêm tiêu chí
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {criteria.map((criterion, criterionIndex) => (
                  <article key={criterion.id} className="rounded-2xl border border-foreground/10 bg-background p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-brand-orange">
                          Tiêu chí {criterionIndex + 1}
                        </p>
                        <input
                          value={criterion.name}
                          onChange={(event) => updateCriterion(criterion.id, 'name', event.target.value)}
                          className="mt-2 w-full min-w-0 rounded-xl border border-transparent bg-foreground/[0.03] px-3 py-2 text-base font-black outline-none transition-colors focus:border-brand-orange focus:bg-background"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setCriteria((current) => current.filter((item) => item.id !== criterion.id))}
                        disabled={criteria.length <= 1}
                        className="rounded-full border border-foreground/10 p-2 text-foreground/50 transition-colors hover:border-red-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Xóa tiêu chí ${criterion.name}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(130px,160px)_minmax(130px,160px)_minmax(90px,110px)]">
                      <label className="block min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Mô tả</span>
                        <textarea
                          value={criterion.description}
                          onChange={(event) => updateCriterion(criterion.id, 'description', event.target.value)}
                          rows={3}
                          className="mt-2 w-full min-w-0 resize-none rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand-orange"
                        />
                      </label>
                      <label className="block min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Bloom</span>
                        <input
                          value={criterion.bloom}
                          onChange={(event) => updateCriterion(criterion.id, 'bloom', event.target.value)}
                          className="mt-2 h-11 w-full min-w-0 rounded-xl border border-foreground/10 bg-background px-3 text-sm font-bold outline-none focus:border-brand-orange"
                        />
                      </label>
                      <label className="block min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Chuẩn</span>
                        <input
                          value={criterion.standard}
                          onChange={(event) => updateCriterion(criterion.id, 'standard', event.target.value)}
                          className="mt-2 h-11 w-full min-w-0 rounded-xl border border-foreground/10 bg-background px-3 text-sm font-bold outline-none focus:border-brand-orange"
                        />
                      </label>
                      <label className="block min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Điểm</span>
                        <input
                          type="number"
                          min="0"
                          value={criterion.weight}
                          onChange={(event) => updateCriterion(criterion.id, 'weight', Number(event.target.value))}
                          className="mt-2 h-11 w-full min-w-0 rounded-xl border border-foreground/10 bg-background px-3 text-sm font-bold outline-none focus:border-brand-orange"
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-4">
                      {criterion.levels.map((level, levelIndex) => (
                        <label key={`${criterion.id}-${levelLabels[levelIndex]}`} className="block min-w-0">
                          <span className="flex min-h-12 flex-col items-start gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-foreground/40">
                              {levelLabels[levelIndex]}
                            </span>
                            {displayMode === 'stickers' && (
                              <span className="flex gap-1 text-brand-orange" aria-label={`${levelIndex + 1} ${selectedStickerOption.label}`}>
                                {Array.from({ length: levelIndex + 1 }).map((_, stickerIndex) => {
                                  const Icon = selectedStickerOption.Icon;
                                  return <Icon key={`${criterion.id}-${levelIndex}-${stickerIndex}`} size={15} aria-hidden="true" />;
                                })}
                              </span>
                            )}
                          </span>
                          <textarea
                            value={level}
                            onChange={(event) => updateLevel(criterion.id, levelIndex, event.target.value)}
                            rows={5}
                            className="mt-2 w-full min-w-0 resize-none rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-xs leading-relaxed outline-none focus:border-brand-orange focus:bg-background"
                          />
                        </label>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-foreground/10 bg-background p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-orange">Preview</p>
                  <h2 className="mt-1 text-2xl font-black">Bản Markdown có thể copy vào editor</h2>
                </div>
                <button
                  type="button"
                  onClick={() => copyOutput('markdown')}
                  className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-4 py-2 text-sm font-black transition-colors hover:border-brand-orange hover:text-brand-orange"
                >
                  {copied === 'markdown' ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}
                  Copy
                </button>
              </div>
              <pre className="max-h-[520px] max-w-full overflow-auto rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 text-xs leading-relaxed text-foreground/70">
                {markdownOutput}
              </pre>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
