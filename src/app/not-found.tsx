import Link from "next/link";

/** 없는 주소로 들어왔을 때 — 앱 안에서 바로 갈 수 있는 곳을 안내한다 */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl animate-fade-up flex-col items-center px-2 py-10 text-center sm:py-16">
      <span className="text-[56px]" aria-hidden>
        🥕
      </span>
      <p className="mt-3 text-[15.5px] font-bold tracking-wide text-fresh-700">404</p>
      <h1 className="mt-1 text-[26px] font-extrabold leading-tight text-ink-900 sm:text-[28.5px]">
        페이지를 찾을 수 없어요
      </h1>
      <p className="mt-2 text-[17px] text-ink-500">주소가 바뀌었거나 없는 페이지예요.</p>
      <div className="mt-7 grid w-full max-w-sm grid-cols-2 gap-2">
        <Link href="/" className="btn-primary min-h-[52px]">
          홈으로
        </Link>
        <Link href="/fridge" className="btn-ghost min-h-[52px]">
          내 냉장고
        </Link>
      </div>
    </div>
  );
}
