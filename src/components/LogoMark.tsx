import { useId } from "react";

/**
 * FreshFridge 로고마크 — 냉장고 + 잎. 앱 아이콘(src/app/icon.svg)과 같은 그림.
 * 한 화면에 여러 개(사이드바·상단 바)가 있으므로 그라디언트 id 를 인스턴스마다 다르게 만든다.
 * (같은 id 를 쓰면 숨겨진 사이드바 쪽 정의를 참조해 배경이 그려지지 않는다)
 */
export default function LogoMark({ className = "" }: { className?: string }) {
  const gradientId = `ff-mark-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4fae5a" />
          <stop offset="1" stopColor="#2e7f39" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
      <rect x="18" y="11" width="28" height="42" rx="7" fill="#fff" />
      <rect x="18" y="24.5" width="28" height="2.5" fill="#2e7f39" opacity=".18" />
      <rect x="22" y="16" width="2.6" height="5" rx="1.3" fill="#2e7f39" opacity=".45" />
      <rect x="22" y="30.5" width="2.6" height="7" rx="1.3" fill="#2e7f39" opacity=".45" />
      <path d="M30.5 47.5c-1.2-7.6 3.4-13.6 11.2-14.4 1 7.8-3.6 13.9-11.2 14.4z" fill="#3f9c4b" />
      <path d="M31.4 46.4c2.4-4.3 5-7.2 8.6-10.2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
