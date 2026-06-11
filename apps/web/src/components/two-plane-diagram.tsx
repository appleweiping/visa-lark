"use client";

import { useLocale } from "@/lib/locale-context";

/**
 * Animated "two-plane architecture" diagram for the safety section.
 *
 * Left box  = residential data plane (the only thing touching usvisa-info).
 * Right box = relay control plane (zero credentials, never polls).
 * Dashed lines flow slowly (CSS `flow-dash` animation, paused under
 * prefers-reduced-motion). Pure inline SVG, themed via shadcn tokens +
 * brand classes so it adapts to dark/light automatically.
 */
export function TwoPlaneDiagram() {
  const { t } = useLocale();
  const d = t.safety.diagram;

  return (
    <figure className="mt-10 overflow-hidden rounded-2xl border bg-card p-4 sm:p-6">
      <svg
        viewBox="0 0 720 240"
        role="img"
        aria-label={d.aria}
        className="mx-auto block h-auto w-full max-w-3xl"
      >
        {/* ---- visa site (top-left, outside both planes) ---- */}
        <g>
          <rect
            x="36"
            y="18"
            width="180"
            height="40"
            rx="10"
            className="fill-muted stroke-border"
            strokeWidth="1.5"
          />
          <text x="126" y="43" textAnchor="middle" className="fill-foreground font-mono text-[13px]">
            ais.usvisa-info.com
          </text>
        </g>

        {/* data plane → visa site: polite, jittered polling (bidirectional feel) */}
        <path
          d="M126 58 V 96"
          fill="none"
          strokeWidth="2"
          className="flow-dash stroke-lark-500"
          strokeLinecap="round"
        />
        <polygon points="126,64 121,73 131,73" className="fill-lark-500" />

        {/* ---- data plane box (residential) ---- */}
        <g>
          <rect
            x="24"
            y="96"
            width="300"
            height="120"
            rx="14"
            className="fill-lark-500/[0.07] stroke-lark-500"
            strokeWidth="2"
          />
          {/* little house glyph */}
          <path
            d="M48 126 l10 -9 10 9 v 12 h -20 z"
            className="fill-none stroke-lark-500"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <text x="76" y="124" className="fill-foreground text-[14px] font-semibold">
            {d.dataTitle}
          </text>
          <text x="76" y="142" className="fill-muted-foreground text-[11.5px]">
            {d.dataSub}
          </text>
          <text x="48" y="172" className="fill-muted-foreground text-[11.5px]">
            {d.dataLine1}
          </text>
          <text x="48" y="192" className="fill-muted-foreground text-[11.5px]">
            {d.dataLine2}
          </text>
        </g>

        {/* ---- one-way flow: data plane → control plane ---- */}
        <path
          d="M324 142 C 372 142, 372 142, 416 142"
          fill="none"
          strokeWidth="2"
          className="flow-dash stroke-feather-500"
          strokeLinecap="round"
        />
        <polygon points="416,142 405,136.5 405,147.5" className="fill-feather-500" />
        <text x="370" y="128" textAnchor="middle" className="fill-muted-foreground text-[10.5px]">
          {d.flowLabel}
        </text>

        {/* ---- control plane box (relay) ---- */}
        <g>
          <rect
            x="420"
            y="96"
            width="276"
            height="120"
            rx="14"
            className="fill-muted/60 stroke-border"
            strokeWidth="2"
            strokeDasharray="7 5"
          />
          {/* little cloud-relay glyph */}
          <path
            d="M444 134 a8 8 0 0 1 8 -8 a10 10 0 0 1 19 2 a7 7 0 0 1 1 14 h -21 a7 7 0 0 1 -7 -8 z"
            className="fill-none stroke-muted-foreground"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <text x="482" y="124" className="fill-foreground text-[14px] font-semibold">
            {d.controlTitle}
          </text>
          <text x="482" y="142" className="fill-muted-foreground text-[11.5px]">
            {d.controlSub}
          </text>
          <text x="444" y="172" className="fill-muted-foreground text-[11.5px]">
            {d.controlLine1}
          </text>
          <text x="444" y="192" className="fill-muted-foreground text-[11.5px]">
            {d.controlLine2}
          </text>
        </g>

        {/* ---- notifications out of the control plane (to your phone) ---- */}
        <path
          d="M558 96 V 58"
          fill="none"
          strokeWidth="2"
          className="flow-dash-slow stroke-lark-400"
          strokeLinecap="round"
        />
        <polygon points="558,52 553,62 563,62" className="fill-lark-400" />
        <g>
          <rect
            x="468"
            y="18"
            width="180"
            height="40"
            rx="10"
            className="fill-muted stroke-border"
            strokeWidth="1.5"
          />
          <text x="558" y="43" textAnchor="middle" className="fill-foreground text-[12.5px]">
            {d.notifyLabel}
          </text>
        </g>
      </svg>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">
        {d.caption}
      </figcaption>
    </figure>
  );
}
