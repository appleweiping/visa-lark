"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Landing section with a scroll-triggered reveal: content starts slightly
 * translated + transparent and fades up the first time it enters the
 * viewport (IntersectionObserver). Respects prefers-reduced-motion via the
 * `.reveal` CSS in globals.css, and degrades to visible when IO is missing.
 */
export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} className={`scroll-mt-20 py-20 sm:py-28 ${className}`}>
      <div className={`container-page reveal ${visible ? "is-visible" : ""}`}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-lg leading-8 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
