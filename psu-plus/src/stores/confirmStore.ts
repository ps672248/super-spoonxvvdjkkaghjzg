import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string; // omit = single-button alert mode
}

interface ConfirmState {
  visible: boolean;
  options: ConfirmOptions | null;
  _resolve: ((value: boolean) => void) | null;
  show: (options: ConfirmOptions) => Promise<boolean>;
  confirm: () => void;
  cancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  visible: false,
  options: null,
  _resolve: null,

  show: (options) => new Promise<boolean>(resolve => {
    set({ visible: true, options, _resolve: resolve });
  }),

  confirm: () => {
    get()._resolve?.(true);
    set({ visible: false, options: null, _resolve: null });
  },

  cancel: () => {
    get()._resolve?.(false);
    set({ visible: false, options: null, _resolve: null });
  },
}));
