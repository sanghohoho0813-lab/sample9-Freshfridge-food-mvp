# FreshFridge — 냉장고 식재료 관리 MVP

![CI](https://github.com/sanghohoho0813-lab/sample9-freshfridge-food-mvp/actions/workflows/ci.yml/badge.svg)

> **미래에이아이랩(MIRAE AI LAB) MVP 샘플**
> 냉장고 속 식재료를 관리하고, **버리기 전에 먼저 먹도록** 도와주는 생활형 식품관리 서비스입니다.

“오늘 냉장고에서 무엇부터 먹어야 하지?” — 그리고 “그 재료로 뭘 만들어 먹을 수 있지?”
이 두 질문에 답하는 반응형 소비자용 웹앱입니다.

## 주요 기능

- **홈 / 오늘의 냉장고** — 오늘 먼저 먹어야 할 식재료(D-Day 기준), 냉장고 상태 요약, 오늘의 추천 요리, 이번 주 절약 현황
- **내 냉장고** — 보관위치 탭(개수 표시), 실제로 있는 카테고리만 필터 칩, 유통기한 임박순 목록 + 행마다 "먹었어요"
- **식재료 등록** — 직접 입력(이름·수량·기한 검증, 같은 재료 중복 안내, 추가 후 되돌리기, 냉장고에서 새 재료 강조), 자주 사는 재료 칩, 사진 인식 데모 — 사진 없이도 "예시 사진으로 해보기"(`recognizeIngredientsFromImage()` — 추후 Vision API 연결 가능 구조)
- **식재료 상세** — 먹었어요/버렸어요(폐기 사유 기록), 정보 수정(수량·유통기한·보관위치·메모), 관련 레시피
- **우선소비** — 매우 급함(D-0~1) / 곧 먹기(D-2~3) / 이번 주(D-4~7) 그룹 정렬
- **레시피 추천** — 보유 재료 매칭율 % + 유통기한 임박 재료 가중치(D-1 +30, D-2 +20, D-3 +10) 기반 Rule Based 추천
- **레시피 상세** — 보유/미보유 재료 체크, 우선 소비 재료 강조, 단계형 조리법, **요리했어요** → 사용 재료 자동 차감
- **장보기 리스트** — 부족한 재료 담기, 체크/삭제(되돌리기), 빈 이름·중복 항목 검증, "냉장고에 있어요" 중복 구매 방지
- **소비 기록** — 먹은/버린 기록 탭, 기간별(오늘·어제·이번 주·지난주…) 묶음, 요리 단위 묶음, 더 보기
- **절약 리포트 & 낭비 분석** — 월간 사용/폐기/폐기율, 카테고리별 폐기 순위, 폐기 사유 통계, Rule Based 개선 제안
- **검색** — 내 냉장고 식재료 + 레시피 통합 검색(띄어쓰기 무시), 곧 기한이 끝나는 재료 제안, 결과 없으면 바로 추가
- **알림센터** — 앱 내 알림 데모
- **마이페이지** — 핵심 숫자, 각 화면 바로가기(현재 상태 표시), 확인창을 거치는 데모 데이터 초기화
- **404 / 잘못된 주소** — 앱 안에서 홈·냉장고로 돌아가는 안내 화면

## 제품 루프 (Product Loop)

모든 핵심 행동은 **행동 → 상태 변화 → 시각 피드백 → 관련 화면 갱신 → 다음 행동**으로 이어집니다.

```
식재료 → 기한 우선순위 → 레시피 → 요리했어요 → 재고 차감 → 다 쓴 재료
      → 장보기 → 구매 완료 → 냉장고에 넣기 → 소비 기록 → 절약 리포트
```

| 행동             | 상태 변화                                                        | 반영되는 화면                                       | 다음 행동                                 |
| ---------------- | ---------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------- |
| 먹었어요         | 고른 양만큼 재고·잔여 금액 비례 차감, 기록(수량·행동 시점 D-Day) | 홈·냉장고·우선소비·알림·소비기록·리포트             | 되돌리기 / 다 먹으면 "다음으로 먹을 재료" |
| 버렸어요         | 양 + 사유 기록                                                   | 소비기록(버린 기록)·리포트 낭비 분석                | 되돌리기 / 다음으로 먹을 재료             |
| 요리했어요       | 레시피 분량만큼 차감, 요리 이력(cooks) + 기록 묶음(cookId)       | 레시피 보유율·"오늘 만들었어요"·홈 성과·기록·리포트 | 다 쓴 재료 장보기 담기 → 남은 급한 재료   |
| 장보기 구매 완료 | 목록만 체크 (재고는 바꾸지 않음)                                 | 장보기·홈                                           | "냉장고에 넣기" 시트에서 확인 후 추가     |

- **되돌리기**: 먹었어요·버렸어요·요리했어요·냉장고에 넣기·식재료 추가·장보기 삭제 직후 5초간 토스트에서 되돌릴 수 있습니다.
- **화면 이동**: 하단 탭에 없는 화면(우선소비·장보기·기록·리포트·알림·검색)은 모바일에서 상단 "뒤로"가 보이고, 하단 탭은 해당 화면이 속한 탭(홈·마이 등)을 표시합니다.
- **빈 상태**: 재료나 기록이 없으면 0을 나열하지 않고 이유 한 줄과 다음 행동 하나만 보여줍니다.
- **알림은 저장하지 않고 계산**합니다(`src/lib/notifications.ts`). 재료를 먹으면 그 재료의 기한 알림이 바로 사라지고, 알림을 누르면 해당 화면으로 이동합니다.
- **리포트 비교는 실제 기록으로만** 계산합니다. 이전 30일 기록이 없으면 비교 문구를 숨깁니다.
- 상세 화면의 "정보 수정"에서 바꾸는 수량은 기록을 남기지 않는 재고 수정용이고, 실제 소비는 "먹었어요"로 기록합니다.

## 기술 스택

| 영역       | 사용                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------- |
| 프레임워크 | Next.js 15 (App Router) · React 19 · TypeScript (strict)                                           |
| 스타일     | Tailwind CSS 3 (디자인 토큰은 `tailwind.config.ts`), Pretendard Variable (자체 호스팅·동적 서브셋) |
| 상태       | React Context + 순수 상태 함수(`src/lib/state/ops.ts`) + `localStorage`                            |
| 테스트     | Vitest (도메인 로직 단위 테스트) · Playwright (E2E, 모바일·데스크톱) · axe-core (접근성)           |
| 품질       | ESLint (경고 0 허용) · Prettier (+ Tailwind 클래스 정렬) · GitHub Actions CI                       |

## 시작하기

```bash
npm install
npm run dev        # http://localhost:3000 — 데모 데이터(식재료 34개, 레시피 16개)가 자동 시드됩니다
```

| 명령               | 하는 일                                                    |
| ------------------ | ---------------------------------------------------------- |
| `npm run check`    | 타입 검사 + 린트 + 포맷 검사 + 단위 테스트 (커밋 전 한 번) |
| `npm test`         | 단위 테스트 (Vitest)                                       |
| `npm run build`    | 운영 빌드                                                  |
| `npm run test:e2e` | 운영 빌드를 띄워 E2E 실행 (먼저 `npm run build`)           |
| `npm run format`   | Prettier 로 코드 정리                                      |

> E2E 를 처음 돌릴 때는 브라우저가 필요합니다: `npx playwright install chromium`

## 아키텍처와 설계 결정

```
화면(app/*/page.tsx) ──> useStore() ──> StoreProvider ──> state/ops.ts (순수 함수) ──> 새 상태
        │                                   │
        │                                   ├─ state/persist.ts : localStorage 저장·복원·검증
        │                                   └─ 되돌리기 스냅샷 · 다른 탭 동기화
        └─ 파생 데이터: recipe-matcher · stats · notifications (저장하지 않고 매번 계산)
```

- **상태 변경은 순수 함수로.** `src/lib/state/ops.ts` 의 함수는 `(이전 상태, 인자, env) → 새 상태` 형태이고 React·저장소에 의존하지 않습니다. 날짜와 id 는 `env` 로 주입해 테스트에서 고정합니다. 바뀐 게 없으면 같은 참조를 돌려주고, 스토어는 이것으로 되돌리기 대상 여부를 판단합니다.
- **되돌리기는 "직전 행동 하나".** 행동마다 토큰을 발급하고, 토스트의 되돌리기는 그 토큰이 아직 최신일 때만 동작합니다. 그사이 다른 행동을 했다면 아무 일도 하지 않습니다.
- **저장 데이터는 믿지 않는다.** `persist.ts` 가 형태를 검사해 깨진 항목은 버리고, 빠진 필드는 기본값으로 채웁니다. 손상되었거나 저장소가 막힌 환경(사생활 보호 모드)에서도 앱이 멈추지 않습니다.
- **여러 탭.** 같은 브라우저의 다른 탭에서 바꾼 내용은 `storage` 이벤트로 받아 반영합니다(서로 덮어쓰지 않음).
- **알림·통계는 파생값.** 알림을 저장하지 않고 현재 상태에서 계산하므로, 우유를 먹으면 "우유 기한 임박" 알림이 즉시 사라집니다. 읽음 여부만 id 로 저장합니다.
- **토스트는 별도 컨텍스트.** 토스트 목록이 바뀔 때 앱 전체가 다시 그려지지 않도록 상태 컨텍스트와 분리했습니다.
- **첫 화면.** 데이터는 브라우저에만 있으므로, 서버에서는 화면 제목·틀을 그리고 데이터 영역은 실제 목록과 같은 모양의 자리 표시로 둡니다. 불러온 뒤에도 레이아웃이 밀리지 않습니다(CLS ≤ 0.06).
- **입력 검증 규칙은 한 곳에.** 추가 화면과 정보 수정 화면이 `src/lib/validation.ts` 를 함께 씁니다.

## 품질 관리

| 단계                              | 내용                                                                                                                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 단위 테스트 (`src/lib/__tests__`) | 기한 계산, 수량·금액 비례 차감, 요리 묶음 기록, 장보기 중복 처리, 저장 데이터 검증, 레시피 매칭(같은 이름 우선·기한 빠른 것 우선), 통계·알림, 한국어 조사, 입력 검증                                                      |
| E2E (`e2e/`)                      | 먹었어요·되돌리기, 부분 소비, 폐기 사유, 요리 → 재고 차감 → 장보기 → 기록·리포트, 추가·검증·중복 안내, 정보 수정, 장보기 → 냉장고, 404·잘못된 id, 검색 → 추가, 다른 탭 동기화, 빈 상태 / 모바일(Pixel 7)·데스크톱 두 환경 |
| 반응형                            | 360 ~ 1440px 에서 가로 넘침·말줄임 잘림·한 글자씩 세로로 쌓이는 한국어가 없는지 자동 검사                                                                                                                                 |
| 접근성                            | 모든 화면 axe-core WCAG 2.1 A/AA 위반 0, 키보드로 본문 건너뛰기·탭 이동(←/→)·시트 포커스 가두기와 복귀                                                                                                                    |
| 콘솔                              | E2E 중 브라우저 콘솔 오류가 하나라도 나면 실패                                                                                                                                                                            |
| CI                                | `.github/workflows/ci.yml` — 타입 · 린트 · 포맷 · 단위 테스트 · 빌드 → E2E                                                                                                                                                |

Lighthouse(모바일, 운영 빌드): 접근성 100 · 권장사항 100 · SEO 100.

## 접근성

- 본문 글자는 흰 배경에서 WCAG AA(4.5:1) 대비를 넘도록 색을 조정했습니다(경고 글자는 `amberish-700`, 위험 글자는 `coral-700`).
- 화면 안 탭은 WAI-ARIA 탭 패턴(선택된 탭만 Tab 정지, ←/→·Home/End 이동, `tabpanel` 연결).
- 시트·대화상자: 열리면 포커스를 안으로 옮기고 가두며, Esc 로 닫으면 열었던 버튼으로 돌아갑니다.
- 입력 오류는 칸 아래에 바로 보이고 `aria-invalid`·`aria-describedby` 로 연결됩니다.
- 이름이 옆에 적힌 썸네일은 장식 이미지로 처리해 같은 이름을 두 번 읽지 않습니다.
- `prefers-reduced-motion` 을 켜면 등장·반짝임 애니메이션을 끕니다.

## 프로젝트 구조

```
src/
  app/                    # 화면 (App Router) — 각 폴더의 layout.tsx 는 문서 제목·설명(metadata)
    page.tsx              # 홈 / 오늘의 냉장고
    fridge/ priority/ recipes/ recipes/[id]/ ingredient/[id]/ add/
    shopping/ history/ report/ search/ notifications/ my/
    not-found.tsx error.tsx
    manifest.ts icon.svg apple-icon.png opengraph-image.png
    pretendard.css        # 자체 호스팅 웹폰트 (public/fonts/pretendard)
  components/
    ui/                   # 공용 UI: PageHeader · PageLoading · BackButton · ListGroup · SegmentedControl
                          #         ChoiceChip · Stepper · Field · ConfirmDialog · useModal
    AppShell.tsx          # 상단 바 · 사이드바 · 하단 탭 · 공통 CTA
    IngredientRow.tsx RecipeCard.tsx IngredientActionSheet.tsx QuickAddSheet.tsx …
  lib/
    state/ops.ts          # 상태를 바꾸는 순수 함수
    state/persist.ts      # localStorage 저장·복원·검증
    store.tsx             # StoreProvider · useStore · useFridge · useUndoToast
    toast.tsx             # 토스트 컨텍스트
    validation.ts         # 입력 검증 규칙
    expiry-calculator.ts quantity.ts text.ts   # 날짜·수량·한국어 조사
    recipe-matcher.ts recommendation-engine.ts stats.ts notifications.ts
    demo-data.ts types.ts images.ts mirae-brand.ts
    __tests__/            # 단위 테스트
e2e/                      # Playwright E2E · 접근성 · 반응형
public/images/            # 식재료 34종 · 레시피 16종 이미지
```

## 타이포그래피 스케일

가독성을 위해 **기본 텍스트를 1.3배 스케일**로 운용합니다.

- Tailwind 기본 폰트 스케일(`text-sm`, `text-base` 등)은 `tailwind.config.ts`의 `fontSize`에서 1.3배 값으로 재정의했습니다.
- 개별 컴포넌트의 `text-[Npx]` 값도 동일 배율로 맞춰져 있습니다.
- 아이콘(1.3배)과 썸네일 타일(1.25배)도 글자와 균형이 맞도록 함께 조정했습니다.
- 데스크톱에서는 사이드바 폭과 본문 컨테이너를 넓혀 좌우 여백을 최소화했습니다.

배율을 되돌리려면 `tailwind.config.ts`의 `fontSize` 블록을 지우고 `text-[Npx]` 값을 1.3으로 나누면 됩니다.

## 브랜딩 (미래에이아이랩)

제작사 로고(`public/images/mirae-ai-lab-logo.png`)는 **배경이 투명한 원본**을 여백만 제거해 사용합니다(755×147).

로고 노출은 다음 3곳으로 제한하고, 페이지 하단의 브랜드 메시지는 공통 CTA가 담당합니다.

| 위치                   | 표시                                                    | 비고                      |
| ---------------------- | ------------------------------------------------------- | ------------------------- |
| 상단 브랜드 바         | 로고 + "미래에이아이랩이 만든 FreshFridge · MVP Sample" | 전 페이지 공통, 밝은 배경 |
| 데스크톱 사이드바 하단 | "Made by" + 로고                                        |                           |
| 데스크톱 푸터          | 로고 + 저작권 문구                                      |                           |
| 하단 공통 CTA          | 브랜드명 + 소개 문구 (로고 없음)                        | 아래 SampleBridgeCTA 참고 |

로고가 어두운 색이라 **밝은 배경 위에만** 올립니다. 어두운 영역에 넣어야 한다면 별도의 화이트 버전이 필요합니다.

## 샘플 공통 CTA (SampleBridgeCTA)

샘플을 다 본 사용자를 **상담 / 다른 샘플 / 홈페이지**로 연결하는 공통 브릿지 CTA입니다.
`src/components/AppShell.tsx`의 `<main>` 안, 페이지 콘텐츠 바로 아래에 한 번만 삽입되어
**모든 라우트 하단에 동일하게** 노출됩니다.

```
src/components/SampleBridgeCTA.tsx   # CTA 컴포넌트
src/lib/mirae-brand.ts               # 링크 + 문구 상수
```

### 링크 수정 위치

`src/lib/mirae-brand.ts` 의 `MIRAE_LINKS` 한 곳만 고치면 됩니다.

| 키        | 용도                              | 현재 주소                                 |
| --------- | --------------------------------- | ----------------------------------------- |
| `consult` | 메인 CTA `우리 회사도 만들어보기` | https://miraeailab.com/business-diagnosis |
| `samples` | `다른 샘플 더 보기`               | https://miraeailab.com/business-services  |
| `home`    | `미래AI랩 홈페이지`               | https://miraeailab.com/                   |

특정 페이지에서만 다른 주소를 쓰려면 props로 덮어씁니다.

```tsx
<SampleBridgeCTA consultHref="..." samplesHref="..." homeHref="..." />
```

### CTA 문구 수정 위치

`src/lib/mirae-brand.ts` 의 `MIRAE_CTA_COPY` 한 곳에서 관리합니다
(`badge` / `eyebrow` / `headline` / `description` / `primary` / `primaryHint` / `samples` / `home`).
메인 CTA 문구 `primary`는 전 샘플 공통으로 **"우리 회사도 만들어보기"**를 유지합니다.

### 애니메이션

- 메인 버튼 위를 **6초에 한 번, 약 0.9초 동안** 지나가는 약한 light sweep (`animate-cta-sheen`)
- 배지의 작은 점에 은은한 `animate-soft-pulse`
- hover 시 살짝 떠오르며 그림자만 강해지고, `motion-reduce` 환경에서는 sweep을 숨기고 이동 효과를 끕니다

## 이미지 에셋

식재료 34종·레시피 16종의 이미지가 `public/images/` 에 포함되어 있습니다.

- 파일명은 ASCII 슬러그(`tofu.png`, `tofu-mushroom-jeongol.png`)를 쓰고, 한글 식재료명 ↔ 슬러그 매핑은 `src/lib/images.ts`에서 관리합니다.
- 식재료 이미지는 이름 기준으로 매칭되므로, 사용자가 새로 등록한 식재료도 이름이 맞으면 자동으로 이미지가 붙습니다. 매칭되는 이미지가 없으면 이모지로 폴백합니다.
- 이미지는 배경이 투명한 PNG라 상태 컬러 타일 위에 그대로 얹힙니다.

새 이미지를 추가하려면 파일을 해당 폴더에 넣고 `src/lib/images.ts`의 매핑에 한 줄 추가하면 됩니다.

## Supabase 연동 계획

현재 MVP는 데모 목적상 `localStorage` 기반으로 동작하며, `src/lib/types.ts`의 타입은 아래 테이블 구조와 1:1 대응하도록 설계되어 있습니다.

`users` · `ingredients` · `ingredient_categories` · `recipes` · `recipe_ingredients` · `consumption_logs` · `waste_logs` · `shopping_items` · `notifications`

- Ingredient Status: `available` / `consume_soon` / `urgent` / `consumed` / `discarded`
- Storage Type: `fridge` / `freezer` / `pantry`

상태 변경이 `src/lib/state/ops.ts` 의 순수 함수로 모여 있어, 서버로 옮길 때는 같은 함수를 서버 액션/API 에서 재사용하고
`state/persist.ts` 를 Supabase 읽기·쓰기로 바꾸면 됩니다. 화면 코드는 `useStore()` 인터페이스만 쓰므로 바뀌지 않습니다.

## 안내

이 서비스는 식품 보관과 소비 편의를 위한 서비스입니다. 표시된 소비기한·유통기한 정보를 확인해주세요. 보관상태가 좋지 않다면 섭취하지 않는 것이 좋습니다.

---

© 미래에이아이랩 (MIRAE AI LAB) — MVP Sample
