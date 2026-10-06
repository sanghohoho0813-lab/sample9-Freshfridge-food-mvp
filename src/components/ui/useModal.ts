"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 시트·대화상자 공통 동작.
 * - Esc 로 닫기
 * - 열리면 대화상자 안으로 포커스를 옮기고(autoFocus 가 있으면 그것), Tab 이 밖으로 나가지 않게 가둔다
 * - 닫히면 열기 전에 누른 버튼으로 포커스를 돌려준다
 * - 열려 있는 동안 뒤 화면 스크롤을 막고, 떠 있는 공용 뒤로·앞으로 버튼과 토스트를 숨긴다(globals.css)
 */
export function useModal(onClose: () => void, containerRef: RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const box = containerRef.current;
    if (box && !box.contains(document.activeElement)) {
      const first = box.querySelector<HTMLElement>("[autofocus]") ?? box.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? box).focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !containerRef.current) return;
      const items = [...containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent);
      if (items.length === 0) return;
      const [first, last] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.documentElement.classList.remove("modal-open");
      // 열었던 버튼이 아직 화면에 있으면 그리로 돌아간다 (목록에서 사라졌으면 그대로 둔다)
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [containerRef]);
}
