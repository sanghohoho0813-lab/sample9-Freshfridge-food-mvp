/** 상세 화면(레시피·재료)을 불러오는 동안 — 실제 화면과 같은 자리(사진 · 제목 · 본문)를 잡아 둔다 */
export default function DetailSkeleton({ heroAspect = "aspect-[4/3]" }: { heroAspect?: string }) {
  return (
    <div className="mx-auto max-w-6xl" aria-busy="true">
      <div className="h-11" />
      <div className="mt-2 grid gap-6 lg:mt-3 lg:grid-cols-2 lg:gap-10">
        <div className="-mx-4 sm:mx-0">
          <div className={`skeleton w-full rounded-none sm:aspect-[4/3] sm:rounded-card ${heroAspect}`} />
        </div>
        <div className="space-y-3.5">
          <div className="skeleton h-9 w-2/3" />
          <div className="skeleton h-5 w-full" />
          <div className="skeleton h-5 w-4/5" />
          <div className="skeleton mt-6 h-44 w-full" />
        </div>
      </div>
      <span className="sr-only" role="status">
        불러오는 중
      </span>
    </div>
  );
}
