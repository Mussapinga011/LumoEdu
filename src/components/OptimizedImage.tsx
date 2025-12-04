import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { ImageOff } from 'lucide-react';
import clsx from 'clsx';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

const OptimizedImage = ({ src, alt, className, fallbackSrc, ...props }: OptimizedImageProps) => {
  const { user } = useAuthStore();
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // If Data Saver is on, we might want to skip loading images or load low-res versions
  // For this implementation, if dataSaverMode is true, we'll show a placeholder unless clicked
  const [forceLoad, setForceLoad] = useState(false);

  const shouldLoad = !user?.dataSaverMode || forceLoad;

  if (!shouldLoad) {
    return (
      <div 
        className={clsx(
          "bg-gray-100 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-200 transition-colors",
          className
        )}
        onClick={() => setForceLoad(true)}
        title="Click to load image (Data Saver Mode)"
      >
        <ImageOff size={24} />
        <span className="text-xs font-medium mt-1">Tap to load</span>
      </div>
    );
  }

  return (
    <div className={clsx("relative overflow-hidden", className)}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      <img
        src={error ? (fallbackSrc || '/placeholder-image.png') : src}
        alt={alt}
        className={clsx(
          "w-full h-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
