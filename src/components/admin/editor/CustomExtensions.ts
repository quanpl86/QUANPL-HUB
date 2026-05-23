import { Node, mergeAttributes, Extension } from '@tiptap/core';
import '@tiptap/extension-text-style';

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});


type TimelineStep = {
  label: string;
  title: string;
  body: string;
};

const defaultTimelineSteps: TimelineStep[] = [
  {
    label: 'Bước 1',
    title: 'Quét và Đồng bộ Ngữ cảnh Cục bộ',
    body: 'Local Worker lập chỉ mục nguồn tri thức, phát hiện liên kết và chuẩn bị ngữ cảnh cho AI Agent.',
  },
  {
    label: 'Bước 2',
    title: 'Xử lý Đóng gói Nội dung Tự động',
    body: 'AI Agent tạo bản nháp, kiểm tra SEO, chuẩn hóa metadata và đóng gói nội dung thành bản sẵn duyệt.',
  },
  {
    label: 'Bước 3',
    title: 'Chốt chặn Kiểm chứng Con người',
    body: 'Người biên tập kiểm tra thuật ngữ, độ chính xác, hình ảnh và quyết định trạng thái xuất bản.',
  },
  {
    label: 'Bước 4',
    title: 'Kích hoạt Xuất bản Môi trường thật',
    body: 'Nội dung đã phê duyệt được đồng bộ lên CMS, tái tạo sitemap và cập nhật trang public.',
  },
];

function parseSteps(value: unknown): TimelineStep[] {
  if (Array.isArray(value)) return value as TimelineStep[];
  if (typeof value !== 'string') return defaultTimelineSteps;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : defaultTimelineSteps;
  } catch {
    return defaultTimelineSteps;
  }
}

// 1. Scratch Project Extension
export const ScratchEmbed = Node.create({
  name: 'scratchEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      projectId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[src*="scratch.mit.edu"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div', 
      { class: 'scratch-wrapper my-8 aspect-video border-2 border-brand-orange/30 relative' },
      [
        'iframe', 
        mergeAttributes(HTMLAttributes, {
          src: `https://scratch.mit.edu/projects/${HTMLAttributes.projectId}/embed`,
          class: 'absolute inset-0 w-full h-full',
          allowtransparency: 'true',
          allowfullscreen: 'true',
        })
      ]
    ];
  },
});

// 2. 3D Model (Sketchfab) Extension
export const SketchfabEmbed = Node.create({
  name: 'sketchfabEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      modelId: {
        default: null,
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { class: 'sketchfab-wrapper my-8 aspect-video border-2 border-blue-500/30' },
      [
        'iframe',
        mergeAttributes(HTMLAttributes, {
          src: `https://sketchfab.com/models/${HTMLAttributes.modelId}/embed`,
          class: 'w-full h-full',
          allow: 'autoplay; fullscreen; vr',
        })
      ]
    ];
  },
});

export const WorkflowTimeline = Node.create({
  name: 'workflowTimeline',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      title: {
        default: 'Quy trình triển khai thực hành',
      },
      intro: {
        default: 'Trình bày một chuỗi bước vận hành theo thứ tự rõ ràng, phù hợp cho workflow, roadmap hoặc quy trình kỹ thuật.',
      },
      steps: {
        default: defaultTimelineSteps,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'section[data-type="workflow-timeline"]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          return {
            title: element.getAttribute('data-title'),
            intro: element.getAttribute('data-intro'),
            steps: parseSteps(element.getAttribute('data-steps')),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const steps = parseSteps(HTMLAttributes.steps);

    return [
      'section',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'workflow-timeline',
        'data-title': HTMLAttributes.title,
        'data-intro': HTMLAttributes.intro,
        'data-steps': JSON.stringify(steps),
        class: 'kd-timeline my-10',
      }),
      ['h2', { class: 'kd-timeline-title' }, HTMLAttributes.title],
      ['p', { class: 'kd-timeline-intro' }, HTMLAttributes.intro],
      [
        'div',
        { class: 'kd-timeline-list' },
        ...steps.map((step, index) => [
          'article',
          { class: 'kd-timeline-step' },
          ['div', { class: 'kd-timeline-marker' }, String(index + 1)],
          [
            'div',
            { class: 'kd-timeline-content' },
            ['h3', { class: 'kd-timeline-heading' }, step.title],
            ['p', { class: 'kd-timeline-label' }, step.label],
            ['p', { class: 'kd-timeline-body' }, step.body],
          ],
        ]),
      ],
    ];
  },
});

export const KnowledgeCallout = Node.create({
  name: 'knowledgeCallout',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      variant: {
        default: 'insight',
      },
      title: {
        default: 'Ghi chú chiến lược',
      },
      body: {
        default: 'Dùng block này để nhấn mạnh insight, cảnh báo, checklist hoặc kết luận quan trọng trong bài viết.',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'aside[data-type="knowledge-callout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'aside',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'knowledge-callout',
        class: `kd-callout kd-callout-${HTMLAttributes.variant || 'insight'} my-8`,
      }),
      ['p', { class: 'kd-callout-kicker' }, String(HTMLAttributes.variant || 'insight').toUpperCase()],
      ['h3', { class: 'kd-callout-title' }, HTMLAttributes.title],
      ['p', { class: 'kd-callout-body' }, HTMLAttributes.body],
    ];
  },
});

