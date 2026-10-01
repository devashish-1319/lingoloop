import { useEffect, useRef, useState } from "react";
import { PaletteIcon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";

const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  // close on outside click and on Escape (returning focus to the trigger)
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const focusSibling = (e, direction) => {
    e.preventDefault();
    const items = [...containerRef.current.querySelectorAll('[role="menuitemradio"]')];
    const next = items.indexOf(document.activeElement) + direction;
    items[(next + items.length) % items.length]?.focus();
  };

  return (
    <div className="dropdown dropdown-end" ref={containerRef}>
      {/* DROPDOWN TRIGGER */}
      <button
        ref={triggerRef}
        className="btn btn-ghost btn-circle"
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <PaletteIcon className="size-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Theme"
          className="dropdown-content mt-2 p-1 shadow-2xl bg-base-200 backdrop-blur-lg rounded-2xl
        w-56 border border-base-content/10 max-h-80 overflow-y-auto"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") focusSibling(e, 1);
            if (e.key === "ArrowUp") focusSibling(e, -1);
          }}
        >
          <div className="space-y-1">
            {THEMES.map((themeOption, index) => (
              <button
                key={themeOption.name}
                role="menuitemradio"
                aria-checked={theme === themeOption.name}
                autoFocus={theme === themeOption.name || (index === 0 && !THEMES.some((t) => t.name === theme))}
                className={`
              w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-colors
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary
              ${
                theme === themeOption.name
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-base-content/5"
              }
            `}
                onClick={() => {
                  setTheme(themeOption.name);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <PaletteIcon className="size-4" aria-hidden="true" />
                <span className="text-sm font-medium">{themeOption.label}</span>
                {/* THEME PREVIEW COLORS (decorative) */}
                <div className="ml-auto flex gap-1" aria-hidden="true">
                  {themeOption.colors.map((color, i) => (
                    <span
                      key={i}
                      className="size-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default ThemeSelector;
