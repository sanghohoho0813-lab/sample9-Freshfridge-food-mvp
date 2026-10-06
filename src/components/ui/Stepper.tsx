"use client";

import { Minus, Plus } from "lucide-react";

/** 수량 −/+ 버튼 한 개 */
export function StepButton({
  dir,
  onClick,
  disabled,
  label,
  size = "md",
}: {
  dir: "down" | "up";
  onClick: () => void;
  disabled?: boolean;
  /** 스크린리더용 — 예: "우유 수량 줄이기" */
  label?: string;
  size?: "sm" | "md";
}) {
  const Icon = dir === "down" ? Minus : Plus;
  return (
    <button
      type="button"
      aria-label={label ?? (dir === "down" ? "수량 줄이기" : "수량 늘리기")}
      onClick={onClick}
      disabled={disabled}
      className={`grid shrink-0 place-items-center border border-ink-300/40 bg-white text-ink-700 transition-all hover:border-fresh-300 active:scale-95 disabled:pointer-events-none disabled:opacity-30 ${
        size === "sm" ? "h-11 w-11 rounded-xl" : "h-[52px] w-[52px] rounded-2xl"
      }`}
    >
      <Icon size={size === "sm" ? 18 : 20} aria-hidden />
    </button>
  );
}

/** 문자열 입력을 숫자로 — 숫자와 소수점만, 7자까지 */
export const sanitizeAmount = (raw: string) => raw.replace(/[^0-9.]/g, "").slice(0, 7);

/**
 * 직접 입력할 수 있는 수량 칸 (− [ 3 개 ] +).
 * 값은 문자열로 들고 있어 입력 중 빈 칸·"0." 같은 중간 상태를 허용하고, 검증은 제출할 때 한다.
 */
export function QuantityInput({
  id,
  value,
  onChange,
  step,
  unitSuffix,
  invalid,
  describedBy,
  inputRef,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  step: number;
  /** 칸 안 오른쪽에 붙는 단위 (단위를 따로 고르는 화면에서는 생략) */
  unitSuffix?: string;
  invalid?: boolean;
  describedBy?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const bump = (dir: 1 | -1) => {
    const n = Number(value);
    const base = Number.isFinite(n) && n > 0 ? n : 0;
    onChange(String(Math.max(step, Math.round((base + dir * step) * 100) / 100)));
  };
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <StepButton dir="down" onClick={() => bump(-1)} />
      <div className="relative min-w-0 flex-1">
        <input
          id={id}
          ref={inputRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className={`input text-center font-semibold tabular-nums ${unitSuffix ? "pr-12" : ""} ${
            invalid ? "border-coral-400 focus:border-coral-400 focus:ring-coral-100" : ""
          }`}
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(sanitizeAmount(e.target.value))}
        />
        {unitSuffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16.5px] font-semibold text-ink-400">
            {unitSuffix}
          </span>
        )}
      </div>
      <StepButton dir="up" onClick={() => bump(1)} />
    </div>
  );
}
