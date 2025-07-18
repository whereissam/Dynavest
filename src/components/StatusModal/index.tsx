"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type: "success" | "error" | "warning" | "info" | "loading";
  actions?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline";
  }[];
}

const StatusModal = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  type, 
  actions = [] 
}: StatusModalProps) => {
  const [progress, setProgress] = useState(0);

  // Auto-close for success messages after 3 seconds
  useEffect(() => {
    if (type === "success" && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [type, isOpen, onClose]);

  // Progress animation for loading
  useEffect(() => {
    if (type === "loading" && isOpen) {
      const interval = setInterval(() => {
        setProgress(prev => prev < 90 ? prev + 10 : prev);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [type, isOpen]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "info":
        return (
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "loading":
        return (
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5F79F1]"></div>
          </div>
        );
      default:
        return null;
    }
  };

  const getButtonVariant = (variant?: string) => {
    switch (variant) {
      case "destructive":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "outline":
        return "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700";
      default:
        return "bg-[#5F79F1] hover:bg-[#4A64DC] text-white";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            {getIcon()}
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {title}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Progress bar for loading */}
        {type === "loading" && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#5F79F1] h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Processing...</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          {actions.length > 0 ? (
            actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${getButtonVariant(action.variant)}`}
              >
                {action.label}
              </button>
            ))
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#5F79F1] hover:bg-[#4A64DC] text-white rounded-lg font-medium text-sm transition-colors"
            >
              OK
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusModal;