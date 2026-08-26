"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ImagePlus, Loader2, Minus, PencilLine, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  CATEGORY_EMOJIS,
  CATEGORY_LABELS,
  STORAGE_LABELS,
  type IngredientCategory,
  type StorageType,
} from "@/lib/types";
import { addDays, toISODate, todayStart } from "@/lib/expiry-calculator";
import {
  recognizeIngredientsFromImage,
  type RecognizedIngredient,
} from "@/lib/image-recognition";

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

export default function AddIngredientPage() {
  const router = useRouter();
  const { addIngredient, showToast } = useStore();
  const [tab, setTab] = useState<"manual" | "photo">("manual");

  // 직접 등록 폼 상태
  const today = toISODate(todayStart());
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("개");
  const [category, setCategory] = useState<IngredientCategory>("vegetable");
  const [storage, setStorage] = useState<StorageType>("fridge");
  const [purchasedAt, setPurchasedAt] = useState(today);
  const [expiresAt, setExpiresAt] = useState(toISODate(addDays(todayStart(), 7)));
  const [memo, setMemo] = useState("");

  // 사진 등록 데모 상태
  const fileRef = useRef<HTMLInputElement>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [recognized, setRecognized] = useState<RecognizedIngredient[] | null>(null);

  const applyQuick = (q: (typeof QUICK_ITEMS)[number]) => {
    setName(q.name);
    setUnit(q.unit);
    setCategory(q.cat);
    setStorage(q.storage);
    setQuantity(q.unit === "g" ? 300 : 1);
    setExpiresAt(toISODate(addDays(todayStart(), q.days)));
  };

  const submit = () => {
    if (!name.trim()) {
      showToast("식재료명을 입력해주세요", "✏️");
      return;
    }
    addIngredient({
      name: name.trim(),
      emoji: NAME_EMOJI[name.trim()] ?? CATEGORY_EMOJIS[category],
      quantity,
      unit,
      category,
      storage,
      purchasedAt,
      expiresAt: expiresAt || null,
      memo: memo.trim() || undefined,
      price: QUICK_ITEMS.find((q) => q.name === name.trim())?.price ?? 3000,
    });
    showToast(`${name.trim()}을(를) 냉장고에 넣었어요!`, "🧊");
    router.push("/fridge");
  };

  const handlePhoto = async (file: File) => {
    setRecognizing(true);
    setRecognized(null);
    const result = await recognizeIngredientsFromImage(file);
    setRecognized(result);
    setRecognizing(false);
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

  const submitRecognized = () => {
    if (!recognized) return;
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
    showToast(`${recognized.length}개의 식재료를 냉장고에 넣었어요!`, "📸");
    router.push("/fridge");
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-up space-y-5">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">식재료 추가 🧺</h1>
        <p className="mt-1 text-[13.5px] text-ink-500">
          냉장고 속 재료를 알면 장보기도 쉬워져요.
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1.5 rounded-2xl bg-fresh-50 p-1.5">
        {(
          [
            { key: "manual", label: "직접 입력", icon: PencilLine },
            { key: "photo", label: "사진으로 추가", icon: Camera },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13.5px] font-bold transition-all duration-200 ${
              tab === t.key ? "bg-white text-fresh-700 shadow-soft" : "text-ink-500"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "manual" ? (
        <div className="space-y-5">
          {/* 빠른 등록 */}
          <div className="card p-4">
            <p className="text-[13px] font-bold text-ink-700">빠른 등록</p>
            <p className="mt-0.5 text-[11.5px] text-ink-400">자주 쓰는 재료를 눌러 바로 채워요.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_ITEMS.map((q) => (
                <button
                  key={q.name}
                  type="button"
                  onClick={() => applyQuick(q)}
                  className={`chip border ${
                    name === q.name
                      ? "border-fresh-400 bg-fresh-50 text-fresh-700"
                      : "border-ink-300/30 bg-white text-ink-600 hover:border-fresh-200 hover:bg-fresh-50/50"
                  }`}
                >
                  {q.emoji} {q.name}
                </button>
              ))}
            </div>
          </div>

          {/* 직접 입력 폼 */}
          <div className="card space-y-4 p-5">
            <div>
              <label htmlFor="ing-name" className="mb-1.5 block text-[13px] font-bold text-ink-700">
                식재료명 <span className="text-coral-500">*</span>
              </label>
              <input
                id="ing-name"
                className="input"
                placeholder="예: 우유, 두부, 시금치"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ing-qty" className="mb-1.5 block text-[13px] font-bold text-ink-700">
                  수량
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="수량 줄이기"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink-300/40 bg-white transition-all hover:border-fresh-300 active:scale-95"
                  >
                    <Minus size={15} />
                  </button>
                  <input
                    id="ing-qty"
                    type="number"
                    min={1}
                    className="input text-center"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <button
                    type="button"
                    aria-label="수량 늘리기"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink-300/40 bg-white transition-all hover:border-fresh-300 active:scale-95"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="ing-unit" className="mb-1.5 block text-[13px] font-bold text-ink-700">
                  단위
                </label>
                <select
                  id="ing-unit"
                  className="input appearance-none"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[13px] font-bold text-ink-700">카테고리</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_LABELS) as IngredientCategory[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`chip border ${
                      category === c
                        ? "border-fresh-400 bg-fresh-50 text-fresh-700"
                        : "border-ink-300/30 bg-white text-ink-500 hover:border-fresh-200"
                    }`}
                  >
                    {CATEGORY_EMOJIS[c]} {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[13px] font-bold text-ink-700">보관 위치</p>
              <div className="flex gap-2">
                {(Object.keys(STORAGE_LABELS) as StorageType[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStorage(s)}
                    className={`chip flex-1 justify-center border py-2.5 ${
                      storage === s
                        ? "border-fresh-400 bg-fresh-50 text-fresh-700"
                        : "border-ink-300/30 bg-white text-ink-500 hover:border-fresh-200"
                    }`}
                  >
                    {s === "fridge" ? "🧊" : s === "freezer" ? "❄️" : "🌤️"} {STORAGE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ing-bought" className="mb-1.5 block text-[13px] font-bold text-ink-700">
                  구매일
                </label>
                <input
                  id="ing-bought"
                  type="date"
                  className="input"
                  value={purchasedAt}
                  onChange={(e) => setPurchasedAt(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="ing-expiry" className="mb-1.5 block text-[13px] font-bold text-ink-700">
                  유통기한
                </label>
                <input
                  id="ing-expiry"
                  type="date"
                  className="input"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[3, 5, 7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setExpiresAt(toISODate(addDays(todayStart(), d)))}
                  className="chip border border-ink-300/30 bg-white text-[12px] text-ink-500 hover:border-fresh-200 hover:bg-fresh-50/50"
                >
                  +{d}일
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="ing-memo" className="mb-1.5 block text-[13px] font-bold text-ink-700">
                메모 <span className="font-normal text-ink-400">(선택)</span>
              </label>
              <input
                id="ing-memo"
                className="input"
                placeholder="예: 찌개용, 반찬용"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>

            <button type="button" onClick={submit} className="btn-primary w-full py-3 text-[15px]">
              <Plus size={17} />
              냉장고에 추가
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {!recognized && !recognizing && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="card card-hover flex w-full flex-col items-center gap-3 border-2 border-dashed border-fresh-200 bg-fresh-50/40 px-6 py-14"
            >
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white text-fresh-500 shadow-soft">
                <ImagePlus size={30} />
              </span>
              <div className="text-center">
                <p className="text-[15px] font-bold text-ink-900">식재료 사진으로 등록</p>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  영수증이나 식재료 사진을 올리면 자동으로 인식해요.
                </p>
                <p className="mt-2 rounded-chip bg-amberish-50 px-3 py-1 text-[11px] font-semibold text-amberish-600">
                  데모 모드 — 예시 인식 결과가 표시돼요
                </p>
              </div>
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
            <div className="card flex flex-col items-center gap-3 px-6 py-14">
              <Loader2 className="animate-spin text-fresh-500" size={32} />
              <p className="text-[14px] font-bold text-ink-700">사진 속 식재료를 인식하고 있어요…</p>
            </div>
          )}

          {recognized && (
            <div className="card animate-pop-in space-y-4 p-5">
              <div>
                <p className="text-[15px] font-bold text-ink-900">
                  다음 식재료가 감지되었습니다 ✨
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-500">
                  수량을 확인하고 냉장고에 추가해주세요.
                </p>
              </div>
              <div className="space-y-2.5">
                {recognized.map((r, idx) => (
                  <div
                    key={r.name}
                    className="flex items-center gap-3 rounded-2xl bg-warmwhite p-3"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-fresh-50 text-xl">
                      {r.emoji}
                    </span>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-ink-900">{r.name}</p>
                      <p className="text-[11.5px] text-ink-400">
                        {CATEGORY_LABELS[r.category]} · 권장 소비 {r.suggestedExpiryDays}일
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="수량 줄이기"
                        onClick={() => changeRecognizedQty(idx, -1)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-ink-300/40 bg-white active:scale-95"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-10 text-center text-[13.5px] font-bold">
                        {r.quantity}
                        {r.unit}
                      </span>
                      <button
                        type="button"
                        aria-label="수량 늘리기"
                        onClick={() => changeRecognizedQty(idx, 1)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-ink-300/40 bg-white active:scale-95"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRecognized(null)}
                  className="btn-ghost flex-1"
                >
                  다시 찍기
                </button>
                <button type="button" onClick={submitRecognized} className="btn-primary flex-1">
                  <Check size={16} />
                  냉장고에 추가
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
