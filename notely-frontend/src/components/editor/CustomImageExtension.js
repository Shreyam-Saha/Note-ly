import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ResizableImageComponent from './ResizableImageComponent';

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: 'auto',
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
      align: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-align'),
        renderHTML: attributes => {
          if (!attributes.align) return {};
          return { 'data-align': attributes.align };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
