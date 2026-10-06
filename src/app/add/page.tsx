"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Check, ChevronDown, ImagePlus, Info, Loader2, PencilLine, Plus } from "lucide-react";
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
  shelfLabel,
  toISODate,
  todayStart,
} from "@/lib/expiry-calculator";
import { amountStep, formatAmount } from "@/lib/quantity";
import { NAME_MAX, toAmount, validateDates, validateName, validateQuantity } from "@/lib/validation";
import { josa } from "@/lib/text";
import { recognizeIngredientsFromImage, type RecognizedIngredient } from "@/lib/image-recognition";
import { newId } from "@/lib/demo-data";
import IngredientThumb from "@/components/IngredientThumb";
import PageHeader from "@/components/ui/PageHeader";
import Field, { INPUT_ERROR } from "@/components/ui/Field";
import ChoiceChip from "@/components/ui/ChoiceChip";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { QuantityInput, StepButton } from "@/components/ui/Stepper";

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

const NAME_EMOJI: Record<string, string> = Object.fromEntries(QUICK_ITEMS.map((q) => [q.name, q.emoji]));

const EXPIRY_PRESETS = [3, 7, 14, 30];

const STORAGE_ICON: Record<StorageType, string> = { fridge: "🧊", freezer: "❄️", pantry: "🌤️" };

