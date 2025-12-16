
import React from 'react';
import { useToastContainer } from './useToastContainer.hook';
import { ToastContainerView } from './ToastContainer.view';

export const ToastContainer: React.FC = () => {
  const { toasts } = useToastContainer();

  return <ToastContainerView toasts={toasts} />;
};
