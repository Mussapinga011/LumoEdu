import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

interface VisualizadorTeoriaProps {
  url: string;
  className?: string;
  previewMode?: boolean;
}

const VisualizadorTeoria = ({ url, className, previewMode = false }: VisualizadorTeoriaProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchHtml = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(url);
        let text = await response.text();

        // Injectar meta viewport + CSS reset apenas se ainda não conter
        if (!text.includes('viewport')) {
          const injection = `
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <style>
              *, *::before, *::after { box-sizing: border-box; }
              html, body { margin: 0; padding: 0; max-width: 100vw; overflow-x: hidden; }
              img, video, canvas, table { max-width: 100%; height: auto; }
            </style>
          `;
          if (/<\/head>/i.test(text)) {
            text = text.replace(/<\/head>/i, injection + '</head>');
          } else {
            text = '<head>' + injection + '</head>' + text;
          }
        }

        setHtmlContent(text);
      } catch (error) {
        console.error('Erro ao carregar HTML da teoria:', error);
        setHtmlContent('<body style="font-family:sans-serif;padding:2rem;color:#555;"><p>❌ Erro ao carregar o conteúdo da teoria.</p></body>');
      } finally {
        setIsLoading(false);
      }
    };

    if (url) {
      if (url.startsWith('http')) {
        fetchHtml();
      } else {
        setHtmlContent(url);
        setIsLoading(false);
      }
    }
  }, [url]);

  // Ouvir mudanças de fullscreen nativo para actualizar o ícone
  useEffect(() => {
    const handleFsChange = () => {
      setIsNativeFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Tela cheia nativa usando o elemento container completo
  const handleNativeFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      // Fallback: abrir em nova aba se o browser não suportar Fullscreen API
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [url]);

  // Abrir numa nova aba usando um Blob local para garantir renderização HTML correcta
  // (o Supabase Storage serve o ficheiro com Content-Type errado ao abrir directamente)
  const handleOpenNewTab = useCallback(() => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const newTab = window.open(blobUrl, '_blank', 'noopener');
    // Revogar o URL após a aba abrir para libertar memória
    if (newTab) {
      newTab.addEventListener('load', () => URL.revokeObjectURL(blobUrl), { once: true });
    }
  }, [htmlContent]);

  if (previewMode) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}
        {htmlContent && (
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            onLoad={() => setIsLoading(false)}
            className={clsx(
              'border-0 transition-opacity duration-300 transform scale-[0.5] origin-top-left',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            style={{ width: '200%', height: '200%' }}
            sandbox="allow-scripts allow-same-origin"
            title="Preview de Teoria"
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative w-full bg-white border-2 border-slate-100 shadow-inner rounded-2xl overflow-hidden transition-all duration-300',
        isNativeFullscreen ? 'h-screen rounded-none border-0' : 'h-[75vh] min-h-[500px]',
        className
      )}
    >
      {/* Estado de Carregamento */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest text-center px-4">
            Carregando Experiência Interativa...
          </p>
        </div>
      )}

      {/* Iframe com o conteúdo HTML */}
      {htmlContent && (
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          onLoad={() => setIsLoading(false)}
          className={clsx(
            'absolute inset-0 border-0 w-full h-full block transition-opacity duration-500',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          style={{ width: '1px', minWidth: '100%', height: '100%' }}
          sandbox="allow-scripts allow-same-origin"
          title="Visualizador de Teoria Interativo"
          allow="fullscreen"
        />
      )}

      {/* Barra de acções flutuante — aparece apenas quando o conteúdo estiver carregado */}
      {!isLoading && htmlContent && (
        <div className="absolute bottom-4 right-4 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Abrir em nova aba */}
          <button
            onClick={handleOpenNewTab}
            title="Abrir em nova aba"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/85 backdrop-blur-md text-white text-xs font-bold rounded-xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all border border-white/10"
          >
            <ExternalLink size={15} />
            <span className="hidden sm:inline">Nova Aba</span>
          </button>

          {/* Tela cheia nativa */}
          <button
            onClick={handleNativeFullscreen}
            title={isNativeFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary/90 backdrop-blur-md text-white text-xs font-bold rounded-xl shadow-xl hover:bg-primary active:scale-95 transition-all border border-white/10"
          >
            {isNativeFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span className="hidden sm:inline">{isNativeFullscreen ? 'Sair' : 'Tela Cheia'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default VisualizadorTeoria;
