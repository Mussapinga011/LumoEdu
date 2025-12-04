import { useState, useCallback } from 'react';
import { ModalType } from '../components/Modal';
import { ToastType } from '../components/Toast';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
}

interface ToastState {
  isOpen: boolean;
  message: string;
  type: ToastType;
}

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
  });

  const showModal = useCallback(
    (config: Omit<ModalState, 'isOpen'>) => {
      setModalState({
        ...config,
        isOpen: true,
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      confirmText = 'Confirmar',
      cancelText = 'Cancelar'
    ) => {
      showModal({
        title,
        message,
        type: 'confirm',
        onConfirm,
        confirmText,
        cancelText,
        showCancel: true,
      });
    },
    [showModal]
  );

  const showSuccess = useCallback(
    (title: string, message: string, confirmText = 'OK') => {
      showModal({
        title,
        message,
        type: 'success',
        confirmText,
        showCancel: false,
      });
    },
    [showModal]
  );

  const showError = useCallback(
    (title: string, message: string, confirmText = 'OK') => {
      showModal({
        title,
        message,
        type: 'error',
        confirmText,
        showCancel: false,
      });
    },
    [showModal]
  );

  const showInfo = useCallback(
    (title: string, message: string, confirmText = 'OK') => {
      showModal({
        title,
        message,
        type: 'info',
        confirmText,
        showCancel: false,
      });
    },
    [showModal]
  );

  return {
    modalState,
    showModal,
    closeModal,
    showConfirm,
    showSuccess,
    showError,
    showInfo,
  };
};

export const useToast = () => {
  const [toastState, setToastState] = useState<ToastState>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToastState({
      isOpen: true,
      message,
      type,
    });
  }, []);

  const closeToast = useCallback(() => {
    setToastState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showSuccess = useCallback(
    (message: string) => {
      showToast(message, 'success');
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string) => {
      showToast(message, 'error');
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string) => {
      showToast(message, 'warning');
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string) => {
      showToast(message, 'info');
    },
    [showToast]
  );

  return {
    toastState,
    showToast,
    closeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
