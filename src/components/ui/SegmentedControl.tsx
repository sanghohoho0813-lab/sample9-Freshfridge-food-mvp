"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

export interface Segment<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  /** 라벨 옆 작은 숫자 (예: 냉장 23) */
  count?: number;
}

/**
 * 화면 안에서 보기를 바꾸는 탭 (보관위치·기록 종류·등록 방법).
 * WAI-ARIA 탭 패턴: 선택된 탭만 Tab 으로 들어가고, ←/→·Home/End 로 이동한다.
 */
export default function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  label,
  panelId,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 스크린리더용 이름 */
  label: string;
  /** 탭이 바꾸는 영역(role="tabpanel")의 id */
  panelId?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = segments.length - 1;
    const next =
      e.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : e.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    onChange(segments[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-2xl bg-ink-300/15 p-1">
      {segments.map((s, i) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(s.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl text-[17px] font-bold transition-all duration-200 ${
              active ? "bg-white text-ink-900 shadow-soft" : "text-ink-600 hover:text-ink-900"
            }`}
          >
            {s.icon}
            {s.label}
            {s.count !== undefined && (
              <span
                className={`text-[14.5px] font-semibold tabular-nums ${active ? "text-fresh-700" : "text-ink-600"}`}
              >
                {s.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
