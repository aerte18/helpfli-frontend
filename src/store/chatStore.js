// src/store/chatStore.js
import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  isOpen: false,
  orderId: null,
  mode: "normal", // "normal" | "quote"
  prefill: false, // tylko dla "quote" — jeśli świeży draft
  provider: null, // opcjonalnie podgląd providera w headerze
  open: ({ orderId, mode = "normal", prefill = false, provider = null }) =>
    set({ isOpen: true, orderId, mode, prefill, provider }),
  close: () => set({ isOpen: false, orderId: null, mode: "normal", prefill: false, provider: null }),
}));