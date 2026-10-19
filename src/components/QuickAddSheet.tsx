"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import type { Ingredient, StorageType } from "@/lib/types";
import { STORAGE_LABELS } from "@/lib/types";
import { ingredientDefaults } from "@/lib/demo-data";
import { addDays, formatKoreanDate, shelfLabel, toISODate, todayStart } from "@/lib/expiry-calculator";
import { josa } from "@/lib/text";
import { amountStep, formatAmount } from "@/lib/quantity";
import IngredientThumb from "./IngredientThumb";
import Portal from "./Portal";
import ChoiceChip from "./ui/ChoiceChip";
import { StepButton } from "./ui/Stepper";
import { useModal } from "./ui/useModal";

export interface QuickAddValue {
  name: string;
  quantity: number;
  unit: string;
  storage: StorageType;
  expiresAt: string | null;
  /** new: 따로 추가 / merge: 기존 재료에 더하기 */
  mode: "new" | "merge";
}

const EXPIRY_PRESETS = [3, 7, 14, 30];

/**
 * 장보기에서 산 재료를 냉장고에 넣는 시트.
 * 재료별 보통 값(단위·보관위치·보관기간)을 미리 채워 보여주고, 확인을 눌러야 들어간다.
 * 같은 재료가 냉장고에 있으면 "따로 추가 / 기존 것에 더하기"를 결과와 함께 고른다.
 */
export default function QuickAddSheet({
  name,
  existing,
  progress,
  onConfirm,
  onClose,
}: {
  name: string;
  /** 같은 이름으로 이미 냉장고에 있는 재료 (더하기 대상) */
  existing?: Ingredient;
  /** 구매한 것을 차례로 넣는 중이면 "1/3" */
  progress?: { index: number; total: number };
  onConfirm: (value: QuickAddValue) => void;
  onClose: () => void;
}) {
  const d = ingredientDefaults(name);
  const step = amountStep(existing?.unit ?? d.unit);
  const [quantity, setQuantity] = useState(d.typicalQty ?? (d.unit === "g" ? 300 : step));
  const [storage, setStorage] = useState<StorageType>(d.storage);
  const [days, setDays] = useState<number | null>(d.shelfDays);
  const [mode, setMode] = useState<"new" | "merge">("new");
  const merging = mode === "merge" && !!existing;
  const unit = merging ? existing.unit : d.unit;

  const expiresAt = days === null ? null : toISODate(addDays(todayStart(), days));
  const boxRef = useRef<HTMLDivElement>(null);
  useModal(onClose, boxRef);
  const done = useRef(false);
  const isLast = !progress || progress.index >= progress.total;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 backdrop-blur-[2px] sm:items-center"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
      >
        <div
          className="max-h-[88dvh] w-full max-w-md animate-pop-in overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lift sm:rounded-3xl sm:pb-5"
          ref={boxRef}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <IngredientThumb name={name} category={d.category} className="h-14 w-14 bg-fresh-50" sizes="56px" />
            <div className="min-w-0 flex-1">
              {progress && progress.total > 1 && (
                <p className="text-[14.5px] font-semibold tabular-nums text-ink-500">
                  구매한 것 {progress.index}/{progress.total}
                </p>
              )}
              <h3 id="quick-add-title" className="text-[20.5px] font-bold leading-snug text-ink-900">
                {josa(name, "을/를")} 냉장고에 넣을까요?
              </h3>
            </div>
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-400 hover:bg-ink-900/[0.04]"
            >
              <X size={22} aria-hidden />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {existing && (
              <fieldset className="rounded-2xl bg-amberish-50/70 p-3">
                <legend className="sr-only">이미 있는 재료를 어떻게 넣을까요</legend>
                <p className="text-[15.5px] font-semibold text-ink-800">
                  이미 {josa(formatAmount(existing.quantity, existing.unit), "이/가")} 있어요 (
                  {existing.expiresAt ? `${formatKoreanDate(existing.expiresAt)}까지` : "기한 모름"})
                </p>
                <div className="mt-2 flex gap-2">
                  <ChoiceChip
                    selected={mode === "new"}
                    onClick={() => setMode("new")}
                    className="flex-1 justify-center"
                  >
                    따로 추가
                  </ChoiceChip>
                  <ChoiceChip
                    selected={mode === "merge"}
                    onClick={() => setMode("merge")}
                    className="flex-1 justify-center"
                  >
                    기존 것에 더하기
                  </ChoiceChip>
                </div>
                <p className="mt-2 text-[14.5px] leading-snug text-ink-600">
                  {merging
                    ? `${formatAmount(existing.quantity, unit)} → ${formatAmount(existing.quantity + quantity, unit)}, 기한은 그대로예요.`
                    : "새로 산 것을 기한과 함께 따로 관리해요."}
                </p>
              </fieldset>
            )}

            <div className="flex items-center justify-between rounded-2xl bg-warmwhite p-3">
              <p className="pl-1 text-[16.5px] font-semibold text-ink-700">{merging ? "더할 양" : "수량"}</p>
              <div className="flex items-center gap-3">
                <StepButton size="sm" dir="down" onClick={() => setQuantity((q) => Math.max(step, q - step))} />
                <span className="min-w-[72px] text-center text-[20.5px] font-bold tabular-nums">
                  {formatAmount(quantity, unit)}
                </span>
                <StepButton size="sm" dir="up" onClick={() => setQuantity((q) => q + step)} />
              </div>
            </div>

            {!merging && (
              <>
                <div>
                  <p className="mb-2 text-[15.5px] font-bold text-ink-700">보관 위치</p>
                  <div className="flex gap-2">
                    {(Object.keys(STORAGE_LABELS) as StorageType[]).map((s) => (
                      <ChoiceChip
                        key={s}
                        selected={storage === s}
                        onClick={() => setStorage(s)}
                        className="flex-1 justify-center"
                      >
                        {STORAGE_LABELS[s]}
                      </ChoiceChip>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[15.5px] font-bold text-ink-700">
                    유통기한{" "}
                    <span className="font-medium text-ink-500">
                      {expiresAt ? `· ${formatKoreanDate(expiresAt)}까지` : "· 모름"}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set([...(d.shelfDays ? [d.shelfDays] : []), ...EXPIRY_PRESETS])]
                      .sort((a, b) => a - b)
                      .map((n) => (
                        <ChoiceChip key={n} selected={days === n} onClick={() => setDays(n)}>
                          {shelfLabel(n)}
                        </ChoiceChip>
                      ))}
                    <ChoiceChip selected={days === null} onClick={() => setDays(null)}>
                      모름
                    </ChoiceChip>
                  </div>
                  {d.shelfDays !== null && days === d.shelfDays && (
                    <p className="mt-1.5 text-[14.5px] text-ink-500">
                      {josa(name, "은/는")} 보통 {shelfLabel(d.shelfDays)} 보관해요. 포장지 날짜가 다르면 바꿔주세요.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost min-h-[52px] flex-1">
              나중에
            </button>
            <button
              type="button"
              onClick={() => {
                if (done.current) return; // 연타로 두 번 들어가지 않게
                done.current = true;
                onConfirm({ name, quantity, unit, storage, expiresAt, mode: merging ? "merge" : "new" });
              }}
              className="btn-primary min-h-[52px] flex-[1.4]"
            >
              {merging ? "기존 것에 더하기" : isLast ? "냉장고에 넣기" : "넣고 다음"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
