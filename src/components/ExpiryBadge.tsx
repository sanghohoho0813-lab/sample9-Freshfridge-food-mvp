"use client";

import { dDayLabel, expiryLevel, type ExpiryLevel } from "@/lib/expiry-calculator";

const STYLES: Record<ExpiryLevel, string> = {
  expired: "bg-coral-100 text-coral-600",
  urgent: "bg-coral-50 text-coral-600",
  soon: "bg-amberish-50 text-amberish-600",
  ok: "bg-fresh-50 text-fresh-600",
  unknown: "bg-ink-300/15 text-ink-500",
};

export default function ExpiryBadge({
  expiresAt,
  size = "md",
}: {
  expiresAt: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const level = expiryLevel(expiresAt);
  const sizeClass =
    size === "lg"
      ? "px-3 py-1 text-base font-extrabold"
      : size === "sm"
        ? "px-2 py-0.5 text-[14.5px] font-bold"
        : "px-2.5 py-0.5 text-[16.5px] font-bold";
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-chip transition-colors duration-200 ${sizeClass} ${STYLES[level]}`}>
      {dDayLabel(expiresAt)}
    </span>
  );
}
