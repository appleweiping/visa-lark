import type { SVGProps } from "react";

/** Minimal inline icon set — no external icon dependency, tree-shakeable. */
const PATHS: Record<string, string> = {
  globe:
    "M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 010 18 14 14 0 010-18z",
  tap: "M9 11V6a2 2 0 114 0v5m0 0V9a2 2 0 114 0v2m0 0a2 2 0 114 0v3a7 7 0 01-7 7h-1.5a5 5 0 01-3.8-1.7L5 16.5a2 2 0 012.9-2.7L9 15",
  bell: "M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  calendar:
    "M8 2v3M16 2v3M3.5 9h17M5 5h14a1.5 1.5 0 011.5 1.5V19A1.5 1.5 0 0119 20.5H5A1.5 1.5 0 013.5 19V6.5A1.5 1.5 0 015 5zM8 13h3v3H8z",
  spark:
    "M12 2l2.2 6.3L20.5 10l-5.3 3.8L17 20l-5-3.6L7 20l1.8-6.2L3.5 10l6.3-1.7L12 2z",
  filter: "M3 5h18l-7 8v6l-4 2v-8L3 5z",
  shield:
    "M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z",
  lock: "M7 11V8a5 5 0 0110 0v3m-12 0h14a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8a1 1 0 011-1z",
  ban: "M5.6 5.6l12.8 12.8M12 21a9 9 0 100-18 9 9 0 000 18z",
};

export function Icon({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  const d = PATHS[name] ?? PATHS.spark;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}
