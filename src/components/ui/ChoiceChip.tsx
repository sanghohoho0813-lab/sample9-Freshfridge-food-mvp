import type { ButtonHTMLAttributes } from "react";

const TONE = {
  fresh: "border-fresh-400 bg-fresh-50 text-fresh-700",
  coral: "border-coral-400 bg-coral-50 text-coral-700",
};

/** 여러 보기 중 하나(또는 여러 개)를 고르는 칩. 선택 상태는 aria-pressed 로도 알린다. */
export default function ChoiceChip({
  selected,
  tone = "fresh",
  className = "",
  children,
  ...rest
}: { selected: boolean; tone?: keyof typeof TONE } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`chip min-h-[44px] border ${
        selected ? TONE[tone] : "border-ink-300/30 bg-white text-ink-600 hover:border-fresh-200 hover:bg-fresh-50/40"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
