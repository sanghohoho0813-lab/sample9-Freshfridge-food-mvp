"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SectionHeader({
  title,
  sub,
  moreHref,
  moreLabel = "더보기",
}: {
  title: string;
  sub?: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[22px] font-extrabold tracking-tight text-ink-900">{title}</h2>
        {sub && <p className="mt-0.5 text-[16.5px] text-ink-500">{sub}</p>}
      </div>
      {moreHref && (
        <Link
          href={moreHref}
          className="inline-flex min-h-[36px] shrink-0 items-center gap-0.5 text-[15.5px] font-semibold text-ink-500 transition-colors hover:text-ink-800"
        >
          {moreLabel}
          <ChevronRight size={20} />
        </Link>
      )}
    </div>
  );
}
