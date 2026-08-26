"use client";

import Link from "next/link";

export default function EmptyState({
  emoji,
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  emoji: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="card flex animate-fade-up flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden>
        {emoji}
      </span>
      <p className="text-[15px] font-bold text-ink-700">{title}</p>
      {description && <p className="text-[13px] text-ink-400">{description}</p>}
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="btn-primary mt-3">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
