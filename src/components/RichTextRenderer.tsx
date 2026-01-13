import React, { useEffect, useRef, useState } from 'react';

/* =========================
   Tipos Globais
========================= */
declare global {
  interface Window {
    katex: any;
  }
}

interface RichTextRendererProps {
  content: string;
  className?: string;
}

interface ContentPart {
  type: 'text' | 'inline-math' | 'block-math' | 'image';
  content: string;
  alt?: string;
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */
const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  className = '',
}) => {
  const parseContent = (text: string): ContentPart[] => {
    if (!text) return [];

    const parts: ContentPart[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      // Block math $$...$$
      const blockMathMatch = remaining.match(/^\$\$(.+?)\$\$/s);
      if (blockMathMatch) {
        parts.push({
          type: 'block-math',
          content: blockMathMatch[1].trim(),
        });
        remaining = remaining.slice(blockMathMatch[0].length);
        continue;
      }

      // Inline math $...$
      const inlineMathMatch = remaining.match(/^\$(.+?)\$/s);
      if (inlineMathMatch) {
        parts.push({
          type: 'inline-math',
          content: inlineMathMatch[1].trim(),
        });
        remaining = remaining.slice(inlineMathMatch[0].length);
        continue;
      }

      // Image ![alt](url)
      const imageMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        parts.push({
          type: 'image',
          content: imageMatch[2],
          alt: imageMatch[1] || 'Imagem',
        });
        remaining = remaining.slice(imageMatch[0].length);
        continue;
      }

      // Texto normal
      const nextSpecial = remaining.search(/[\$!]/);
      if (nextSpecial === -1) {
        parts.push({ type: 'text', content: remaining });
        break;
      }

      if (nextSpecial > 0) {
        parts.push({
          type: 'text',
          content: remaining.slice(0, nextSpecial),
        });
        remaining = remaining.slice(nextSpecial);
      } else {
        parts.push({ type: 'text', content: remaining[0] });
        remaining = remaining.slice(1);
      }
    }

    return parts;
  };

  const renderPart = (part: ContentPart, index: number) => {
    switch (part.type) {
      case 'inline-math':
        return (
          <span
            key={index}
            className="inline-block align-middle px-1"
          >
            <MathRenderer math={part.content} displayMode={false} />
          </span>
        );

      case 'block-math':
        return (
          <div
            key={index}
            className="my-6 w-full overflow-x-auto flex justify-center px-4"
          >
            <MathRenderer math={part.content} displayMode={true} />
          </div>
        );

      case 'image':
        return (
          <img
            key={index}
            src={part.content}
            alt={part.alt}
            className="max-w-full max-h-[50vh] object-contain my-4 rounded-xl shadow-sm block mx-auto"
          />
        );

      case 'text':
        return (
          <span
            key={index}
            className="whitespace-pre-wrap leading-loose text-gray-700 text-base md:text-lg tracking-wide break-words"
          >
            {part.content}
          </span>
        );

      default:
        return null;
    }
  };

  const parts = parseContent(content);

  return (
    <div className={className}>
      {parts.map((part, index) => renderPart(part, index))}
    </div>
  );
};

/* =========================
   MATH RENDERER (KATEX)
========================= */
const MathRenderer: React.FC<{
  math: string;
  displayMode: boolean;
}> = ({ math, displayMode }) => {
  const ref = useRef<HTMLDivElement | HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.katex) {
      setReady(true);
      return;
    }

    if (document.getElementById('katex-cdn')) {
      const i = setInterval(() => {
        if (window.katex) {
          setReady(true);
          clearInterval(i);
        }
      }, 100);
      return;
    }

    // CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    document.head.appendChild(link);

    // JS
    const script = document.createElement('script');
    script.id = 'katex-cdn';
    script.src =
      'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!ready || !ref.current || !window.katex) return;

    try {
      window.katex.render(math, ref.current, {
        displayMode,
        throwOnError: false,
        output: 'html',
      });
    } catch {
      ref.current.textContent = math;
    }
  }, [ready, math, displayMode]);

  const Wrapper: any = displayMode ? 'div' : 'span';

  return (
    <Wrapper
      ref={ref}
      className={
        displayMode
          ? 'katex-display max-w-full overflow-x-auto'
          : ''
      }
    >
      {!ready ? math : ''}
    </Wrapper>
  );
};

export default RichTextRenderer;
