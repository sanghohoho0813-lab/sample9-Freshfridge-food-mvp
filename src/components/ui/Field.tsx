import type { ReactNode } from "react";

/**
 * 폼 칸 공통 — 라벨 · 입력 · (오류 또는 도움말).
 * 오류/도움말 문단에 `${htmlFor}-msg` id 를 붙이므로, 입력칸에 aria-describedby 로 연결하면
 * 스크린리더가 칸에 들어갈 때 안내를 함께 읽는다.
 */
export default function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
}) {
  const msgId = htmlFor ? `${htmlFor}-msg` : undefined;
  return (
    <div>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="mb-2 block text-[16.5px] font-bold text-ink-700">
          {label}
        </label>
      ) : (
        <p className="mb-2 text-[16.5px] font-bold text-ink-700">{label}</p>
      )}
      {children}
      {error ? (
        <p id={msgId} role="alert" className="mt-1.5 text-[15.5px] font-medium text-coral-700">
          {error}
        </p>
      ) : (
        hint && (
          <div id={msgId} className="mt-1.5 text-[15.5px] text-ink-500">
            {hint}
          </div>
        )
      )}
    </div>
  );
}

/** 오류 상태 입력칸 테두리 */
export const INPUT_ERROR = "border-coral-400 focus:border-coral-400 focus:ring-coral-100";
