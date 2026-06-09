"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Dark-mode toggle. Tailwind is in `class` mode. We set/remove `dark` on <html>
 * and persist the choice. An inline script in layout.tsx applies the stored
 * theme before paint to avoid a flash.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("visalark.theme", next ? "dark" : "light");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}
