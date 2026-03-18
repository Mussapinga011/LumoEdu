import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface VisualizadorTeoriaProps {
  url: string;
  className?: string;
  previewMode?: boolean;
}

const VisualizadorTeoria = ({ url, className, previewMode = false }: VisualizadorTeoriaProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchHtml = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(url);
        const text = await response.text();
        setHtmlContent(text);
      } catch (error) {
        console.error("Erro ao carregar HTML:", error);
        setHtmlContent("<p>Erro ao carregar o conteúdo da teoria.</p>");
      } finally {
        setIsLoading(false);
      }
    };

    if (url) {
      if (url.startsWith('http')) {
        fetchHtml();
      } else {
        // Se por algum motivo for injetado código cru
        setHtmlContent(url);
        setIsLoading(false);
      }
    }
  }, [url]);

  return (
    <div className={clsx(
      "relative w-full rounded-2xl overflow-hidden bg-white",
      !previewMode ? "min-h-[600px] h-[70vh] border-2 border-slate-100 shadow-inner" : "h-full w-full",
      className
    )}>
      {isLoading && !previewMode && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">
            Carregando Experiência Interativa...
          </p>
        </div>
      )}
      
      {isLoading && previewMode && (
         <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
         </div>
      )}

      {htmlContent && (
        <iframe
          srcDoc={htmlContent}
          onLoad={() => setIsLoading(false)}
          className={clsx(
            "border-0 transition-opacity duration-500",
            previewMode ? "transform scale-[0.5] origin-top-left" : "w-full h-full",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          style={previewMode ? { width: '200%', height: '200%' } : {}}
          sandbox="allow-scripts allow-same-origin"
          title="Visualizador de Teoria Interativo"
        />
      )}
    </div>
  );
};

export default VisualizadorTeoria;
