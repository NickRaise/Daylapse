import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error";
export type ToastItem = { id: number; message: string; variant: ToastVariant };

type ToastState = {
  toast: ToastItem | null;
  show: (message: string, variant?: ToastVariant) => void;
  hide: () => void;
};

let nextId = 0;

const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (message, variant = "default") => set({ toast: { id: ++nextId, message, variant } }),
  hide: () => set({ toast: null }),
}));

// Callable from anywhere — services, hooks, deeply nested handlers — the same way Alert.alert was, but
// themed and non-blocking instead of a native OS dialog.
export function showToast(message: string, variant: ToastVariant = "default") {
  useToastStore.getState().show(message, variant);
}

export default useToastStore;
