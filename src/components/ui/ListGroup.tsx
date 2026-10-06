import type { ReactNode } from "react";

/**
 * 하나의 테두리 안에 행을 구분선으로 나열하는 목록.
 * 카드를 행마다 따로 만들지 않아 화면이 가볍고, 많은 항목도 한눈에 훑어볼 수 있다.
 * columns=2 이면 넓은 화면(xl 이상)에서 두 줄 그리드로 배치한다 — 그보다 좁으면 행 정보가 잘린다.
 */
export default function ListGroup({
  children,
  columns = 1,
  className = "",
}: {
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
}) {
  const grid =
    columns === 2
      ? "xl:grid xl:grid-cols-2 xl:[&>li:nth-child(odd)]:border-r xl:[&>li:nth-child(odd):last-child]:border-r-0"
      : "";
  return (
    <div className={`overflow-hidden rounded-card border border-ink-300/25 bg-white ${className}`}>
      <ul className={`-mb-px [&>li]:border-b [&>li]:border-ink-300/20 ${grid}`}>
        {children}
      </ul>
    </div>
  );
}
