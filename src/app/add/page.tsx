"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Check, ChevronDown, ImagePlus, Info, Loader2, Minus, PencilLine, Plus } from "lucide-react";
import { useFridge, useStore, useUndoToast } from "@/lib/store";
import {
  CATEGORY_EMOJIS,
  CATEGORY_LABELS,
  STORAGE_LABELS,
  type IngredientCategory,
  type StorageType,
} from "@/lib/types";
import {
  addDays,
  dDayLabel,
  daysLeft,
  formatKoreanDate,
  toISODate,
  todayStart,
} from "@/lib/expiry-calculator";
import { amountStep, formatAmount } from "@/lib/quantity";
import { josa } from "@/lib/text";
import {
  recognizeIngredientsFromImage,
  type RecognizedIngredient,
} from "@/lib/image-recognition";
import IngredientThumb from "@/components/IngredientThumb";
import PageHeader from "@/components/ui/PageHeader";

const QUICK_ITEMS: {
  name: string;
  emoji: string;
  cat: IngredientCategory;
  storage: StorageType;
  unit: string;
  days: number;
  price: number;
}[] = [
  { name: "우유", emoji: "🥛", cat: "dairy", storage: "fridge", unit: "팩", days: 7, price: 3200 },
  { name: "계란", emoji: "🥚", cat: "egg", storage: "fridge", unit: "개", days: 21, price: 6500 },
  { name: "두부", emoji: "🧈", cat: "processed", storage: "fridge", unit: "모", days: 5, price: 2400 },
  { name: "대파", emoji: "🌿", cat: "vegetable", storage: "fridge", unit: "단", days: 7, price: 1800 },
  { name: "양파", emoji: "🧅", cat: "vegetable", storage: "pantry", unit: "개", days: 14, price: 900 },
  { name: "버섯", emoji: "🍄", cat: "vegetable", storage: "fridge", unit: "팩", days: 5, price: 2900 },
  { name: "닭가슴살", emoji: "🍗", cat: "meat", storage: "freezer", unit: "팩", days: 30, price: 3300 },
  { name: "돼지고기", emoji: "🥩", cat: "meat", storage: "fridge", unit: "g", days: 3, price: 8900 },
  { name: "사과", emoji: "🍎", cat: "fruit", storage: "fridge", unit: "개", days: 14, price: 2300 },
  { name: "바나나", emoji: "🍌", cat: "fruit", storage: "pantry", unit: "개", days: 4, price: 1000 },
];

const UNITS = ["개", "팩", "모", "단", "봉", "g", "kg", "ml", "L", "병", "통", "장", "손", "포"];

const NAME_EMOJI: Record<string, string> = Object.fromEntries(
  QUICK_ITEMS.map((q) => [q.name, q.emoji])
);

const EXPIRY_PRESETS = [3, 7, 14, 30];
const NAME_MAX = 20;

const STORAGE_ICON: Record<StorageType, string> = { fridge: "🧊", freezer: "❄️", pantry: "🌤️" };

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string | null;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  const LabelTag = htmlFor ? "label" : "p";
  return (
    <div>
      <LabelTag {...(htmlFor ? { htmlFor } : {})} className="mb-2 block text-[16.5px] font-bold text-ink-700">
        {label}
      </LabelTag>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-[15.5px] font-medium text-coral-600">
          {error}
        </p>
      ) : (
        hint && <div className="mt-1.5 text-[15.5px] text-ink-500">{hint}</div>
      )}
    </div>
  );
}

export default function AddIngredientPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl"><div className="skeleton h-96 w-full" /></div>}>
      <AddIngredientContent />
    </Suspense>
  );
}

function AddIngredientContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { addIngredient, showToast } = useStore();
  const showUndo = useUndoToast();
  const fridge = useFridge();
  const [tab, setTab] = useState<"manual" | "photo">("manual");

  // 직접 등록 폼 상태
  const today = toISODate(todayStart());
  // 검색 결과가 없을 때 "식재료 추가하기"로 넘어오면 이름을 미리 채운다
  const [initial] = useState(() => {
    const n = (params.get("name") ?? "").trim().slice(0, NAME_MAX);
    return { name: n, quick: QUICK_ITEMS.find((q) => q.name === n) };
  });
  const [name, setName] = useState(initial.name);
  const [qtyText, setQtyText] = useState(initial.quick?.unit === "g" ? "300" : "1");
  const [unit, setUnit] = useState(initial.quick?.unit ?? "개");
  const [category, setCategory] = useState<IngredientCategory>(initial.quick?.cat ?? "vegetable");
  const [storage, setStorage] = useState<StorageType>(initial.quick?.storage ?? "fridge");
  const [purchasedAt, setPurchasedAt] = useState(today);
  const [expiresAt, setExpiresAt] = useState(toISODate(addDays(todayStart(), initial.quick?.days ?? 7)));
  const [memo, setMemo] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  // 사진 등록 데모 상태
  const fileRef = useRef<HTMLInputElement>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [recognized, setRecognized] = useState<RecognizedIngredient[] | null>(null);

  const trimmed = name.trim();
  const quantity = Number(qtyText);
  const step = amountStep(unit);

  // 입력값 검증 — 제출을 시도한 뒤부터 칸 아래에 바로 보여준다
  const errors = {
    name: !trimmed ? "식재료 이름을 입력해주세요." : null,
    quantity:
      qtyText.trim() === "" || !Number.isFinite(quantity) || quantity <= 0
        ? "수량은 0보다 큰 숫자로 입력해주세요."
        : quantity > 9999
          ? "수량이 너무 커요. 9999 이하로 입력해주세요."
          : null,
    purchasedAt: purchasedAt && purchasedAt > today ? "구매일은 오늘 이후로 정할 수 없어요." : null,
    expiresAt:
      expiresAt && purchasedAt && expiresAt < purchasedAt ? "유통기한이 구매일보다 빨라요. 날짜를 확인해주세요." : null,
  };
  const hasError = Object.values(errors).some(Boolean);
  const showErr = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  // 같은 이름의 재료가 이미 냉장고에 있으면 알려준다 (중복 등록 방지)
  const existing = useMemo(
    () => (trimmed ? fridge.filter((i) => i.name === trimmed) : []),
    [fridge, trimmed]
  );

  const expiryDays = daysLeft(expiresAt || null);

  const applyQuick = (q: (typeof QUICK_ITEMS)[number]) => {
    setName(q.name);
    setUnit(q.unit);
    setCategory(q.cat);
    setStorage(q.storage);
    setQtyText(q.unit === "g" ? "300" : "1");
    setExpiresAt(toISODate(addDays(todayStart(), q.days)));
  };

  const bumpQty = (dir: 1 | -1) => {
    const base = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
    const next = Math.round((base + dir * step) * 100) / 100;
    setQtyText(String(Math.max(step, next)));
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitted(true);
    if (hasError) {
      if (errors.name) nameRef.current?.focus();
      else if (errors.quantity) qtyRef.current?.focus();
      else if (errors.purchasedAt || errors.expiresAt) {
        if (errors.purchasedAt) setMoreOpen(true);
        document.getElementById(errors.purchasedAt ? "ing-bought" : "ing-expiry")?.focus();
      }
      return;
    }
    const token = addIngredient({
      name: trimmed,
      emoji: NAME_EMOJI[trimmed] ?? CATEGORY_EMOJIS[category],
      quantity: Math.round(quantity * 100) / 100,
      unit,
      category,
      storage,
      purchasedAt: purchasedAt || today,
      expiresAt: expiresAt || null,
      memo: memo.trim() || undefined,
      price: QUICK_ITEMS.find((q) => q.name === trimmed)?.price ?? 3000,
    });
    showUndo(`${josa(trimmed, "을/를")} ${STORAGE_LABELS[storage]}에 넣었어요`, "🧊", token);
    router.push("/fridge");
  };

  const handlePhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("이미지 파일만 올릴 수 있어요", "🖼️");
      return;
    }
    setRecognizing(true);
    setRecognized(null);
    try {
      const result = await recognizeIngredientsFromImage(file);
      setRecognized(result);
    } catch {
      showToast("사진을 읽지 못했어요. 다시 시도해주세요", "⚠️");
    } finally {
      setRecognizing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const changeRecognizedQty = (idx: number, delta: number) => {
    setRecognized((prev) =>
      prev
        ? prev.map((r, i) =>
            i === idx ? { ...r, quantity: Math.max(1, r.quantity + delta) } : r
          )
        : prev
    );
  };

  const removeRecognized = (idx: number) => {
    setRecognized((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev));
  };

  const submitRecognized = () => {
    if (!recognized || recognized.length === 0) return;
    for (const r of recognized) {
      addIngredient({
        name: r.name,
        emoji: r.emoji,
        quantity: r.quantity,
        unit: r.unit,
        category: r.category,
        storage: "fridge",
        purchasedAt: today,
        expiresAt: toISODate(addDays(todayStart(), r.suggestedExpiryDays)),
        price: 3000,
      });
    }
    showToast(`${recognized.length}개 식재료를 냉장고에 넣었어요`, "📸");
    router.push("/fridge");
  };

  const segBtn = (active: boolean) =>
    `flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl text-[17px] font-bold transition-all duration-200 ${
      active ? "bg-white text-ink-900 shadow-soft" : "text-ink-500 hover:text-ink-700"
    }`;
  const optionBtn = (active: boolean) =>
    `chip min-h-[44px] border ${
      active
        ? "border-fresh-400 bg-fresh-50 text-fresh-700"
        : "border-ink-300/30 bg-white text-ink-600 hover:border-fresh-200"
    }`;

  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-5">
      <PageHeader title="식재료 추가" />

      {/* 탭 */}
      <div role="tablist" aria-label="등록 방법" className="flex gap-1 rounded-2xl bg-ink-300/15 p-1">
        {(
          [
            { key: "manual", label: "직접 입력", icon: PencilLine },
            { key: "photo", label: "사진으로 추가", icon: Camera },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={segBtn(tab === t.key)}
          >
            <t.icon size={20} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "manual" ? (
        <form onSubmit={submit} noValidate className="card space-y-6 p-4 sm:p-6">
          {/* 빠른 등록 */}
          <div>
            <p className="mb-2 text-[16.5px] font-bold text-ink-700">자주 사는 재료</p>
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                {QUICK_ITEMS.map((q) => (
                  <button
                    key={q.name}
                    type="button"
                    aria-pressed={trimmed === q.name}
                    onClick={() => applyQuick(q)}
                    className={`chip min-h-[44px] border py-1 pl-1 pr-3.5 ${
                      trimmed === q.name
                        ? "border-fresh-400 bg-fresh-50 text-fresh-700"
                        : "border-ink-300/30 bg-white text-ink-700 hover:border-fresh-200 hover:bg-fresh-50/50"
                    }`}
                  >
                    <IngredientThumb name={q.name} emoji={q.emoji} className="h-9 w-9 rounded-lg" sizes="36px" />
                    {q.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-ink-300/20" aria-hidden />

          <Field
            label="식재료 이름"
            htmlFor="ing-name"
            error={showErr("name")}
            hint={
              existing.length > 0 && (
                <p className="flex items-start gap-1.5 text-amberish-600">
                  <Info size={17} className="mt-[3px] shrink-0" aria-hidden />
                  <span>
                    이미 냉장고에 있어요 ·{" "}
                    {existing.map((i) => `${formatAmount(i.quantity, i.unit)} ${dDayLabel(i.expiresAt)}`).join(", ")}{" "}
                    <Link href={`/ingredient/${existing[0].id}`} className="font-semibold underline underline-offset-2">
                      보기
                    </Link>
                  </span>
                </p>
              )
            }
          >
            <input
              id="ing-name"
              ref={nameRef}
              className={`input ${showErr("name") ? "border-coral-400 focus:border-coral-400 focus:ring-coral-100" : ""}`}
              placeholder="예: 우유, 두부, 시금치"
              value={name}
              maxLength={NAME_MAX}
              autoComplete="off"
              enterKeyHint="next"
              aria-invalid={!!showErr("name")}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="수량" htmlFor="ing-qty" error={showErr("quantity")}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="수량 줄이기"
                onClick={() => bumpQty(-1)}
                className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl border border-ink-300/40 bg-white text-ink-700 transition-all hover:border-fresh-300 active:scale-95"
              >
                <Minus size={20} />
              </button>
              <input
                id="ing-qty"
                ref={qtyRef}
                type="text"
                inputMode="decimal"
                className={`input min-w-0 flex-1 text-center font-semibold ${showErr("quantity") ? "border-coral-400 focus:border-coral-400 focus:ring-coral-100" : ""}`}
                value={qtyText}
                aria-invalid={!!showErr("quantity")}
                onChange={(e) => setQtyText(e.target.value.replace(/[^0-9.]/g, "").slice(0, 7))}
              />
              <button
                type="button"
                aria-label="수량 늘리기"
                onClick={() => bumpQty(1)}
                className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl border border-ink-300/40 bg-white text-ink-700 transition-all hover:border-fresh-300 active:scale-95"
              >
                <Plus size={20} />
              </button>
              <div className="relative w-[92px] shrink-0 sm:w-[120px]">
                <label htmlFor="ing-unit" className="sr-only">단위</label>
                <select
                  id="ing-unit"
                  className="input appearance-none pr-8 font-semibold"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />
              </div>
            </div>
          </Field>

          <Field
            label="유통기한"
            htmlFor="ing-expiry"
            error={showErr("expiresAt")}
            hint={
              expiresAt
                ? expiryDays !== null && expiryDays < 0
                  ? <span className="text-amberish-600">{formatKoreanDate(expiresAt)} · 이미 기한이 지난 날짜예요</span>
                  : `${formatKoreanDate(expiresAt)}까지 · ${expiryDays === 0 ? "오늘까지" : `${expiryDays}일 남음`}`
                : "기한을 모르면 비워두세요. 나중에 상세 화면에서 입력할 수 있어요."
            }
          >
            <input
              id="ing-expiry"
              type="date"
              className={`input ${showErr("expiresAt") ? "border-coral-400 focus:border-coral-400 focus:ring-coral-100" : ""}`}
              value={expiresAt}
              aria-invalid={!!showErr("expiresAt")}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {EXPIRY_PRESETS.map((d) => {
                const v = toISODate(addDays(todayStart(), d));
                return (
                  <button key={d} type="button" aria-pressed={expiresAt === v} onClick={() => setExpiresAt(v)} className={optionBtn(expiresAt === v)}>
                    {d === 7 ? "일주일" : d === 14 ? "2주" : d === 30 ? "한 달" : `${d}일`}
                  </button>
                );
              })}
              <button type="button" aria-pressed={!expiresAt} onClick={() => setExpiresAt("")} className={optionBtn(!expiresAt)}>
                모름
              </button>
            </div>
          </Field>

          <Field label="보관 위치">
            <div className="flex gap-2">
              {(Object.keys(STORAGE_LABELS) as StorageType[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  aria-pressed={storage === st}
                  onClick={() => setStorage(st)}
                  className={`${optionBtn(storage === st)} flex-1 justify-center`}
                >
                  <span aria-hidden>{STORAGE_ICON[st]}</span> {STORAGE_LABELS[st]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="종류">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABELS) as IngredientCategory[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={optionBtn(category === c)}
                >
                  <span aria-hidden>{CATEGORY_EMOJIS[c]}</span> {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </Field>

          {/* 구매일·메모 — 자주 바꾸지 않으므로 접어둔다 */}
          <div className="rounded-2xl bg-warmwhite">
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls="ing-more"
              onClick={() => setMoreOpen((v) => !v)}
              className="flex min-h-[52px] w-full items-center justify-between gap-2 px-4 text-left text-[16.5px] font-bold text-ink-700"
            >
              <span>
                구매일·메모
                <span className="ml-2 font-medium text-ink-500">
                  {purchasedAt === today ? "오늘 구매" : purchasedAt ? `${formatKoreanDate(purchasedAt)} 구매` : "구매일 없음"}
                  {memo.trim() && " · 메모 있음"}
                </span>
              </span>
              <ChevronDown size={20} className={`shrink-0 text-ink-400 transition-transform ${moreOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {moreOpen && (
              <div id="ing-more" className="space-y-4 px-4 pb-4">
                <Field label="구매일" htmlFor="ing-bought" error={showErr("purchasedAt")}>
                  <input
                    id="ing-bought"
                    type="date"
                    max={today}
                    className={`input ${showErr("purchasedAt") ? "border-coral-400 focus:border-coral-400 focus:ring-coral-100" : ""}`}
                    value={purchasedAt}
                    aria-invalid={!!showErr("purchasedAt")}
                    onChange={(e) => setPurchasedAt(e.target.value)}
                  />
                </Field>
                <Field label="메모 (선택)" htmlFor="ing-memo">
                  <input
                    id="ing-memo"
                    className="input"
                    placeholder="예: 찌개용, 반찬용"
                    value={memo}
                    maxLength={40}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </Field>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary min-h-[56px] w-full text-[19.5px]">
            <Plus size={22} />
            {trimmed && trimmed.length <= 8 ? `${josa(trimmed, "을/를")} 냉장고에 추가` : "냉장고에 추가"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {!recognized && !recognizing && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="card card-hover flex w-full flex-col items-center gap-3 border-2 border-dashed border-fresh-200 bg-fresh-50/40 px-6 py-12"
            >
              <span className="grid h-[72px] w-[72px] place-items-center rounded-3xl bg-white text-fresh-500 shadow-soft">
                <ImagePlus size={36} />
              </span>
              <span className="text-center">
                <span className="block text-[20.5px] font-bold text-ink-900">사진 올리기</span>
                <span className="mt-1 block text-[16.5px] text-ink-500">식재료나 영수증 사진에서 재료를 찾아요.</span>
                <span className="mt-2.5 inline-block rounded-chip bg-amberish-50 px-3 py-1 text-[14.5px] font-semibold text-amberish-600">
                  데모 — 예시 인식 결과가 나와요
                </span>
              </span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handlePhoto(f);
            }}
          />

          {recognizing && (
            <div className="card flex flex-col items-center gap-3 px-6 py-12" role="status">
              <Loader2 className="animate-spin text-fresh-500" size={40} />
              <p className="text-[18.5px] font-bold text-ink-700">사진 속 식재료를 찾고 있어요…</p>
            </div>
          )}

          {recognized && (
            <div className="card animate-pop-in space-y-4 p-4 sm:p-5">
              <div>
                <p className="text-[20.5px] font-bold text-ink-900">
                  {recognized.length > 0 ? `식재료 ${recognized.length}개를 찾았어요` : "추가할 식재료가 없어요"}
                </p>
                <p className="mt-0.5 text-[16.5px] text-ink-500">
                  {recognized.length > 0 ? "수량을 확인하고 추가해주세요." : "다시 찍거나 직접 입력해주세요."}
                </p>
              </div>
              {recognized.length > 0 && (
                <ul className="divide-y divide-ink-300/20 rounded-2xl border border-ink-300/25">
                  {recognized.map((r, idx) => (
                    <li key={r.name} className="flex items-center gap-3 px-3 py-2.5">
                      <IngredientThumb
                        name={r.name}
                        emoji={r.emoji}
                        className="h-12 w-12 rounded-xl bg-fresh-50 text-xl"
                        sizes="48px"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[18px] font-bold text-ink-900">{r.name}</p>
                        <button
                          type="button"
                          onClick={() => removeRecognized(idx)}
                          className="text-[14.5px] font-semibold text-ink-400 hover:text-coral-600"
                        >
                          빼기
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`${r.name} 수량 줄이기`}
                          onClick={() => changeRecognizedQty(idx, -1)}
                          className="grid h-11 w-11 place-items-center rounded-xl border border-ink-300/40 bg-white active:scale-95"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="min-w-[44px] text-center text-[17.5px] font-bold">
                          {r.quantity}
                          {r.unit}
                        </span>
                        <button
                          type="button"
                          aria-label={`${r.name} 수량 늘리기`}
                          onClick={() => changeRecognizedQty(idx, 1)}
                          className="grid h-11 w-11 place-items-center rounded-xl border border-ink-300/40 bg-white active:scale-95"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setRecognized(null)} className="btn-ghost min-h-[52px] flex-1">
                  다시 찍기
                </button>
                <button
                  type="button"
                  onClick={submitRecognized}
                  disabled={recognized.length === 0}
                  className="btn-primary min-h-[52px] flex-1"
                >
                  <Check size={21} />
                  {recognized.length > 0 ? `${recognized.length}개 추가` : "추가"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
