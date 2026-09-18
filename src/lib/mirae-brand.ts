/**
 * 미래AI랩 샘플 브릿지 CTA 설정.
 *
 * - 링크 주소를 바꾸려면 MIRAE_LINKS 만 수정하면 된다.
 * - CTA 문구를 바꾸려면 MIRAE_CTA_COPY 만 수정하면 된다.
 * (컴포넌트에서 props 로 개별 덮어쓰기도 가능하다.)
 */

export const MIRAE_LINKS = {
  /** 메인 CTA — 우리 회사도 만들어보기 */
  consult: "https://miraeailab.com/business-diagnosis",
  /** 서브 — 다른 샘플 더 보기 */
  samples: "https://miraeailab.com/business-services",
  /** 서브 — 미래AI랩 홈페이지 */
  home: "https://miraeailab.com/",
} as const;

export const MIRAE_CTA_COPY = {
  badge: "MIRAE AI LAB",
  eyebrow: "이 샘플은 미래AI랩이 기획·제작했습니다",
  headline: "이 샘플이 마음에 드셨다면, 대표님 회사도 이렇게 설계해볼 수 있습니다.",
  description:
    "미래AI랩은 평범한 회사를 기술·데이터·AI 기반의 성장형 기업으로 바꾸는 AX / MVP / 플랫폼 기획·개발을 진행합니다.",
  /** 메인 CTA 문구 (전 샘플 공통) */
  primary: "우리 회사도 만들어보기",
  primaryHint: "무료 진단으로 시작해요",
  samples: "다른 샘플 더 보기",
  home: "미래AI랩 홈페이지",
} as const;
