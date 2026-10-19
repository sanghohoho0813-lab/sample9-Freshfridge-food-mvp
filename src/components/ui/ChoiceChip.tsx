import type { ButtonHTMLAttributes } from "react";

const TONE = {
  fresh: "border-fresh-600 bg-fresh-50 font-semibold text-fresh-800",
  coral: "border-coral-500 bg-coral-50 font-semibold text-coral-700",
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
        selected ? TONE[tone] : "border-ink-900/[0.12] bg-white text-ink-700 hover:border-ink-900/25"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
