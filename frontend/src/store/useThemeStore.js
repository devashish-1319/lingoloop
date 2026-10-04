import { create } from "zustand";

const THEME_KEY = "lingoloop-theme";
const LEGACY_THEME_KEY = "streamify-theme"; // key used before the project was renamed

const loadTheme = () => {
  const saved = localStorage.getItem(THEME_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY);
  return saved || "coffee";
};

export const useThemeStore = create((set) => ({
  theme: loadTheme(),
  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    localStorage.removeItem(LEGACY_THEME_KEY);
    set({ theme });
  },
}));
