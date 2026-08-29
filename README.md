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

## 이미지 에셋

식재료 34종·레시피 16종의 이미지가 `public/images/` 에 포함되어 있습니다.

- 파일명은 ASCII 슬러그(`tofu.png`, `tofu-mushroom-jeongol.png`)를 쓰고, 한글 식재료명 ↔ 슬러그 매핑은 `src/lib/images.ts`에서 관리합니다.
- 식재료 이미지는 이름 기준으로 매칭되므로, 사용자가 새로 등록한 식재료도 이름이 맞으면 자동으로 이미지가 붙습니다. 매칭되는 이미지가 없으면 이모지로 폴백합니다.
- 이미지는 흰 배경이라 상태 컬러 타일 위에서 `mix-blend-multiply`로 자연스럽게 얹힙니다.

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
