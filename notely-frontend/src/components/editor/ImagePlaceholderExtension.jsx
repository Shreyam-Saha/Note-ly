import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Loader2 } from 'lucide-react';

function PlaceholderComponent({ node }) {
  return (
    <NodeViewWrapper className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-md bg-muted/20 my-4">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Uploading image...</span>
      </div>
    </NodeViewWrapper>
  );
}

export const ImagePlaceholder = Node.create({
  name: 'imagePlaceholder',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { 'data-id': attributes.id };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-placeholder"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-placeholder' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlaceholderComponent);
  },
});
