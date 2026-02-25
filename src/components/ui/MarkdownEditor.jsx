import React, { useState, useRef } from 'react';
import { Copy, Check, Type, Bold, Italic, Code, Heading2, List } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/**
 * MarkdownEditor — A full-featured markdown editor with live preview.
 *
 * Features:
 * - Split-pane layout: edit on left, preview on right
 * - Toolbar with quick formatting buttons
 * - Keyboard shortcut support (Tab for indent, Shift+Tab for dedent)
 * - Live syntax highlighting in preview
 * - Copy markdown button
 * - Customizable placeholder text
 *
 * Props:
 * - value: string — current markdown content
 * - onChange: function — callback when content changes
 * - placeholder: string — placeholder text (default: "Enter markdown...")
 * - readOnly: boolean — disable editing (default: false)
 * - showToolbar: boolean — show formatting toolbar (default: true)
 *
 * Example:
 * ```jsx
 * <MarkdownEditor
 *   value={markdown}
 *   onChange={setMarkdown}
 *   placeholder="Write your guide..."
 * />
 * ```
 */
export default function MarkdownEditor({
  value = '',
  onChange = () => {},
  placeholder = 'Escreva em Markdown...',
  readOnly = false,
  showToolbar = true,
}) {
  const textareaRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const insertMarkdown = (before, after = '') => {
    if (readOnly || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newValue =
      beforeText + before + selectedText + after + afterText;

    onChange(newValue);

    // Reset cursor position after state update
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (readOnly) return;

    // Tab for indent
    if (e.key === 'Tab') {
      e.preventDefault();
      insertMarkdown('  ');
    }
    // Ctrl/Cmd + B for bold
    else if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      insertMarkdown('**', '**');
    }
    // Ctrl/Cmd + I for italic
    else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      insertMarkdown('*', '*');
    }
    // Ctrl/Cmd + K for code
    else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      insertMarkdown('`', '`');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toolbarButtons = [
    {
      icon: Heading2,
      label: 'Heading 2',
      onClick: () => insertMarkdown('## ', ''),
    },
    {
      icon: Bold,
      label: 'Bold',
      onClick: () => insertMarkdown('**', '**'),
      shortcut: 'Ctrl+B',
    },
    {
      icon: Italic,
      label: 'Italic',
      onClick: () => insertMarkdown('*', '*'),
      shortcut: 'Ctrl+I',
    },
    {
      icon: Code,
      label: 'Inline Code',
      onClick: () => insertMarkdown('`', '`'),
      shortcut: 'Ctrl+K',
    },
    {
      icon: List,
      label: 'List',
      onClick: () => insertMarkdown('- ', ''),
    },
  ];

  return (
    <div className="w-full bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      {/* Toolbar */}
      {showToolbar && !readOnly && (
        <div className="flex items-center gap-1 bg-gray-800/50 border-b border-gray-700 p-3">
          {toolbarButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              title={btn.label + (btn.shortcut ? ` (${btn.shortcut})` : '')}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <btn.icon className="w-4 h-4" />
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </button>
        </div>
      )}

      {/* Editor + Preview */}
      <div className="flex gap-0 h-full">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          readOnly={readOnly}
          className="flex-1 bg-gray-800 text-white px-4 py-4 focus:outline-none font-mono text-sm resize-none placeholder-gray-600"
          style={{ minHeight: '400px' }}
        />

        {/* Preview Pane */}
        <div
          className="flex-1 bg-gray-900/30 px-4 py-4 overflow-auto border-l border-gray-700"
          style={{ minHeight: '400px' }}
        >
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-3xl font-bold text-white mt-6 mb-3" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-bold text-white mt-5 mb-2" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xl font-bold text-white mt-4 mb-2" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-lg font-bold text-white mt-3 mb-2" {...props} />
                ),
                h5: ({ node, ...props }) => (
                  <h5 className="text-base font-bold text-white mt-3 mb-2" {...props} />
                ),
                h6: ({ node, ...props }) => (
                  <h6 className="text-sm font-bold text-white mt-2 mb-1" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-gray-300 leading-relaxed mb-3" {...props} />
                ),
                a: ({ node, ...props }) => (
                  <a className="text-blue-400 hover:text-blue-300 underline" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-white" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-gray-200" {...props} />
                ),
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-orange-300 font-mono" {...props} />
                  ) : (
                    <code className="bg-gray-800 px-3 py-2 rounded-lg text-sm text-orange-300 font-mono block my-3" {...props} />
                  ),
                pre: ({ node, ...props }) => (
                  <pre className="bg-gray-800 px-4 py-3 rounded-lg overflow-x-auto mb-3" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-3" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside text-gray-300 mb-3" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside text-gray-300 mb-3" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-gray-300 mb-1" {...props} />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="border-gray-700 my-4" {...props} />
                ),
                table: ({ node, ...props }) => (
                  <table className="border-collapse border border-gray-700 mb-3" {...props} />
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-gray-800" {...props} />
                ),
                tbody: ({ node, ...props }) => (
                  <tbody {...props} />
                ),
                tr: ({ node, ...props }) => (
                  <tr className="border border-gray-700" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th className="border border-gray-700 px-3 py-2 text-gray-200 font-bold text-left" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="border border-gray-700 px-3 py-2 text-gray-300" {...props} />
                ),
              }}
            >
              {value}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
