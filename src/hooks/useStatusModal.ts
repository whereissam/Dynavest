import { useState, useCallback } from "react";
import { StatusModalProps } from "@/components/StatusModal";

type StatusModalState = Omit<StatusModalProps, "isOpen" | "onClose">;

export const useStatusModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalState, setModalState] = useState<StatusModalState>({
    title: "",
    description: "",
    type: "info",
    actions: []
  });

  const showModal = useCallback((config: StatusModalState) => {
    setModalState(config);
    setIsOpen(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const showSuccess = useCallback((title: string, description: string, actions?: StatusModalState["actions"]) => {
    showModal({ title, description, type: "success", actions });
  }, [showModal]);

  const showError = useCallback((title: string, description: string, actions?: StatusModalState["actions"]) => {
    showModal({ title, description, type: "error", actions });
  }, [showModal]);

  const showWarning = useCallback((title: string, description: string, actions?: StatusModalState["actions"]) => {
    showModal({ title, description, type: "warning", actions });
  }, [showModal]);

  const showInfo = useCallback((title: string, description: string, actions?: StatusModalState["actions"]) => {
    showModal({ title, description, type: "info", actions });
  }, [showModal]);

  const showLoading = useCallback((title: string, description: string) => {
    showModal({ title, description, type: "loading", actions: [] });
  }, [showModal]);

  return {
    isOpen,
    modalState,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };
};