# 🥬 FreshFridge — 냉장고 식재료 관리 MVP

> **미래에이아이랩(MIRAE AI LAB) MVP 샘플**
> 냉장고 속 식재료를 관리하고, **버리기 전에 먼저 먹도록** 도와주는 생활형 식품관리 서비스입니다.

“오늘 냉장고에서 무엇부터 먹어야 하지?” — 그리고 “그 재료로 뭘 만들어 먹을 수 있지?”
이 두 질문에 답하는 반응형 소비자용 웹앱입니다.

## 주요 기능

- **홈 / 오늘의 냉장고** — 오늘 먼저 먹어야 할 식재료(D-Day 기준), 냉장고 상태 요약, 오늘의 추천 요리, 이번 주 절약 현황
- **내 냉장고** — 전체/냉장/냉동/실온 탭, 9개 카테고리 필터, 유통기한 임박순 정렬
- **식재료 등록** — 직접 입력, 자주 쓰는 재료 빠른 등록 칩, 사진 인식 데모(`recognizeIngredientsFromImage()` — 추후 Vision API 연결 가능 구조)
- **식재료 상세** — 수량 변경, 먹었어요/버렸어요(폐기 사유 기록), 관련 레시피
- **우선소비** — 매우 급함(D-0~1) / 곧 먹기(D-2~3) / 이번 주(D-4~7) 그룹 정렬
- **레시피 추천** — 보유 재료 매칭율 % + 유통기한 임박 재료 가중치(D-1 +30, D-2 +20, D-3 +10) 기반 Rule Based 추천
- **레시피 상세** — 보유/미보유 재료 체크, 우선 소비 재료 강조, 단계형 조리법, **요리했어요** → 사용 재료 자동 차감
- **장보기 리스트** — 부족한 재료 담기, 체크/삭제, "이미 냉장고에 있어요" 중복 구매 방지
- **소비 기록** — 사용/폐기 탭, 날짜별 그룹
- **절약 리포트 & 낭비 분석** — 월간 사용/폐기/폐기율, 카테고리별 폐기 순위, 폐기 사유 통계, Rule Based 개선 제안
- **검색** — 내 냉장고 식재료 + 레시피 통합 검색
- **알림센터** — 앱 내 알림 데모
- **마이페이지** — 프로필, 요약 통계, 데모 데이터 초기화

## 기술 스택

- [Next.js 15](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS
- Lucide Icons
- 상태: React Context + `localStorage` 영속화 (Demo Mode)
- 배포: Vercel

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 열면 데모 데이터(식재료 34개, 레시피 16개)가 자동 시드됩니다.

```bash
npm run build   # 프로덕션 빌드 (Vercel 배포 가능)
```

## 프로젝트 구조

```
src/
  app/                  # 페이지 (App Router)
    page.tsx            # 홈 / 오늘의 냉장고
    fridge/             # 내 냉장고
    ingredient/[id]/    # 식재료 상세
    add/                # 식재료 등록 (직접/빠른/사진 데모)
    priority/           # 우선소비
    recipes/            # 레시피 추천 + 상세
    shopping/           # 장보기 리스트
    history/            # 소비 기록
    report/             # 절약 리포트 + 낭비 분석
    search/             # 검색
    notifications/      # 알림센터
    my/                 # 마이페이지
  components/           # IngredientCard, ExpiryBadge, RecipeCard, AppShell(MobileNav) 등
  lib/
    types.ts            # 도메인 타입 (Supabase 스키마와 1:1 대응 가능)
    demo-data.ts        # 데모 시드 데이터
    expiry-calculator.ts# D-Day 계산·상태·문구
    recipe-matcher.ts   # 레시피 매칭율 계산
    recommendation-engine.ts # Rule Based 추천 (generateRecipeSuggestion() AI 연동 지점)
    image-recognition.ts# 사진 인식 데모 (Vision API 연동 지점)
    stats.ts            # 절약/낭비 통계
    store.tsx           # 전역 상태 + localStorage 영속화
public/images/
  ingredients/          # 식재료 이미지 34종 (512×512, 1:1)
  recipes/              # 레시피 대표이미지 16종 (512×512, 4:3 / 16:9 슬롯에 배치)
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

| 위치 | 표시 | 비고 |
|---|---|---|
| 상단 브랜드 바 | 로고 + "미래에이아이랩이 만든 FreshFridge · MVP Sample" | 전 페이지 공통, 밝은 배경 |
| 데스크톱 사이드바 하단 | "Made by" + 로고 | |
| 데스크톱 푸터 | 로고 + 저작권 문구 | |
| 하단 공통 CTA | 브랜드명 + 소개 문구 (로고 없음) | 아래 SampleBridgeCTA 참고 |

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

| 키 | 용도 | 현재 주소 |
|---|---|---|
| `consult` | 메인 CTA `우리 회사도 만들어보기` | https://miraeailab.com/business-diagnosis |
| `samples` | `다른 샘플 더 보기` | https://miraeailab.com/business-services |
| `home` | `미래AI랩 홈페이지` | https://miraeailab.com/ |

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

`store.tsx`의 액션 함수(추가/차감/소비/폐기)를 Supabase 클라이언트 호출로 교체하면 서버 영속화로 전환됩니다.

## 안내

이 서비스는 식품 보관과 소비 편의를 위한 서비스입니다. 표시된 소비기한·유통기한 정보를 확인해주세요. 보관상태가 좋지 않다면 섭취하지 않는 것이 좋습니다.

---

© 미래에이아이랩 (MIRAE AI LAB) — MVP Sample
