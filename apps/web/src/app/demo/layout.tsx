import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live demo",
  description:
    "An interactive, fully offline mock dashboard for VisaLark: availability board per consulate, calendar heatmap, monitor config and notification settings. No real network, no contact with the visa site.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
