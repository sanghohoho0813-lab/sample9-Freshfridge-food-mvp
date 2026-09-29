"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  History,
  LineChart,
  RefreshCcw,
  Refrigerator,
  ShoppingBasket,
  Thermometer,
} from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { formatWon } from "@/lib/expiry-calculator";
import { monthlyReport } from "@/lib/stats";

export default function MyPage() {
  const { ready, state, resetDemo, showToast } = useStore();
  const fridge = useFridge();
  const report = monthlyReport(state.logs, state.cooks).current;

  if (!ready) {
    return <div className="mx-auto max-w-5xl"><div className="skeleton h-40 w-full" /></div>;
  }

  const menu = [
    { href: "/fridge", label: "냉장고 설정", desc: `보관 중인 식재료 ${fridge.length}개`, icon: Refrigerator },
    { href: "/priority", label: "기본 보관기준", desc: "유통기한 D-2까지 '먼저 먹기'로 안내", icon: Thermometer },
    { href: "/shopping", label: "장보기 목록", desc: `담아둔 재료 ${state.shopping.filter((s) => !s.checked).length}개`, icon: ShoppingBasket },
    { href: "/history", label: "소비 기록", desc: "먹은 기록과 폐기 기록", icon: History },
    { href: "/report", label: "절약 기록", desc: `이번 달 ${formatWon(report.savedAmount)} 절약`, icon: LineChart },
    { href: "/notifications", label: "알림 설정", desc: "유통기한·레시피 알림", icon: Bell },
  ];

  return (
    <div className="mx-auto max-w-5xl animate-fade-up space-y-6">
      <h1 className="text-[28.5px] font-extrabold tracking-tight text-ink-900">마이페이지</h1>

      {/* 프로필 */}
      <section className="card flex items-center gap-4 p-5">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-fresh-100 text-3xl">
          🧑‍🍳
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[22px] font-extrabold text-ink-900">{state.userName}님</p>
          <p className="mt-0.5 text-[16.5px] text-ink-500">
            버리기 전에 먼저 먹는 습관을 만드는 중이에요 🌱
          </p>
        </div>
      </section>

      {/* 요약 */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "보관 중", value: `${fridge.length}개` },
          { label: "이번 달 사용", value: `${report.usedCount}개` },
          { label: "폐기율", value: `${report.wasteRate}%` },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-[15.5px] text-ink-400">{s.label}</p>
            <p className="mt-0.5 text-[20.5px] font-extrabold text-ink-900">{s.value}</p>
          </div>
        ))}
      </section>

      {/* 메뉴 */}
      <section className="card divide-y divide-fresh-50 p-2">
        {menu.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3.5 rounded-2xl p-3.5 transition-colors hover:bg-fresh-50/60"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-fresh-50 text-fresh-600">
              <Icon size={25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[18.5px] font-bold text-ink-900">{label}</p>
              <p className="text-[15.5px] text-ink-400">{desc}</p>
            </div>
            <ChevronRight size={22} className="shrink-0 text-ink-300" />
          </Link>
        ))}
      </section>

      {/* 데모 초기화 */}
      <button
        type="button"
        onClick={() => {
          resetDemo();
          showToast("데모 데이터를 초기화했어요", "🔄");
        }}
        className="btn-ghost w-full"
      >
        <RefreshCcw size={21} />
        데모 데이터 초기화
      </button>

      {/* 제작사 안내는 하단 공통 CTA가 담당하므로 여기서는 식품 안전 안내만 남긴다 */}
      <p className="pb-2 pt-1 text-center text-[14.5px] leading-relaxed text-ink-400">
        표시된 소비기한·유통기한 정보를 확인해주세요. 보관상태가 좋지 않다면 섭취하지 않는 것이
        좋습니다.
      </p>
    </div>
  );
}
