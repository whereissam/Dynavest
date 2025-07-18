import { toast as reactToast, ToastOptions } from "react-toastify";

const defaultOptions: ToastOptions = {
  position: "bottom-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
};

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return reactToast.success(message, {
      ...defaultOptions,
      ...options,
      className: "bg-green-50 border-l-4 border-green-400 text-green-800",
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return reactToast.error(message, {
      ...defaultOptions,
      ...options,
      autoClose: 7000, // Keep error messages longer
      className: "bg-red-50 border-l-4 border-red-400 text-red-800",
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return reactToast.warning(message, {
      ...defaultOptions,
      ...options,
      className: "bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800",
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return reactToast.info(message, {
      ...defaultOptions,
      ...options,
      className: "bg-blue-50 border-l-4 border-blue-400 text-blue-800",
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return reactToast.loading(message, {
      ...defaultOptions,
      ...options,
      autoClose: false,
      className: "bg-gray-50 border-l-4 border-gray-400 text-gray-800",
    });
  },

  promise: <T>(
    promise: Promise<T>,
    msgs: {
      pending: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) => {
    return reactToast.promise(promise, msgs, {
      ...defaultOptions,
      ...options,
    });
  },

  update: (toastId: string | number, options: ToastOptions) => {
    return reactToast.update(toastId, options);
  },

  dismiss: (toastId?: string | number) => {
    return reactToast.dismiss(toastId);
  },
};

// Strategy-specific toasts
export const strategyToast = {
  saveSuccess: (strategyName: string) => {
    toast.success(`Strategy "${strategyName}" saved successfully! 🎉`, {
      autoClose: 3000,
    });
  },

  loadSuccess: (count: number) => {
    toast.success(`Loaded ${count} ${count === 1 ? 'strategy' : 'strategies'} 📊`, {
      autoClose: 3000,
    });
  },

  saveError: () => {
    toast.error("Failed to save strategy. Please try again.", {
      autoClose: 7000,
    });
  },

  loadError: () => {
    toast.error("Failed to load strategies. Please check your connection.", {
      autoClose: 7000,
    });
  },

  walletRequired: () => {
    toast.warning("Please connect your wallet to save strategies 🔗", {
      autoClose: 5000,
    });
  },

  noStrategyFound: () => {
    toast.info("No strategy found to save. Chat with the AI first! 💬", {
      autoClose: 4000,
    });
  },
};

// Wallet-specific toasts
export const walletToast = {
  connected: (address: string) => {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    toast.success(`Wallet connected: ${shortAddress} 🔗`, {
      autoClose: 3000,
    });
  },

  disconnected: () => {
    toast.info("Wallet disconnected 👋", {
      autoClose: 2000,
    });
  },

  connectionError: (error: string) => {
    toast.error(`Wallet connection failed: ${error}`, {
      autoClose: 7000,
    });
  },

  transactionSuccess: (txHash: string) => {
    console.log('Transaction hash:', txHash); // Log for debugging
    toast.success("Transaction successful! ✅", {
      autoClose: 5000,
    });
  },

  transactionError: (error: string) => {
    toast.error(`Transaction failed: ${error}`, {
      autoClose: 7000,
    });
  },
};