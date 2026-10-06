"use client";

import Link from "next/link";

/** 비어 있을 때 — 이유 한 줄과 다음 행동 하나만 보여준다. compact 는 목록 자리에 들어가는 작은 형태. */
export default function EmptyState({
  emoji,
  title,
  description,
  ctaLabel,
  ctaHref,
  compact = false,
}: {
  emoji: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`card flex animate-fade-up flex-col items-center text-center ${
        compact ? "gap-1.5 px-5 py-7" : "gap-2 px-6 py-10"
      }`}
    >
      <span className={compact ? "text-[30px]" : "text-4xl"} aria-hidden>
        {emoji}
      </span>
      <p className={`font-bold text-ink-800 ${compact ? "text-[18px]" : "text-[19.5px]"}`}>{title}</p>
      {description && <p className="max-w-sm text-[16px] leading-relaxed text-ink-500">{description}</p>}
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className={`btn-primary min-h-[48px] ${compact ? "mt-2" : "mt-3"}`}>
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
