"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Check, ChevronDown, ImagePlus, ListPlus, Loader2, PencilLine, X } from "lucide-react";
import { useFridge, useStore, useUndoToast } from "@/lib/store";
import {
  CATEGORY_LABELS,
  STORAGE_LABELS,
  type Ingredient,
  type IngredientCategory,
  type StorageType,
} from "@/lib/types";
import {
  addDays,
  daysLeft,
  formatKoreanDate,
  shelfLabel,
  sortByExpiry,
  toISODate,
  todayStart,
} from "@/lib/expiry-calculator";
import { amountStep, formatAmount } from "@/lib/quantity";
import { NAME_MAX, toAmount, validateDates, validateName, validateQuantity } from "@/lib/validation";
import { josa } from "@/lib/text";
import { recognizeIngredientsFromImage, type RecognizedIngredient } from "@/lib/image-recognition";
import { ingredientDefaults, knownIngredient, newId, type IngredientDefaults } from "@/lib/demo-data";
import { frequentlyEaten } from "@/lib/insights";
import IngredientThumb from "@/components/IngredientThumb";
import CategoryIcon from "@/components/CategoryIcon";
import PageHeader from "@/components/ui/PageHeader";
import StickyActionBar from "@/components/ui/StickyActionBar";
import Field, { INPUT_ERROR } from "@/components/ui/Field";
import ChoiceChip from "@/components/ui/ChoiceChip";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { QuantityInput, StepButton } from "@/components/ui/Stepper";

const UNITS = ["개", "팩", "모", "단", "봉", "g", "kg", "ml", "L", "병", "통", "장", "손", "포"];
const EXPIRY_PRESETS = [3, 7, 14, 30];
/** 기록이 적을 때 채우는 자주 사는 재료 */
const STARTER_PICKS = ["우유", "계란", "두부", "대파", "양파", "새송이버섯", "닭가슴살", "토마토", "사과", "바나나"];

/** 유통기한: 아직 고르지 않음(null) · 모름("unknown") · 날짜 */
type ExpiryChoice = string | "unknown" | null;

type Mode = "new" | "merge";

