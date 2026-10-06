import type { ReactNode } from "react";
import BackButton from "./BackButton";

/**
 * 모든 화면 상단 제목 — 제목 한 줄 + 짧은 설명 + 오른쪽 주요 행동.
 * back 을 주면 하단 탭에 없는 화면(모바일)에서 돌아갈 수 있게 뒤로 버튼을 함께 보여준다.
 */
export default function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** 앱 안에서 이전 기록이 없을 때 돌아갈 주소 */
  back?: string;
}) {
  return (
    <div>
      {back && (
        <div className="-mt-1 mb-1 lg:hidden">
          <BackButton fallback={back} />
        </div>
      )}
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
    </div>
  );
}
