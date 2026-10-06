import type { ReactNode } from "react";

/** 모든 화면 상단 제목 — 제목 한 줄 + 짧은 설명 + 오른쪽 주요 행동 */
export default function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[28.5px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-[16.5px] leading-snug text-ink-500 sm:text-[17.5px]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
