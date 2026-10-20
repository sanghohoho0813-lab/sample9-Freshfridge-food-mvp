"use client";

import { useEffect, useRef, useState } from "react";
import { EXPIRY_GROUP_LABEL, type ExpiryGroup } from "@/lib/expiry-calculator";
import { GROUP_DOT } from "./expiryTone";

/**
 * 기한 구간으로 바로 가는 칩 — 스크롤해도 위에 붙어 있고, 지금 보고 있는 구간이 진하게 표시된다.
 * 목록이 길어도(30개+) "2~3일 안"으로 한 번에 이동할 수 있게. 냉장고·우선소비가 함께 쓴다.
 */
export default function SectionNav({
  sections,
  idPrefix,
}: {
  sections: { group: ExpiryGroup; count: number }[];
  /** 각 구간 section 요소의 id 앞부분 (id = idPrefix + group) */
  idPrefix: string;
}) {
  const [active, setActive] = useState<ExpiryGroup>(sections[0].group);
  const listRef = useRef<HTMLUListElement>(null);
  const groups = sections.map((s) => s.group).join(",");

  // 화면 위쪽(고정 머리 + 칩 줄 아래)을 지난 마지막 구간을 "지금 구간"으로
  useEffect(() => {
    const ids = groups.split(",") as ExpiryGroup[];
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const line = window.innerWidth >= 640 ? 160 : 146;
        let current = ids[0];
        for (const g of ids) {
          const el = document.getElementById(`${idPrefix}${g}`);
          if (el && el.getBoundingClientRect().top <= line) current = g;
        }
        setActive(current);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [groups, idPrefix]);

  // 지금 구간 칩이 가로 목록 밖에 있으면 보이게 옮긴다
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>(`[data-group="${active}"]`);
    if (!list || !chip) return;
    const left = chip.offsetLeft - 16;
    const right = chip.offsetLeft + chip.offsetWidth + 16 - list.clientWidth;
    if (list.scrollLeft > left) list.scrollTo({ left, behavior: "smooth" });
    else if (list.scrollLeft < right) list.scrollTo({ left: right, behavior: "smooth" });
  }, [active]);

  return (
    <nav
      aria-label="기한 구간으로 이동"
      className="sticky top-16 z-20 -mx-4 bg-warmwhite/90 py-2.5 backdrop-blur-md sm:top-[72px] sm:-mx-6"
    >
      <ul
        ref={listRef}
        className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {sections.map(({ group, count }) => {
          const on = group === active;
          return (
            <li key={group} className="shrink-0">
              <button
                type="button"
                data-group={group}
                aria-current={on ? "true" : undefined}
                onClick={() => {
                  setActive(group);
                  document
                    .getElementById(`${idPrefix}${group}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[15.5px] transition-colors duration-200 ${
                  on
                    ? "border-ink-900 bg-ink-900 font-semibold text-white"
                    : "border-ink-900/[0.1] bg-white font-medium text-ink-700 hover:border-ink-900/25"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${GROUP_DOT[group]}`} aria-hidden />
                {EXPIRY_GROUP_LABEL[group]}
                <span className={`tabular-nums ${on ? "text-white/80" : "text-ink-500"}`}>{count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
