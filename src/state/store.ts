import { create } from "zustand";
import {
  loadSave,
  persist,
  freshSave,
  type Save,
  type Appearance,
} from "./model";
export type Mode =
  | "loading"
  | "title"
  | "opening"
  | "customize"
  | "play"
  | "pause"
  | "inventory"
  | "journal"
  | "dialogue"
  | "cinematic"
  | "reveal"
  | "ending"
  | "transition"
  | "error";
export type Dialogue = {
  speaker: string;
  role: string;
  lines: string[];
  button: string;
  action?: string;
};
type UI = {
  health: number;
  enemyCount: number;
  challengeRemaining: number;
  save: Save;
  mode: Mode;
  previous: Mode;
  loaded: boolean;
  error: string;
  storage: boolean;
  prompt: string;
  promptId: string;
  region: string;
  distance: number;
  notice: { title: string; sub: string; id: number } | null;
  dialogue: Dialogue | null;
  cinematic: string;
  cinematicTime: number;
  hud: boolean;
  loading: string;
  update: (fn: (s: Save) => Save) => void;
  setMode: (m: Mode) => void;
  notify: (title: string, sub?: string) => void;
  customize: (a: Partial<Appearance>) => void;
  reset: () => void;
};
export const useGame = create<UI>((set, get) => ({
  health: 100,
  enemyCount: 0,
  challengeRemaining: 0,
  save: loadSave(),
  mode: "loading",
  previous: "play",
  loaded: false,
  error: "",
  storage: true,
  prompt: "",
  promptId: "",
  region: "The Wayfarer’s Room",
  distance: 0,
  notice: null,
  dialogue: null,
  cinematic: "",
  cinematicTime: 0,
  hud: true,
  loading: "Lighting the stars…",
  update: (fn) => {
    const save = fn(get().save);
    set({ save, storage: persist(save) });
  },
  setMode: (mode) => set({ mode }),
  notify: (title, sub = "") => {
    const id = Date.now();
    set({ notice: { title, sub, id } });
    setTimeout(() => {
      if (get().notice?.id === id) set({ notice: null });
    }, 5000);
  },
  customize: (a) =>
    get().update((s) => ({ ...s, appearance: { ...s.appearance, ...a } })),
  reset: () => {
    const save = freshSave();
    set({ save, storage: persist(save), mode: "transition" });
  },
}));
export const ui = () => useGame.getState();
