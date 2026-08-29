"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { WasteReason } from "@/lib/types";

const REASONS: WasteReason[] = [
  "유통기한 지남",
  "너무 많이 구매",
  "먹을 기회 없음",
  "보관 실패",
  "기타",
];

export default function DiscardModal({
  ingredientName,
  onConfirm,
  onClose,
}: {
  ingredientName: string;
  onConfirm: (reason: WasteReason) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<WasteReason>("유통기한 지남");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-pop-in rounded-t-3xl bg-white p-5 pb-8 shadow-lift sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[22.1px] font-extrabold text-ink-900">
              {ingredientName}, 버리게 된 이유가 있나요?
            </h3>
            <p className="mt-1 text-[16.2px] text-ink-500">
              기록해두면 다음 장보기에서 낭비를 줄일 수 있어요.
            </p>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-400 hover:bg-fresh-50"
          >
            <X size={23} />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`chip border ${
                reason === r
                  ? "border-fresh-400 bg-fresh-50 text-fresh-700"
                  : "border-ink-300/30 bg-white text-ink-500 hover:border-fresh-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            className="flex-1 rounded-2xl bg-coral-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-coral-600 active:scale-[0.98]"
          >
            버렸어요
          </button>
        </div>
      </div>
    </div>
  );
}
