"use client";

import Link from "next/link";
import { AlarmClock, BarChart3, CheckCheck, ChefHat, ChevronRight, Snowflake, ShoppingBasket } from "lucide-react";
import { useStore } from "@/lib/store";
import { useNotifications } from "@/lib/notifications";
import type { AppNotification } from "@/lib/types";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
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
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="skeleton h-10 w-1/2" />
        <SkeletonList rows={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-5">
      <PageHeader
        title="알림"
        description={unread.length > 0 ? `확인하지 않은 알림 ${unread.length}개` : "모두 확인했어요."}
        action={
          unread.length > 0 && (
            <button
              type="button"
              onClick={() => markNotificationsRead(unread.map((n) => n.id))}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl px-2.5 text-[16px] font-semibold text-ink-600 hover:bg-ink-300/10 hover:text-ink-900"
            >
              <CheckCheck size={18} />
              모두 읽음
            </button>
          )
        }
      />

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
                  className={`flex items-start gap-3 p-4 transition-colors hover:bg-warmwhite ${n.read ? "" : "bg-fresh-50/40"}`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone} ${n.read ? "opacity-60" : ""}`}>
                    <Icon size={21} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-[18px] ${n.read ? "font-semibold text-ink-600" : "font-bold text-ink-900"}`}>{n.title}</p>
                      {!n.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-coral-500" aria-label="읽지 않음" />}
                    </div>
                    <p className="mt-0.5 text-[16px] leading-relaxed text-ink-500">{n.body}</p>
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