export const KeyTakeaways = Node.create({
  name: 'keyTakeaways',
  group: 'block',
  content: 'bulletList',

  parseHTML() {
    return [
      {
        tag: 'details.kd-key-takeaways',
        contentElement: '.kd-takeaways-content',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes, {
        class: 'kd-key-takeaways mb-8 border border-brand-orange/30 bg-brand-orange/5 rounded-lg overflow-hidden group',
      }),
      ['summary', { class: 'font-orbitron font-bold text-xl p-6 cursor-pointer text-brand-orange uppercase tracking-wider flex items-center gap-2 hover:bg-brand-orange/10 transition-colors outline-none list-none' },
        ['span', { class: 'text-2xl' }, '💡'],
        'TL;DR / KEY TAKEAWAYS'
      ],
      ['div', { class: 'kd-takeaways-content p-6 pt-0 font-be-vietnam text-foreground/90' }, 0],
    ];
  },

  addNodeView() {
    return ({ HTMLAttributes }) => {
      const dom = document.createElement('details');
      dom.classList.add('kd-key-takeaways', 'mb-8', 'border', 'border-brand-orange/30', 'bg-brand-orange/5', 'rounded-lg', 'overflow-hidden', 'group');
      // Copy attributes over
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (value !== null) {
          dom.setAttribute(key, value);
        }
      });
      // By default collapsed
      // dom.open = true;

      const summary = document.createElement('summary');
      summary.classList.add('font-orbitron', 'font-bold', 'text-xl', 'p-6', 'cursor-pointer', 'text-brand-orange', 'uppercase', 'tracking-wider', 'flex', 'items-center', 'gap-2', 'hover:bg-brand-orange/10', 'transition-colors', 'outline-none', 'list-none');
      summary.innerHTML = '<span class="text-2xl">💡</span>TL;DR / KEY TAKEAWAYS';
      
      const content = document.createElement('div');
      content.classList.add('kd-takeaways-content', 'p-6', 'pt-0', 'font-be-vietnam', 'text-foreground/90');

      dom.append(summary, content);

      return {
        dom,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'keyTakeaways') return false;
          return true;
        },
        ignoreMutation: (mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'open') return true;
          return false;
        },
        stopEvent: (e) => {
          if (e.target === summary || summary.contains(e.target as globalThis.Node)) {
            return true;
          }
          return false;
        }
      };
    };
  },
});

export const FAQBlock = Node.create({
  name: 'faqBlock',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      question: {
        default: 'Câu hỏi thường gặp (Nhập tại đây)?',
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'details.faq-block',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const summary = element.querySelector('summary')?.textContent?.trim() || '';
          return { question: summary };
        },
        contentElement: '.faq-answer',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes, {
        class: 'faq-block group mb-4 rounded-sm overflow-hidden',
      }),
      ['summary', { class: 'font-orbitron font-semibold p-4 cursor-pointer text-brand-orange hover:bg-brand-orange/10 transition-colors list-none outline-none' }, 
        HTMLAttributes.question
      ],
      ['div', { class: 'faq-answer p-4 font-be-vietnam leading-relaxed' }, 0],
    ];
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const dom = document.createElement('details');
      dom.classList.add('faq-block', 'group', 'mb-4', 'rounded-sm', 'overflow-hidden');
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (value !== null) {
          dom.setAttribute(key, value);
        }
      });
      // By default collapsed
      // dom.open = true;

      const summary = document.createElement('summary');
      summary.classList.add('font-orbitron', 'font-semibold', 'p-4', 'cursor-pointer', 'text-brand-orange', 'hover:bg-brand-orange/10', 'transition-colors', 'list-none', 'outline-none');
      summary.textContent = node.attrs.question || 'Câu hỏi thường gặp (Nhập tại đây)?';

      const content = document.createElement('div');
      content.classList.add('faq-answer', 'p-4', 'font-be-vietnam', 'leading-relaxed');

      dom.append(summary, content);

      return {
        dom,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'faqBlock') return false;
          if (summary.textContent !== updatedNode.attrs.question) {
            summary.textContent = updatedNode.attrs.question || 'Câu hỏi thường gặp (Nhập tại đây)?';
          }
          return true;
        },
        ignoreMutation: (mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'open') return true;
          return false;
        },
        stopEvent: (e) => {
          if (e.target === summary || summary.contains(e.target as globalThis.Node)) {
            return true;
          }
          return false;
        }
      };
    };
  },
});

export const ChartBlock = Node.create({
  name: 'chartBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      title: {
        default: 'Đồ thị dữ liệu',
      },
      description: {
        default: 'Placeholder cho biểu đồ. Giai đoạn tiếp theo sẽ kết nối dữ liệu và cấu hình chart trực tiếp trong editor.',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="chart-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'chart-block',
        class: 'kd-chart-block my-8',
      }),
      ['div', { class: 'kd-chart-bars' }, ['span'], ['span'], ['span'], ['span']],
      ['figcaption', ['strong', HTMLAttributes.title], ['span', HTMLAttributes.description]],
    ];
  },
});

export const DrawingBoard = Node.create({
  name: 'drawingBoard',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      title: {
        default: 'Bảng vẽ minh họa',
      },
      description: {
        default: 'Placeholder cho sơ đồ tự vẽ. Giai đoạn sau sẽ thêm canvas/diagram editor để xuất ảnh hoặc SVG.',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="drawing-board"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'drawing-board',
        class: 'kd-drawing-board my-8',
      }),
      ['div', { class: 'kd-drawing-grid' }, ['span'], ['span'], ['span']],
      ['figcaption', ['strong', HTMLAttributes.title], ['span', HTMLAttributes.description]],
    ];
  },
});
