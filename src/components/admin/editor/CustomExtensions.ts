import { Node, mergeAttributes } from '@tiptap/core';

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
