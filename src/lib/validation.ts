/**
 * 입력 검증 규칙 — 추가 화면과 정보 수정 화면이 같은 규칙을 쓴다.
 * 오류가 없으면 null, 있으면 사용자에게 그대로 보여줄 문장을 돌려준다.
 */

export const NAME_MAX = 20;
export const QUANTITY_MAX = 9999;

export function validateName(name: string): string | null {
  const t = name.trim();
  if (!t) return "식재료 이름을 입력해주세요.";
  if (t.length > NAME_MAX) return `이름은 ${NAME_MAX}자까지 입력할 수 있어요.`;
  return null;
}

/** 문자열 수량 → 오류. 입력 중인 값은 문자열로 들고 있다가 제출할 때 검사한다. */
export function validateQuantity(text: string, emptyHint = "수량은 0보다 큰 숫자로 입력해주세요."): string | null {
  const n = Number(text);
  if (text.trim() === "" || !Number.isFinite(n) || n <= 0) return emptyHint;
  if (n > QUANTITY_MAX) return `수량이 너무 커요. ${QUANTITY_MAX} 이하로 입력해주세요.`;
  return null;
}

/** 구매일·유통기한 (YYYY-MM-DD, 빈 문자열 = 모름) */
export function validateDates({
  purchasedAt,
  expiresAt,
  today,
}: {
  purchasedAt: string;
  expiresAt: string;
  today: string;
}): {
  purchasedAt: string | null;
  expiresAt: string | null;
} {
  return {
    purchasedAt: purchasedAt && purchasedAt > today ? "구매일은 오늘 이후로 정할 수 없어요." : null,
    expiresAt:
      expiresAt && purchasedAt && expiresAt < purchasedAt ? "유통기한이 구매일보다 빨라요. 날짜를 확인해주세요." : null,
  };
}

/** 소수 둘째 자리까지 */
export const toAmount = (text: string) => Math.round(Number(text) * 100) / 100;
