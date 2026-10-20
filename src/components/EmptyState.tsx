import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import IngredientThumb from "./IngredientThumb";

/**
 * 비어 있을 때 — 이유 한 줄과 다음 행동 하나만 보여준다. compact 는 목록 자리에 들어가는 작은 형태.
 * illustration 에 재료 이름을 주면 아이콘 대신 재료 사진 세 장을 겹쳐 보여준다 (빈 화면이 덜 삭막하게).
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  compact = false,
  illustration,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  compact?: boolean;
  illustration?: string[];
}) {
  return (
    <div
      className={`card flex flex-col items-center text-center ${compact ? "gap-1.5 px-5 py-7" : "gap-2 px-6 py-10"}`}
    >
      {illustration && illustration.length > 0 ? (
        <span className="mb-2 flex items-end justify-center" aria-hidden>
          {illustration.slice(0, 3).map((name, i) => (
            <IngredientThumb
              key={name}
              name={name}
              className={`rounded-full bg-cream ring-4 ring-white ${
                i === 1 ? "z-10 -mx-3 h-20 w-20" : "h-16 w-16 opacity-90"
              } ${compact ? "scale-90" : ""}`}
              sizes="80px"
            />
          ))}
        </span>
      ) : (
        <span
          className={`mb-1 grid place-items-center rounded-full bg-fresh-50 text-fresh-600 ${compact ? "h-11 w-11" : "h-14 w-14"}`}
          aria-hidden
        >
          <Icon size={compact ? 22 : 26} strokeWidth={2} />
        </span>
      )}
      <p className={`font-bold text-ink-800 ${compact ? "text-[18px]" : "text-[19.5px]"}`}>{title}</p>
      {description && <p className="max-w-sm text-[16px] leading-relaxed text-ink-500">{description}</p>}
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className={`btn-primary min-h-[48px] ${compact ? "mt-2" : "mt-3"}`}>
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
