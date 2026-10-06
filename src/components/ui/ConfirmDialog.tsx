"use client";

import { useRef } from "react";
import Portal from "../Portal";
import { useModal } from "./useModal";

/** 되돌릴 수 없는 행동 전에 한 번 더 묻는 대화상자 */
export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = "danger",
  onConfirm,
  onClose,
}: {
  title: string;
  description?: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  useModal(onClose, boxRef);
  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
        onClick={onClose}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div
          className="w-full animate-pop-in rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lift sm:max-w-sm sm:rounded-3xl sm:pb-6"
          ref={boxRef}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id="confirm-title" className="text-[20.5px] font-extrabold text-ink-900">
            {title}
          </h3>
          {description && <p className="mt-2 text-[16.5px] leading-relaxed text-ink-500">{description}</p>}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button type="button" onClick={onClose} className="btn-ghost min-h-[52px]" autoFocus>
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={
                tone === "danger"
                  ? "inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-coral-500 px-4 text-[18px] font-semibold text-white transition-colors hover:bg-coral-600"
                  : "btn-primary min-h-[52px]"
              }
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
