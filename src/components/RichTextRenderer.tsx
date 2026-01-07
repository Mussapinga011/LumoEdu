import React, { useEffect, useRef } from 'react';

// KaTeX agora é carregado via CDN no index.html
// Declarar tipo global para TypeScript
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

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className = '' }) => {
  const parseContent = (text: string): ContentPart[] => {
    const parts: ContentPart[] = [];
    let remaining = text;
    
    while (remaining.length > 0) {
      // Check for block math $$...$$
      const blockMathMatch = remaining.match(/^\$\$(.+?)\$\$/s);
      if (blockMathMatch) {
        parts.push({ type: 'block-math', content: blockMathMatch[1].trim() });
        remaining = remaining.slice(blockMathMatch[0].length);
        continue;
      }
      
      // Check for inline math $...$
      const inlineMathMatch = remaining.match(/^\$(.+?)\$/);
      if (inlineMathMatch) {
        parts.push({ type: 'inline-math', content: inlineMathMatch[1].trim() });
        remaining = remaining.slice(inlineMathMatch[0].length);
        continue;
      }
      
      // Check for images ![alt](url)
      const imageMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        parts.push({ 
          type: 'image', 
          content: imageMatch[2],
          alt: imageMatch[1] || 'Question image'
        });
        remaining = remaining.slice(imageMatch[0].length);
        continue;
      }
      
      // Find next special character
      const nextSpecialIndex = remaining.search(/[\$!]/);
      
      if (nextSpecialIndex === -1) {
        // No more special characters, add rest as text
        if (remaining.trim()) {
          parts.push({ type: 'text', content: remaining });
        }
        break;
      } else if (nextSpecialIndex > 0) {
        // Add text before special character
        parts.push({ type: 'text', content: remaining.slice(0, nextSpecialIndex) });
        remaining = remaining.slice(nextSpecialIndex);
      } else {
        // Special character at start but didn't match patterns, treat as text
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
          <MathRenderer key={index} math={part.content} displayMode={false} />
        );
      
      case 'block-math':
        return (
          <div key={index} className="my-4">
            <MathRenderer math={part.content} displayMode={true} />
          </div>
        );
      
      case 'image':
        return (
          <img 
            key={index}
            src={part.content}
            alt={part.alt}
            className="max-w-full h-auto my-4 rounded-lg"
          />
        );
      
      case 'text':
        return (
          <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
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

// Componente auxiliar para renderizar matemática com KaTeX
const MathRenderer: React.FC<{ math: string; displayMode: boolean }> = ({ math, displayMode }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current && window.katex) {
      try {
        window.katex.render(math, containerRef.current, {
          displayMode,
          throwOnError: false,
          errorColor: '#cc0000',
        });
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        if (containerRef.current) {
          containerRef.current.textContent = math;
        }
      }
    }
  }, [math, displayMode]);

  return <span ref={containerRef} />;
};

export default RichTextRenderer;
