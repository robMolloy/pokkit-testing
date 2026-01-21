import type { ReactNode } from "react";
import { create } from "zustand";

type TState = ReactNode | null;
type TStore = {
  data: TState;
  setData: (data: TState) => void;
};

const useInitModalStore = create<TStore>()((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));

export const useModalStore = () => {
  const { data, setData } = useInitModalStore();

  return { data, setData, close: () => setData(null) };
};
