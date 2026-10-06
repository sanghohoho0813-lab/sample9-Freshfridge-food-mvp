/** 목록 자리 표시 — 실제 목록(ListGroup + IngredientRow)과 같은 높이·모양이라 불러온 뒤 화면이 튀지 않는다 */
export default function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-card border border-ink-300/25 bg-white" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-ink-300/20 py-3 pl-3 pr-3 last:border-b-0 sm:gap-3.5 sm:pl-4"
        >
          <div className="skeleton h-12 w-12 shrink-0 sm:h-14 sm:w-14" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-[18px] w-1/3" />
            <div className="skeleton h-[14px] w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
