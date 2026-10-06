import type { ReactNode } from "react";
import PageHeader from "./PageHeader";
import SkeletonList from "../SkeletonList";

const WIDTH = { "3xl": "max-w-3xl", "5xl": "max-w-5xl", "6xl": "max-w-6xl" };

/**
 * 저장된 데이터를 불러오는 동안의 화면.
 * 제목은 데이터와 상관없으므로 서버에서 바로 그리고(첫 화면이 빨리 뜬다), 데이터 자리만 자리 표시로 둔다.
 */
export default function PageLoading({
  title,
  back,
  width = "3xl",
  rows = 5,
  children,
}: {
  title: ReactNode;
  back?: string;
  width?: keyof typeof WIDTH;
  rows?: number;
  /** 목록이 아닌 화면용 자리 표시 */
  children?: ReactNode;
}) {
  return (
    <div className={`mx-auto ${WIDTH[width]} space-y-5`} aria-busy="true">
      <PageHeader
        title={title}
        back={back}
        description={<span className="skeleton inline-block h-[18px] w-48 align-middle" />}
      />
      {children ?? <SkeletonList rows={rows} />}
      <span className="sr-only" role="status">
        불러오는 중
      </span>
    </div>
  );
}
