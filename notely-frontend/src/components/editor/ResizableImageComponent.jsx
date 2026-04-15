import { NodeViewWrapper } from '@tiptap/react';
import { Rnd } from 'react-rnd';
import { useState, useRef, useEffect } from 'react';

export default function ResizableImageComponent({ node, updateAttributes, selected, editor }) {
  const isEditable = editor?.isEditable;
  const { src, alt, title, width, height, align } = node.attrs;
  const [size, setSize] = useState({ width: width || '100%', height: height || 'auto' });
  const containerRef = useRef(null);

  useEffect(() => {
    setSize({ width: width || '100%', height: height || 'auto' });
  }, [width, height]);

  const onResize = (e, direction, ref, delta, position) => {
    setSize({ width: ref.style.width, height: ref.style.height });
  };

  const onResizeStop = (e, direction, ref, delta, position) => {
    updateAttributes({ width: ref.style.width, height: ref.style.height });
  };

  const alignmentClass = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto'
  }[align || 'center'];

  const handleComponent = (
    <div className="w-3 h-3 bg-primary border-2 border-background rounded-full shadow-sm" />
  );

  return (
    <NodeViewWrapper className={`react-component relative flex ${alignmentClass}`} style={{ width: size.width, maxWidth: '100%' }}>
      {isEditable ? (
        <div className="relative group w-full" ref={containerRef}>
          <div className={`absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1 rounded-md backdrop-blur-sm ${selected ? 'opacity-100' : ''}`}>
            <button
              onClick={() => updateAttributes({ align: 'left' })}
              className={`p-1 rounded hover:bg-white/20 text-white ${align === 'left' ? 'bg-white/30' : ''}`}
              title="Align Left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="15" y1="12" x2="3" y2="12"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
            </button>
            <button
              onClick={() => updateAttributes({ align: 'center' })}
              className={`p-1 rounded hover:bg-white/20 text-white ${align === 'center' ? 'bg-white/30' : ''}`}
              title="Align Center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="3" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
            </button>
            <button
              onClick={() => updateAttributes({ align: 'right' })}
              className={`p-1 rounded hover:bg-white/20 text-white ${align === 'right' ? 'bg-white/30' : ''}`}
              title="Align Right"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="9" y2="12"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
            </button>
          </div>
          <Rnd
            size={{ width: size.width, height: size.height }}
            position={{ x: 0, y: 0 }}
            onResize={onResize}
            onResizeStop={onResizeStop}
            disableDragging={true}
            enableResizing={selected ? {
              top: true, right: true, bottom: true, left: true,
              topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
            } : false}
            lockAspectRatio={true}
            className="!relative"
            resizeHandleComponent={{
              topLeft: handleComponent,
              topRight: handleComponent,
              bottomLeft: handleComponent,
              bottomRight: handleComponent,
              top: handleComponent,
              right: handleComponent,
              bottom: handleComponent,
              left: handleComponent
            }}
            resizeHandleStyles={{
              topLeft: { marginTop: '-4px', marginLeft: '-4px' },
              topRight: { marginTop: '-4px', marginRight: '-4px' },
              bottomLeft: { marginBottom: '-4px', marginLeft: '-4px' },
              bottomRight: { marginBottom: '-4px', marginRight: '-4px' },
              top: { marginTop: '-4px', marginLeft: '50%', transform: 'translateX(-50%)' },
              right: { marginRight: '-4px', marginTop: '50%', transform: 'translateY(-50%)' },
              bottom: { marginBottom: '-4px', marginLeft: '50%', transform: 'translateX(-50%)' },
              left: { marginLeft: '-4px', marginTop: '50%', transform: 'translateY(-50%)' }
            }}
          >
            <img 
              src={src} 
              alt={alt} 
              title={title} 
              className={`w-full h-full object-contain rounded-md transition-all ${selected ? 'ring-1 ring-primary/50' : ''}`}
              draggable={false}
            />
          </Rnd>
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt} 
          title={title} 
          className="w-full h-auto rounded-md object-contain"
          style={{ width: size.width }}
        />
      )}
    </NodeViewWrapper>
  );
}