import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CodeBlockComponent({ node, updateAttributes, extension, editor }) {
  const [copied, setCopied] = useState(false);
  const isEditable = editor?.isEditable;

  useEffect(() => {
    const lang = node.attrs.language;
    if (lang && lang !== 'null') {
      const lowlight = extension.options.lowlight;
      if (lowlight && !lowlight.listLanguages().includes(lang)) {
        import(`highlight.js/lib/languages/${lang}`).then((module) => {
          lowlight.register(lang, module.default);
          // Trick to force a re-render of the node view content
          updateAttributes({ language: lang });
        }).catch(err => console.error("Failed to load language:", lang, err));
      }
    }
  }, [node.attrs.language, extension, updateAttributes]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = node.textContent.split('\n').length || 1;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <NodeViewWrapper className="code-block relative group my-4">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 z-10">
        <select
          contentEditable={false}
          disabled={!isEditable}
          value={node.attrs.language || 'null'}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          className="bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs rounded border border-zinc-200 dark:border-zinc-700 px-2 py-1 outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="null">auto</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="csharp">C#</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="sql">SQL</option>
          <option value="bash">Bash</option>
          <option value="json">JSON</option>
          <option value="markdown">Markdown</option>
        </select>
        <button
          contentEditable={false}
          onClick={copyToClipboard}
          className="bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 p-1.5 rounded border border-zinc-200 dark:border-zinc-700 transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      
      <div className="flex bg-zinc-50 dark:bg-zinc-950/50 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col text-right px-3 py-4 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-500 select-none border-r border-zinc-200 dark:border-zinc-800 font-mono text-sm leading-normal">
          {lines.map(line => <span key={line} className="min-w-[1.5rem]">{line}</span>)}
        </div>
        <pre className="flex-1 py-4 px-4 m-0 overflow-x-auto text-sm leading-normal !bg-transparent">
          <NodeViewContent as="code" />
        </pre>
      </div>
    </NodeViewWrapper>
  );
}
