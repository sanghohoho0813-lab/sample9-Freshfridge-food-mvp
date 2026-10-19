"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SectionHeader({
  id,
  title,
  sub,
  moreHref,
  moreLabel = "더보기",
}: {
  /** 섹션의 aria-labelledby 와 연결할 제목 id */
  id?: string;
  title: string;
  sub?: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <div className="mb-3.5">
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="section-title min-w-0">
          {title}
        </h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="-mr-1.5 inline-flex min-h-[40px] shrink-0 items-center gap-0.5 rounded-full px-1.5 text-[15.5px] font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            {moreLabel}
            {/* 화면 읽기 프로그램에서 "전체 보기"가 무엇의 전체인지 알 수 있게 */}
            <span className="sr-only"> — {title}</span>
            <ChevronRight size={18} aria-hidden />
          </Link>
        )}
      </div>
      {sub && <p className="mt-0.5 text-[15.5px] leading-snug text-ink-500">{sub}</p>}
    </div>
  );
}
