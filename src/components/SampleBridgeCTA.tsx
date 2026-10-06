"use client";

import { ArrowRight, ArrowUpRight, LayoutGrid } from "lucide-react";
import { MIRAE_CTA_COPY, MIRAE_LINKS } from "@/lib/mirae-brand";

export interface SampleBridgeCTAProps {
  /** 메인 CTA(상담) 주소 */
  consultHref?: string;
  /** 다른 샘플 목록 주소 */
  samplesHref?: string;
  /** 미래AI랩 홈페이지 주소 */
  homeHref?: string;
  className?: string;
}

/**
 * 미래AI랩 샘플 공통 브릿지 CTA.
 * 샘플을 다 본 사용자를 상담 / 다른 샘플 / 홈페이지로 연결한다.
 *
 * 로고는 상단 브랜드 바·푸터에 이미 있으므로 여기서는 브랜드명과 소개 문구만 쓴다.
 * 링크는 props > src/lib/mirae-brand.ts 순으로 적용된다.
 */
export default function SampleBridgeCTA({
  consultHref = MIRAE_LINKS.consult,
  samplesHref = MIRAE_LINKS.samples,
  homeHref = MIRAE_LINKS.home,
  className = "",
}: SampleBridgeCTAProps) {
  return (
    <section
      aria-labelledby="mirae-cta-headline"
      className={`overflow-hidden rounded-card border border-fresh-100 bg-gradient-to-br from-white via-fresh-50/50 to-mint-50/50 shadow-soft ${className}`}
    >
      <div className="px-5 py-6 sm:px-9 sm:py-10">
        {/* 배지 */}
        <p className="inline-flex items-center gap-2 rounded-chip border border-fresh-200/80 bg-white/80 px-3 py-1.5">
          <span
            className="h-2 w-2 animate-soft-pulse rounded-full bg-fresh-500 motion-reduce:animate-none"
            aria-hidden
          />
          <span className="text-[14.5px] font-bold tracking-[0.12em] text-fresh-700">{MIRAE_CTA_COPY.badge}</span>
        </p>

        {/* 제작 주체 */}
        <p className="mt-3.5 text-[16px] font-semibold text-ink-500 sm:mt-4 sm:text-[16.5px]">
          {MIRAE_CTA_COPY.eyebrow}
        </p>

        {/* 메인 헤드라인 */}
        <h2
          id="mirae-cta-headline"
          className="mt-1 max-w-3xl text-[22px] font-extrabold leading-snug tracking-tight text-ink-900 sm:text-[28.5px]"
        >
          {MIRAE_CTA_COPY.headline}
        </h2>

        {/* 설명 */}
        <p className="mt-2.5 max-w-2xl text-[16.5px] leading-relaxed text-ink-500 sm:mt-3 sm:text-[17.5px]">
          {MIRAE_CTA_COPY.description}
        </p>

        {/* 액션 */}
        <div className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:items-center sm:gap-3">
          {/* 메인 CTA */}
          <a
            href={consultHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-fresh-600 to-mint-600 px-7 py-3.5 text-[19.5px] font-bold text-white shadow-lift transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(46,127,57,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-700 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:py-4 sm:text-[20.5px]"
          >
            {/* 6초에 한 번 지나가는 약한 빛 — 모션 최소화 환경에서는 표시하지 않음 */}
            <span
              className="pointer-events-none absolute inset-y-0 left-0 w-1/4 animate-cta-sheen bg-gradient-to-r from-transparent via-white/25 to-transparent motion-reduce:hidden"
              aria-hidden
            />
            <span className="relative">{MIRAE_CTA_COPY.primary}</span>
            <ArrowRight
              size={23}
              className="relative transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          </a>

          {/* 서브 액션 */}
          <a
            href={samplesHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-ink-300/40 bg-white px-6 py-3 text-[17.5px] font-semibold text-ink-700 transition-all duration-200 hover:border-fresh-300 hover:bg-fresh-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-600 sm:py-4 sm:text-[18.5px]"
          >
            <LayoutGrid size={20} className="text-ink-400" aria-hidden />
            {MIRAE_CTA_COPY.samples}
          </a>
        </div>

        {/* 보조 링크 */}
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[16px] text-ink-500 sm:mt-5 sm:text-[16.5px]">
          <span>{MIRAE_CTA_COPY.primaryHint}</span>
          <span className="hidden h-3 w-px bg-ink-300/40 sm:inline-block" aria-hidden />
          <a
            href={homeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-fresh-700 underline-offset-4 transition-colors hover:text-fresh-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-600"
          >
            {MIRAE_CTA_COPY.home}
            <ArrowUpRight size={17} aria-hidden />
          </a>
        </p>
      </div>
    </section>
  );
}
