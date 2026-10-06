"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function two(n: number): string {
  return String(n).padStart(2, "0");
}

/** 오늘 날짜·요일·현재 시각(초 단위)을 실시간으로 보여준다. */
export default function LiveClock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // 서버/클라이언트 시각 불일치를 피하려고 마운트 후부터 렌더한다.
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) {
    // 마운트 전에는 자리만 잡아둔다 (레이아웃 흔들림 방지)
    return <span className="block h-[22px] w-full max-w-[300px] rounded-lg bg-fresh-100/60" aria-hidden />;
  }

  const dateText = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAYS[now.getDay()]}요일`;

  const hour24 = now.getHours();
  const meridiem = hour24 < 12 ? "오전" : "오후";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const timeText = `${meridiem} ${two(hour12)}:${two(now.getMinutes())}:${two(now.getSeconds())}`;

  return (
    <time
      dateTime={now.toISOString()}
      className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 ${compact ? "text-[15.5px]" : "text-[16.5px]"}`}
    >
      <span className="inline-flex items-center gap-1.5 font-semibold text-ink-600">
        <CalendarDays size={compact ? 16 : 18} className="text-fresh-500" aria-hidden />
        {dateText}
      </span>
      <span className="inline-flex items-center gap-1.5 font-bold tabular-nums text-fresh-700">
        <Clock size={compact ? 16 : 18} className="text-mint-500" aria-hidden />
        {timeText}
      </span>
    </time>
  );
}
