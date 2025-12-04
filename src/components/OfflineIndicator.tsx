import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 animate-fade-in-up">
      <WifiOff size={16} />
      <span className="text-sm font-medium">Você está offline. Modo offline ativado.</span>
    </div>
  );
};

export default OfflineIndicator;