const defaultQty = (d: IngredientDefaults) => String(d.typicalQty ?? (d.unit === "g" ? 300 : 1));

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
  const { addIngredient, restockIngredient, showToast, state } = useStore();
  const showUndo = useUndoToast();
  const fridge = useFridge();
  const [tab, setTab] = useState<"manual" | "photo">("manual");
  const today = toISODate(todayStart());

  // ── 직접 입력 ──────────────────────────────────────────────
  // 검색 결과가 없을 때 "식재료 추가하기"로 넘어오면 이름(과 아는 재료면 보통 값)을 채운다
  const [init] = useState(() => {
    const n = (params.get("name") ?? "").trim().slice(0, NAME_MAX);
    return { name: n, d: n ? knownIngredient(n) : null };
  });
  const [name, setName] = useState(init.name);
  const [qtyText, setQtyText] = useState(init.d ? defaultQty(init.d) : "1");
  const [unit, setUnit] = useState(init.d?.unit ?? "개");
  const [category, setCategory] = useState<IngredientCategory>(init.d?.category ?? "etc");
  const [storage, setStorage] = useState<StorageType>(init.d?.storage ?? "fridge");
  const [expiry, setExpiry] = useState<ExpiryChoice>(() =>
    !init.d ? null : init.d.shelfDays === null ? "unknown" : toISODate(addDays(todayStart(), init.d.shelfDays))
  );
  const [purchasedAt, setPurchasedAt] = useState(today);
  const [memo, setMemo] = useState("");
  const [mode, setMode] = useState<Mode>("new");
  // 사용자가 직접 바꾼 칸은 기본값으로 덮어쓰지 않는다
  const [touched, setTouched] = useState({ unit: false, category: false, storage: false, expiry: false, qty: false });
  /** 지금 채워진 기본값이 어느 재료의 것인지 (안내 문구용) */
  const [defaultsFrom, setDefaultsFrom] = useState<IngredientDefaults | null>(init.d);
  const [moreOpen, setMoreOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  /** 이름이 아는 재료면, 사용자가 손대지 않은 칸만 그 재료의 보통 값으로 채운다 */
  const applyDefaults = (nextName: string, opts: { force?: boolean } = {}) => {
    const d = knownIngredient(nextName);
    setDefaultsFrom(d);
    if (!d) return;
    const t = opts.force ? { unit: false, category: false, storage: false, expiry: false, qty: false } : touched;
    if (!t.unit) setUnit(d.unit);
    if (!t.category) setCategory(d.category);
    if (!t.storage) setStorage(d.storage);
    if (!t.qty) setQtyText(defaultQty(d));
    if (!t.expiry) setExpiry(d.shelfDays === null ? "unknown" : toISODate(addDays(todayStart(), d.shelfDays)));
    if (opts.force) setTouched({ unit: false, category: false, storage: false, expiry: false, qty: false });
  };

  const trimmed = name.trim();
  const existing = useMemo(
    () => (trimmed ? sortByExpiry(fridge.filter((i) => i.name === trimmed)) : []),
    [fridge, trimmed]
  );
  // 더하기는 기한이 가장 늦은(가장 최근에 산) 것에 — 새 재료와 가장 비슷하다
  const mergeTarget: Ingredient | undefined = existing[existing.length - 1];
  const merging = mode === "merge" && !!mergeTarget;
  const unitNow = merging ? mergeTarget.unit : unit;

  // 자주 사는 재료 — 내 기록에서 자주 먹은 것 먼저, 모자라면 기본 목록으로 채운다
  const picks = useMemo(() => {
    const mine = [...frequentlyEaten(state.logs, { days: 90 }).entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
    return [...new Set([...mine, ...STARTER_PICKS])].slice(0, 10).map((n) => ingredientDefaults(n));
  }, [state.logs]);

  const expiresAt = expiry === "unknown" || expiry === null ? "" : expiry;
  const dates = validateDates({ purchasedAt, expiresAt, today });
  const errors = {
    name: validateName(name),
    quantity: validateQuantity(qtyText),
    expiry: merging ? null : expiry === null ? "유통기한을 골라주세요. 모르면 '모름'을 눌러주세요." : dates.expiresAt,
    purchasedAt: merging ? null : dates.purchasedAt,
  };
  const hasError = Object.values(errors).some(Boolean);
  const showErr = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  const pick = (d: IngredientDefaults) => {
    setName(d.name);
    setMode("new");
    applyDefaults(d.name, { force: true });
    requestAnimationFrame(() => qtyRef.current?.focus());
  };

  const reset = () => {
    setName("");
    setQtyText("1");
    setUnit("개");
    setCategory("etc");
    setStorage("fridge");
    setExpiry(null);
    setMemo("");
    setPurchasedAt(today);
    setMode("new");
    setTouched({ unit: false, category: false, storage: false, expiry: false, qty: false });
    setDefaultsFrom(null);
    setSubmitted(false);
    setDetailsOpen(false);
    setMoreOpen(false);
    requestAnimationFrame(() => nameRef.current?.focus());
  };

  const save = (andContinue: boolean) => {
    if (saving) return; // 화면이 넘어가는 동안 다시 눌러도 두 번 들어가지 않게
    setSubmitted(true);
    if (hasError) {
      if (errors.name) nameRef.current?.focus();
      else if (errors.quantity) qtyRef.current?.focus();
      else if (errors.expiry) document.getElementById("ing-expiry")?.focus();
      else if (errors.purchasedAt) {
        setMoreOpen(true);
        requestAnimationFrame(() => document.getElementById("ing-bought")?.focus());
      }
      return;
    }
    const amount = toAmount(qtyText);
    const d = knownIngredient(trimmed);
    // 예상 금액: 아는 재료면 보통 사는 양의 금액을 비례로, 모르면 3,000원으로 어림
    const price = d ? Math.round((d.price * amount) / (d.typicalQty ?? amount)) : 3000;

    let targetId: string;
    if (merging) {
      targetId = mergeTarget.id;
      const token = restockIngredient(targetId, amount, price);
      showUndo(`기존 ${trimmed}에 더했어요 · ${formatAmount(mergeTarget.quantity + amount, mergeTarget.unit)}`, token);
    } else {
      targetId = newId("ing");
      const token = addIngredient(
        {
          name: trimmed,
          emoji: d?.emoji ?? "",
          quantity: amount,
          unit,
          category,
          storage,
          purchasedAt: purchasedAt || today,
          expiresAt: expiresAt || null,
          memo: memo.trim() || undefined,
          price,
        },
        { id: targetId }
      );
      showUndo(`${josa(trimmed, "을/를")} ${STORAGE_LABELS[storage]}에 넣었어요`, token);
    }
    if (andContinue) {
      reset();
      return;
    }
    setSaving(true);
    // 냉장고 목록에서 방금 넣은 재료를 바로 찾을 수 있게 표시
    router.push(`/fridge?added=${targetId}`);
  };

  // ── 사진 데모 ──────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [recognized, setRecognized] = useState<(RecognizedIngredient & { merge: boolean })[] | null>(null);

  const handlePhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("이미지 파일만 올릴 수 있어요");
      return;
    }
    setRecognizing(true);
    setRecognized(null);
    try {
      const result = await recognizeIngredientsFromImage(file);
      setRecognized(result.map((r) => ({ ...r, merge: false })));
    } catch {
      showToast("사진을 읽지 못했어요. 다시 시도해주세요");
    } finally {
      setRecognizing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateRecognized = (idx: number, patch: Partial<RecognizedIngredient & { merge: boolean }>) =>
    setRecognized((prev) => (prev ? prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)) : prev));

  const submitRecognized = () => {
    if (!recognized || recognized.length === 0 || saving) return;
    setSaving(true);
    for (const r of recognized) {
      const target = r.merge ? sortByExpiry(fridge.filter((i) => i.name === r.name)).at(-1) : undefined;
      if (target) restockIngredient(target.id, r.quantity, 3000);
      else
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
    showToast(`${recognized.length}개 식재료를 냉장고에 넣었어요`);
    router.push("/fridge");
  };

  const expiryHint = (() => {
    if (merging) return null;
    if (expiry === null) return defaultsFrom ? null : "포장지에 적힌 날짜를 넣거나, 보통 보관 기간을 골라주세요.";
    if (expiry === "unknown")
      return "기한을 모르면 우선소비 알림을 받을 수 없어요. 나중에 상세 화면에서 넣을 수 있어요.";
    const d = daysLeft(expiry);
    const when = d !== null && d < 0 ? "이미 기한이 지난 날짜예요" : d === 0 ? "오늘까지" : `${d}일 남음`;
    const typical =
      defaultsFrom && !touched.expiry && defaultsFrom.shelfDays !== null
        ? ` · ${josa(defaultsFrom.name, "은/는")} 보통 ${shelfLabel(defaultsFrom.shelfDays)} 보관해요. 포장지 날짜가 다르면 바꿔주세요.`
        : "";
    return `${formatKoreanDate(expiry)}까지 · ${when}${typical}`;
  })();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="식재료 추가" back="/" />

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save(false);
            }}
            noValidate
            className="card space-y-6 p-4 sm:p-6"
          >
            {/* 자주 사는 재료 — 누르면 이름과 보통 값이 채워지고, 수량 칸으로 이동한다 */}
            <div>
              <p className="mb-2 text-[16.5px] font-bold text-ink-700">자주 사는 재료</p>
              <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                  {picks.map((d) => (
                    <ChoiceChip
                      key={d.name}
                      selected={trimmed === d.name}
                      onClick={() => pick(d)}
                      className="py-1 pl-1 pr-3.5"
                    >
                      <IngredientThumb
                        name={d.name}
                        category={d.category}
                        className="h-9 w-9 rounded-lg"
                        sizes="36px"
                      />
                      {d.name}
                    </ChoiceChip>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-px bg-ink-300/20" aria-hidden />

            <Field label="식재료 이름" htmlFor="ing-name" error={showErr("name")}>
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
                aria-describedby={showErr("name") ? "ing-name-msg" : undefined}
                onChange={(e) => {
                  setName(e.target.value);
                  setMode("new");
                  applyDefaults(e.target.value);
                }}
              />
            </Field>

            {/* 같은 재료가 이미 있을 때 — 두 가지 뜻을 결과로 보여주고 고르게 한다 */}
            {mergeTarget && (
              <fieldset className="rounded-2xl border border-amberish-100 bg-amberish-50/60 p-3.5 sm:p-4">
                <legend className="sr-only">이미 있는 재료를 어떻게 넣을까요</legend>
                <p className="text-[16.5px] font-bold text-ink-900">
                  냉장고에 이미 {trimmed} {josa(formatAmount(mergeTarget.quantity, mergeTarget.unit), "이/가")} 있어요
                  <span className="font-semibold text-ink-500">
                    {" "}
                    ({mergeTarget.expiresAt ? `${formatKoreanDate(mergeTarget.expiresAt)}까지` : "기한 모름"})
                  </span>
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      {
                        value: "new",
                        title: "따로 추가",
                        desc: "새로 산 것을 기한과 함께 따로 관리해요. 기한이 다르면 이쪽이에요.",
                      },
                      {
                        value: "merge",
                        title: "기존 것에 더하기",
                        desc: `${formatAmount(mergeTarget.quantity, mergeTarget.unit)} → ${josa(
                          formatAmount(
                            mergeTarget.quantity + (Number(qtyText) > 0 ? toAmount(qtyText) : 0),
                            mergeTarget.unit
                          ),
                          "이/가"
                        )} 되고, 기한은 ${
                          mergeTarget.expiresAt ? formatKoreanDate(mergeTarget.expiresAt) : "모름"
                        } 그대로예요.`,
                      },
                    ] as const
                  ).map((o) => (
                    <label
                      key={o.value}
                      className={`flex cursor-pointer gap-2.5 rounded-xl border bg-white p-3 transition-colors ${
                        mode === o.value ? "border-fresh-400 ring-2 ring-fresh-100" : "border-ink-900/[0.1]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="add-mode"
                        value={o.value}
                        checked={mode === o.value}
                        onChange={() => setMode(o.value)}
                        className="mt-1 h-5 w-5 shrink-0 accent-[#2e7f39]"
                      />
                      <span>
                        <span className="block text-[16.5px] font-bold text-ink-900">{o.title}</span>
                        <span className="block text-[15px] leading-snug text-ink-600">{o.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-5">
              <Field label={merging ? "더할 양" : "수량"} htmlFor="ing-qty" error={showErr("quantity")}>
                <div className="flex items-center gap-2">
                  <QuantityInput
                    id="ing-qty"
                    inputRef={qtyRef}
                    value={qtyText}
                    onChange={(v) => {
                      setQtyText(v);
                      setTouched((t) => ({ ...t, qty: true }));
                    }}
                    step={amountStep(unitNow)}
                    unitSuffix={merging ? unitNow : undefined}
                    invalid={!!showErr("quantity")}
                    describedBy={showErr("quantity") ? "ing-qty-msg" : undefined}
                  />
                  {!merging && (
                    <div className="relative w-[92px] shrink-0 sm:w-[120px]">
                      <label htmlFor="ing-unit" className="sr-only">
                        단위
                      </label>
                      <select
                        id="ing-unit"
                        className="input appearance-none pr-8 font-semibold"
                        value={unit}
                        onChange={(e) => {
                          setUnit(e.target.value);
                          setTouched((t) => ({ ...t, unit: true }));
                        }}
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
                  )}
                </div>
              </Field>

              {!merging && (
                <Field
                  label="유통기한"
                  htmlFor="ing-expiry"
                  error={showErr("expiry")}
                  hint={
                    expiryHint && (
                      <span
                        className={
                          expiry !== null && expiry !== "unknown" && (daysLeft(expiry) ?? 0) < 0
                            ? "text-amberish-700"
                            : ""
                        }
                      >
                        {expiryHint}
                      </span>
                    )
                  }
                >
                  <input
                    id="ing-expiry"
                    type="date"
                    className={`input ${showErr("expiry") ? INPUT_ERROR : ""}`}
                    value={expiresAt}
                    aria-invalid={!!showErr("expiry")}
                    aria-describedby="ing-expiry-msg"
                    onChange={(e) => {
                      setExpiry(e.target.value || null);
                      setTouched((t) => ({ ...t, expiry: true }));
                    }}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EXPIRY_PRESETS.map((d) => {
                      const v = toISODate(addDays(todayStart(), d));
                      return (
                        <ChoiceChip
                          key={d}
                          selected={expiry === v}
                          onClick={() => {
                            setExpiry(v);
                            setTouched((t) => ({ ...t, expiry: true }));
                          }}
                        >
                          {shelfLabel(d)}
                        </ChoiceChip>
                      );
                    })}
                    <ChoiceChip
                      selected={expiry === "unknown"}
                      onClick={() => {
                        setExpiry("unknown");
                        setTouched((t) => ({ ...t, expiry: true }));
                      }}
                    >
                      모름
                    </ChoiceChip>
                  </div>
                </Field>
              )}
            </div>

            {!merging && (
              <>
                {/* 보관 위치·종류 — 아는 재료면 한 줄 요약, 바꿀 때만 펼친다 */}
                {defaultsFrom && !detailsOpen ? (
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-warmwhite px-4 py-3">
                    <p className="min-w-0 text-[16px] text-ink-700">
                      <span className="font-bold">{STORAGE_LABELS[storage]}</span> 보관 ·{" "}
                      <span className="font-bold">{CATEGORY_LABELS[category]}</span>
                      <span className="block text-[14.5px] text-ink-500">
                        {josa(defaultsFrom.name, "을/를")} 보통 이렇게 보관해요
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setDetailsOpen(true)}
                      className="-mr-1 inline-flex min-h-[44px] shrink-0 items-center rounded-full px-2.5 text-[15.5px] font-semibold text-fresh-700 hover:bg-fresh-50"
                    >
                      바꾸기
                    </button>
                  </div>
                ) : (
                  <>
                    <Field label="보관 위치">
                      <div className="flex gap-2">
                        {(Object.keys(STORAGE_LABELS) as StorageType[]).map((st) => (
                          <ChoiceChip
                            key={st}
                            selected={storage === st}
                            onClick={() => {
                              setStorage(st);
                              setTouched((t) => ({ ...t, storage: true }));
                            }}
                            className="flex-1 justify-center"
                          >
                            {STORAGE_LABELS[st]}
                          </ChoiceChip>
                        ))}
                      </div>
                    </Field>

                    <Field label="종류">
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(CATEGORY_LABELS) as IngredientCategory[]).map((c) => (
                          <ChoiceChip
                            key={c}
                            selected={category === c}
                            onClick={() => {
                              setCategory(c);
                              setTouched((t) => ({ ...t, category: true }));
                            }}
                          >
                            <CategoryIcon category={c} size={17} />
                            {CATEGORY_LABELS[c]}
                          </ChoiceChip>
                        ))}
                      </div>
                    </Field>
                  </>
                )}

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
              </>
            )}

            {/* 저장 — 모바일은 화면 아래 고정이라 긴 입력 중에도 바로 누를 수 있다 */}
            <StickyActionBar>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => save(true)}
                  aria-label="추가하고 하나 더 입력"
                  className="btn-ghost min-h-[56px] shrink-0 px-4 text-[17px] lg:px-5"
                >
                  <ListPlus size={20} aria-hidden />
                  하나 더
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary min-h-[56px] min-w-0 flex-1 whitespace-nowrap px-4 text-[18.5px]"
                >
                  {merging
                    ? trimmed.length <= 4
                      ? `기존 ${trimmed}에 더하기`
                      : "기존 재료에 더하기"
                    : trimmed && trimmed.length <= 4
                      ? `${josa(trimmed, "을/를")} 냉장고에 추가`
                      : "냉장고에 추가"}
                </button>
              </div>
            </StickyActionBar>
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
                  <span className="grid h-[72px] w-[72px] place-items-center rounded-3xl bg-white text-fresh-600 shadow-soft">
                    <ImagePlus size={36} aria-hidden />
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
                <Loader2 className="animate-spin text-fresh-600" size={40} aria-hidden />
                <p className="text-[18.5px] font-bold text-ink-700">사진 속 식재료를 찾고 있어요…</p>
              </div>
            )}

            {recognized && (
              <div className="card animate-fade-in space-y-4 p-4 sm:p-5">
                <div>
                  <p className="text-[20.5px] font-bold text-ink-900">
                    {recognized.length > 0 ? `식재료 ${recognized.length}개를 찾았어요` : "추가할 식재료가 없어요"}
                  </p>
                  <p className="mt-0.5 text-[16.5px] text-ink-500">
                    {recognized.length > 0
                      ? "수량과 기한을 확인하고 추가해주세요. 기한은 보통 보관 기간으로 채웠어요."
                      : "다시 찍거나 직접 입력해주세요."}
                  </p>
                </div>
                {recognized.length > 0 && (
                  <ul className="divide-y divide-ink-900/[0.06] rounded-2xl border border-ink-900/[0.07]">
                    {recognized.map((r, idx) => {
                      const have = fridge.some((f) => f.name === r.name);
                      return (
                        <li key={r.name} className="px-3.5 py-3.5">
                          <div className="flex items-start gap-3">
                            <IngredientThumb
                              name={r.name}
                              category={r.category}
                              className="h-14 w-14 bg-warmwhite"
                              sizes="56px"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[18px] font-semibold leading-snug text-ink-900">{r.name}</p>
                                  <p className="text-[15px] text-ink-500">
                                    {formatKoreanDate(toISODate(addDays(todayStart(), r.suggestedExpiryDays)))}까지 ·
                                    보통 {shelfLabel(r.suggestedExpiryDays)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  aria-label={`${r.name} 빼기`}
                                  onClick={() =>
                                    setRecognized((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev))
                                  }
                                  className="-mr-1.5 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-coral-50 hover:text-coral-700"
                                >
                                  <X size={20} aria-hidden />
                                </button>
                              </div>
                              <div className="mt-2.5 flex items-center gap-2">
                                <StepButton
                                  size="sm"
                                  dir="down"
                                  label={`${r.name} 수량 줄이기`}
                                  onClick={() => updateRecognized(idx, { quantity: Math.max(1, r.quantity - 1) })}
                                  disabled={r.quantity <= 1}
                                />
                                <span className="min-w-[56px] text-center text-[17.5px] font-bold tabular-nums">
                                  {r.quantity}
                                  {r.unit}
                                </span>
                                <StepButton
                                  size="sm"
                                  dir="up"
                                  label={`${r.name} 수량 늘리기`}
                                  onClick={() => updateRecognized(idx, { quantity: r.quantity + 1 })}
                                />
                              </div>
                            </div>
                          </div>
                          {have && (
                            <fieldset className="mt-3 rounded-2xl bg-amberish-50/70 p-2.5">
                              <legend className="sr-only">{r.name} 넣는 방법</legend>
                              <p className="px-0.5 text-[14.5px] font-semibold text-amberish-700">
                                냉장고에 이미 있어요
                              </p>
                              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                                <ChoiceChip
                                  selected={!r.merge}
                                  onClick={() => updateRecognized(idx, { merge: false })}
                                  className="min-h-[42px] justify-center whitespace-nowrap px-1.5 text-[14.5px]"
                                >
                                  따로 추가
                                </ChoiceChip>
                                <ChoiceChip
                                  selected={r.merge}
                                  onClick={() => updateRecognized(idx, { merge: true })}
                                  className="min-h-[42px] justify-center whitespace-nowrap px-1.5 text-[14.5px]"
                                >
                                  기존 것에 더하기
                                </ChoiceChip>
                              </div>
                            </fieldset>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <StickyActionBar>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRecognized(null)} className="btn-ghost min-h-[56px] flex-1">
                      다시 찍기
                    </button>
                    <button
                      type="button"
                      onClick={submitRecognized}
                      disabled={recognized.length === 0}
                      className="btn-primary min-h-[56px] flex-[1.5]"
                    >
                      <Check size={21} aria-hidden />
                      {recognized.length > 0 ? `${recognized.length}개 추가` : "추가"}
                    </button>
                  </div>
                </StickyActionBar>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