export default function AddIngredientPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl">
          <div className="skeleton h-96 w-full" />
        </div>
      }
    >
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
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  // 사진 등록 데모 상태
  const fileRef = useRef<HTMLInputElement>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [recognized, setRecognized] = useState<RecognizedIngredient[] | null>(null);

  const trimmed = name.trim();
  const step = amountStep(unit);

  // 입력값 검증 — 제출을 시도한 뒤부터 칸 아래에 바로 보여준다
  const errors = {
    name: validateName(name),
    quantity: validateQuantity(qtyText),
    ...validateDates({ purchasedAt, expiresAt, today }),
  };
  const hasError = Object.values(errors).some(Boolean);
  const showErr = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  // 같은 이름의 재료가 이미 냉장고에 있으면 알려준다 (중복 등록 방지)
  const existing = useMemo(() => (trimmed ? fridge.filter((i) => i.name === trimmed) : []), [fridge, trimmed]);

  const expiryDays = daysLeft(expiresAt || null);

  const applyQuick = (q: (typeof QUICK_ITEMS)[number]) => {
    setName(q.name);
    setUnit(q.unit);
    setCategory(q.cat);
    setStorage(q.storage);
    setQtyText(q.unit === "g" ? "300" : "1");
    setExpiresAt(toISODate(addDays(todayStart(), q.days)));
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving) return; // 화면이 넘어가는 동안 다시 눌러도 두 번 들어가지 않게
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
    setSaving(true);
    const id = newId("ing");
    const token = addIngredient(
      {
        name: trimmed,
        emoji: NAME_EMOJI[trimmed] ?? CATEGORY_EMOJIS[category],
        quantity: toAmount(qtyText),
        unit,
        category,
        storage,
        purchasedAt: purchasedAt || today,
        expiresAt: expiresAt || null,
        memo: memo.trim() || undefined,
        price: QUICK_ITEMS.find((q) => q.name === trimmed)?.price ?? 3000,
      },
      { id }
    );
    showUndo(`${josa(trimmed, "을/를")} ${STORAGE_LABELS[storage]}에 넣었어요`, "🧊", token);
    // 냉장고 목록에서 방금 넣은 재료를 바로 찾을 수 있게 표시
    router.push(`/fridge?added=${id}`);
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
      prev ? prev.map((r, i) => (i === idx ? { ...r, quantity: Math.max(1, r.quantity + delta) } : r)) : prev
    );
  };

  const removeRecognized = (idx: number) => {
    setRecognized((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev));
  };

  const submitRecognized = () => {
    if (!recognized || recognized.length === 0 || saving) return;
    setSaving(true);
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

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="식재료 추가" />

      <SegmentedControl
        label="등록 방법"
        panelId="add-panel"
        value={tab}
        onChange={setTab}
        segments={[
          { value: "manual", label: "직접 입력", icon: <PencilLine size={20} aria-hidden /> },
          { value: "photo", label: "사진으로 추가", icon: <Camera size={20} aria-hidden /> },
        ]}
      />

      <div id="add-panel" role="tabpanel" aria-label={tab === "manual" ? "직접 입력" : "사진으로 추가"}>
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
                  <p className="flex items-start gap-1.5 text-amberish-700">
                    <Info size={17} className="mt-[3px] shrink-0" aria-hidden />
                    <span>
                      이미 냉장고에 있어요 ·{" "}
                      {existing.map((i) => `${formatAmount(i.quantity, i.unit)} ${dDayLabel(i.expiresAt)}`).join(", ")}{" "}
                      <Link
                        href={`/ingredient/${existing[0].id}`}
                        className="font-semibold underline underline-offset-2"
                      >
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
                className={`input ${showErr("name") ? INPUT_ERROR : ""}`}
                placeholder="예: 우유, 두부, 시금치"
                value={name}
                maxLength={NAME_MAX}
                autoComplete="off"
                enterKeyHint="next"
                aria-invalid={!!showErr("name")}
                aria-describedby={showErr("name") || existing.length > 0 ? "ing-name-msg" : undefined}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-5">
              <Field label="수량" htmlFor="ing-qty" error={showErr("quantity")}>
                <div className="flex items-center gap-2">
                  <QuantityInput
                    id="ing-qty"
                    inputRef={qtyRef}
                    value={qtyText}
                    onChange={setQtyText}
                    step={step}
                    invalid={!!showErr("quantity")}
                    describedBy={showErr("quantity") ? "ing-qty-msg" : undefined}
                  />
                  <div className="relative w-[92px] shrink-0 sm:w-[120px]">
                    <label htmlFor="ing-unit" className="sr-only">
                      단위
                    </label>
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
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
                      aria-hidden
                    />
                  </div>
                </div>
              </Field>

              <Field
                label="유통기한"
                htmlFor="ing-expiry"
                error={showErr("expiresAt")}
                hint={
                  expiresAt ? (
                    expiryDays !== null && expiryDays < 0 ? (
                      <span className="text-amberish-700">
                        {formatKoreanDate(expiresAt)} · 이미 기한이 지난 날짜예요
                      </span>
                    ) : (
                      `${formatKoreanDate(expiresAt)}까지 · ${expiryDays === 0 ? "오늘까지" : `${expiryDays}일 남음`}`
                    )
                  ) : (
                    "기한을 모르면 비워두세요. 나중에 상세 화면에서 입력할 수 있어요."
                  )
                }
              >
                <input
                  id="ing-expiry"
                  type="date"
                  className={`input ${showErr("expiresAt") ? INPUT_ERROR : ""}`}
                  value={expiresAt}
                  aria-invalid={!!showErr("expiresAt")}
                  aria-describedby="ing-expiry-msg"
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {EXPIRY_PRESETS.map((d) => {
                    const v = toISODate(addDays(todayStart(), d));
                    return (
                      <ChoiceChip key={d} selected={expiresAt === v} onClick={() => setExpiresAt(v)}>
                        {shelfLabel(d)}
                      </ChoiceChip>
                    );
                  })}
                  <ChoiceChip selected={!expiresAt} onClick={() => setExpiresAt("")}>
                    모름
                  </ChoiceChip>
                </div>
              </Field>
            </div>

            <Field label="보관 위치">
              <div className="flex gap-2">
                {(Object.keys(STORAGE_LABELS) as StorageType[]).map((st) => (
                  <ChoiceChip
                    key={st}
                    selected={storage === st}
                    onClick={() => setStorage(st)}
                    className="flex-1 justify-center"
                  >
                    <span aria-hidden>{STORAGE_ICON[st]}</span> {STORAGE_LABELS[st]}
                  </ChoiceChip>
                ))}
              </div>
            </Field>

            <Field label="종류">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_LABELS) as IngredientCategory[]).map((c) => (
                  <ChoiceChip key={c} selected={category === c} onClick={() => setCategory(c)}>
                    <span aria-hidden>{CATEGORY_EMOJIS[c]}</span> {CATEGORY_LABELS[c]}
                  </ChoiceChip>
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
                    {purchasedAt === today
                      ? "오늘 구매"
                      : purchasedAt
                        ? `${formatKoreanDate(purchasedAt)} 구매`
                        : "구매일 없음"}
                    {memo.trim() && " · 메모 있음"}
                  </span>
                </span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-ink-400 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {moreOpen && (
                <div id="ing-more" className="space-y-4 px-4 pb-4">
                  <Field label="구매일" htmlFor="ing-bought" error={showErr("purchasedAt")}>
                    <input
                      id="ing-bought"
                      type="date"
                      max={today}
                      className={`input ${showErr("purchasedAt") ? INPUT_ERROR : ""}`}
                      value={purchasedAt}
                      aria-invalid={!!showErr("purchasedAt")}
                      aria-describedby={showErr("purchasedAt") ? "ing-bought-msg" : undefined}
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

            <button type="submit" disabled={saving} className="btn-primary min-h-[56px] w-full text-[19.5px]">
              <Plus size={22} />
              {trimmed && trimmed.length <= 8 ? `${josa(trimmed, "을/를")} 냉장고에 추가` : "냉장고에 추가"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {!recognized && !recognizing && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="card card-hover flex w-full flex-col items-center gap-3 border-2 border-dashed border-fresh-200 bg-fresh-50/40 px-6 py-10"
                >
                  <span className="grid h-[72px] w-[72px] place-items-center rounded-3xl bg-white text-fresh-500 shadow-soft">
                    <ImagePlus size={36} />
                  </span>
                  <span className="text-center">
                    <span className="block text-[20.5px] font-bold text-ink-900">사진 올리기</span>
                    <span className="mt-1 block text-[16.5px] text-ink-500">
                      식재료나 영수증 사진에서 재료를 찾아요.
                    </span>
                  </span>
                </button>
                {/* 데모: 사진이 없어도 흐름을 바로 체험할 수 있게 */}
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-1 text-[15.5px]">
                  <span className="rounded-chip bg-amberish-50 px-2.5 py-0.5 text-[14px] font-semibold text-amberish-700">
                    데모
                  </span>
                  <span className="text-ink-500">예시 인식 결과가 나와요.</span>
                  <button
                    type="button"
                    onClick={() => void handlePhoto(new File([""], "sample.jpg", { type: "image/jpeg" }))}
                    className="inline-flex min-h-[44px] items-center font-semibold text-fresh-700 underline underline-offset-4"
                  >
                    예시 사진으로 해보기
                  </button>
                </div>
              </div>
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
                          {fridge.some((f) => f.name === r.name) && (
                            <span className="mr-2 text-[14.5px] font-semibold text-amberish-700">이미 있음</span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeRecognized(idx)}
                            className="text-[14.5px] font-semibold text-ink-500 underline-offset-2 hover:text-coral-700 hover:underline"
                          >
                            빼기
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StepButton
                            size="sm"
                            dir="down"
                            label={`${r.name} 수량 줄이기`}
                            onClick={() => changeRecognizedQty(idx, -1)}
                            disabled={r.quantity <= 1}
                          />
                          <span className="min-w-[44px] text-center text-[17.5px] font-bold">
                            {r.quantity}
                            {r.unit}
                          </span>
                          <StepButton
                            size="sm"
                            dir="up"
                            label={`${r.name} 수량 늘리기`}
                            onClick={() => changeRecognizedQty(idx, 1)}
                          />
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
    </div>
  );
}
