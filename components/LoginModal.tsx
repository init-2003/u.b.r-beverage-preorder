'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Modal, LoginHeader, LoginForm } from '@/components/ui';

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal } = useAuth();

  return (
    <Modal
      isOpen={isLoginModalOpen}
      onClose={closeLoginModal}
      maxWidth="max-w-[450px]"
      titleId="login-modal-title"
    >
      <LoginHeader titleId="login-modal-title" />
      <LoginForm onSuccess={closeLoginModal} />
    </Modal>
  );
}
