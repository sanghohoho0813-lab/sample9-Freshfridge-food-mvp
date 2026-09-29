"use client";

import Link from "next/link";
import { AlarmClock, BarChart3, ChefHat, ChevronRight, Snowflake, ShoppingBasket } from "lucide-react";
import { useStore } from "@/lib/store";
import { useNotifications } from "@/lib/notifications";
import type { AppNotification } from "@/lib/types";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/SkeletonList";

const KIND_ICON: Record<AppNotification["kind"], { icon: typeof AlarmClock; tone: string }> = {
  expiry: { icon: AlarmClock, tone: "bg-coral-50 text-coral-600" },
  recipe: { icon: ChefHat, tone: "bg-amberish-50 text-amberish-600" },
  freezer: { icon: Snowflake, tone: "bg-sky-50 text-sky-600" },
  shopping: { icon: ShoppingBasket, tone: "bg-ink-300/15 text-ink-600" },
  report: { icon: BarChart3, tone: "bg-fresh-50 text-fresh-700" },
};

export default function NotificationsPage() {
  const { ready, markNotificationsRead } = useStore();
  const notifications = useNotifications();
  const unread = notifications.filter((n) => !n.read);

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="skeleton h-10 w-1/2" />
        <SkeletonList rows={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-up space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[28.5px] font-extrabold tracking-tight text-ink-900">알림 🔔</h1>
          <p className="mt-1 text-[17.5px] text-ink-500">
            {unread.length > 0
              ? `확인하지 않은 알림이 ${unread.length}개 있어요.`
              : "지금 냉장고 상태로 알려드려요. 모두 확인했어요."}
          </p>
        </div>
        {unread.length > 0 && (
          <button
            type="button"
            onClick={() => markNotificationsRead(unread.map((n) => n.id))}
            className="min-h-[44px] shrink-0 text-[16.5px] font-semibold text-ink-500 hover:text-ink-800"
          >
            모두 읽음
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState emoji="🔕" title="지금은 알림이 없어요" description="급하게 먹어야 할 재료가 생기면 알려드릴게요." />
      ) : (
        <ul className="divide-y divide-ink-300/20 overflow-hidden rounded-card border border-ink-300/25 bg-white">
          {notifications.map((n) => {
            const { icon: Icon, tone } = KIND_ICON[n.kind];
            return (
              <li key={n.id}>
                <Link
                  href={n.href}
                  onClick={() => markNotificationsRead([n.id])}
                  className={`flex items-start gap-3 p-4 transition-colors hover:bg-warmwhite ${n.read ? "opacity-60" : ""}`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
                    <Icon size={21} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[18.5px] font-bold text-ink-900">{n.title}</p>
                      {!n.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-coral-500" aria-label="읽지 않음" />}
                    </div>
                    <p className="mt-0.5 text-[16.5px] leading-relaxed text-ink-500">{n.body}</p>
                  </div>
                  <ChevronRight size={20} className="mt-3 shrink-0 text-ink-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
