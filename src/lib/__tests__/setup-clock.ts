import { afterEach, beforeEach, vi } from "vitest";

/** 오늘 = 2026-10-06 오전 9시로 고정 (기한 계산이 실행 날짜에 따라 바뀌지 않게) */
export function useFixedToday() {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 6, 9, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });
}
