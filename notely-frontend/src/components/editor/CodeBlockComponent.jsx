import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function CodeBlockComponent({ node, updateAttributes, extension }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="code-block relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
        <select
          contentEditable={false}
          defaultValue={node.attrs.language || 'javascript'}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          className="bg-zinc-800 text-zinc-300 text-xs rounded border border-zinc-700 px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
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
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1.5 rounded border border-zinc-700 transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
