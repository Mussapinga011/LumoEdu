import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useToast } from '../hooks/useNotifications';
import Toast from './Toast';

const NotFoundRedirect = () => {
  const { toastState, showWarning, closeToast } = useToast();

  useEffect(() => {
    showWarning("Página não encontrada! Redirecionando para o início.");
  }, [showWarning]);

  return (
    <>
      {toastState.isOpen && (
        <Toast 
          message={toastState.message} 
          type={toastState.type} 
          onClose={closeToast} 
        />
      )}
      <Navigate to="/" replace />
    </>
  );
};

export default NotFoundRedirect;
