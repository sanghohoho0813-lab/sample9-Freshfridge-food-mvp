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
        className="sheet-backdrop"
        onClick={onClose}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="sheet-panel sm:max-w-sm" ref={boxRef} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
          <span className="sheet-grabber" aria-hidden />
          <h3 id="confirm-title" className="pt-1 text-[21px] font-bold tracking-[-0.02em] text-ink-900">
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
              className={tone === "danger" ? "btn-danger min-h-[52px]" : "btn-primary min-h-[52px]"}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
