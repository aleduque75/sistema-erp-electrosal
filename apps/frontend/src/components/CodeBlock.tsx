// apps/frontend/src/app/help-center/components/CodeBlock.tsx
import React from 'react';

// Você pode adicionar uma biblioteca de syntax highlighting como 'react-syntax-highlighter'
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  children: React.ReactNode;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, language = 'bash' }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (typeof children === 'string') {
      navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ position: 'relative', background: '#2d2d2d', borderRadius: '8px', margin: '1em 0' }}>
      <button 
        onClick={handleCopy}
        style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }}
      >
        {copied ? 'Copiado!' : 'Copiar'}
      </button>
      <pre style={{ padding: '20px', color: '#f8f8f2', whiteSpace: 'pre-wrap' }}>
        <code>{children}</code>
      </pre>
    </div>
  );
};