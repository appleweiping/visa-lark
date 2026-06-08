import type { Metadata } from "next";
import { DocsContent } from "@/components/docs-content";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "VisaLark documentation: getting started, the two-plane safety model, booking modes & auto-book interlocks, notifications, and self-hosting the optional control plane.",
};

export default function DocsPage() {
  return <DocsContent />;
}
