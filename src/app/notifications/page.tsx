"use client";

import Link from "next/link";
import {
  AlarmClock,
  BarChart3,
  BellOff,
  CheckCheck,
  ChefHat,
  ChevronRight,
  ShoppingBasket,
  Snowflake,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useNotifications } from "@/lib/notifications";
import type { AppNotification } from "@/lib/types";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import PageLoading from "@/components/ui/PageLoading";

// 색은 기한 상태(빨강)에만 쓰고, 나머지 알림은 아이콘 모양으로만 구분한다
const NEUTRAL = "bg-ink-900/[0.05] text-ink-600";
const KIND_ICON: Record<AppNotification["kind"], { icon: typeof AlarmClock; tone: string }> = {
  expiry: { icon: AlarmClock, tone: "bg-coral-50 text-coral-700" },
  recipe: { icon: ChefHat, tone: NEUTRAL },
  freezer: { icon: Snowflake, tone: NEUTRAL },
  shopping: { icon: ShoppingBasket, tone: NEUTRAL },
  report: { icon: BarChart3, tone: NEUTRAL },
};

export default function NotificationsPage() {
  const { ready, markNotificationsRead } = useStore();
  const notifications = useNotifications();
  const unread = notifications.filter((n) => !n.read);

  if (!ready) return <PageLoading title="알림" back="/" rows={4} />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        back="/"
        title="알림"
        description={unread.length > 0 ? `확인하지 않은 알림 ${unread.length}개` : "모두 확인했어요."}
        action={
          unread.length > 0 && (
            <button
              type="button"
              onClick={() => markNotificationsRead(unread.map((n) => n.id))}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-full px-3 text-[16px] font-semibold text-ink-600 hover:bg-ink-900/[0.04] hover:text-ink-900"
            >
              <CheckCheck size={18} aria-hidden />
              모두 읽음
            </button>
          )
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="지금은 알림이 없어요"
          description="급하게 먹어야 할 재료가 생기면 알려드릴게요."
        />
      ) : (
        <div className="space-y-7">
          {[
            { key: "new", title: "새 알림", list: unread },
            { key: "read", title: "확인한 알림", list: notifications.filter((n) => n.read) },
          ]
            .filter((g) => g.list.length > 0)
            .map((g) => (
              <section key={g.key} aria-labelledby={`noti-${g.key}`}>
                <h2
                  id={`noti-${g.key}`}
                  className="mb-2.5 flex items-center gap-2 px-1 text-[16.5px] font-semibold text-ink-700"
                >
                  {g.title}
                  <span className="tabular-nums text-ink-500">{g.list.length}</span>
                </h2>
                <ul className="divide-y divide-ink-900/[0.06] overflow-hidden rounded-card border border-ink-900/[0.07] bg-white shadow-soft">
                  {g.list.map((n) => (
                    <NotificationRow key={n.id} n={n} onOpen={() => markNotificationsRead([n.id])} />
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ n, onOpen }: { n: AppNotification; onOpen: () => void }) {
  const { icon: Icon, tone } = KIND_ICON[n.kind];
  return (
    <li>
      <Link
        href={n.href}
        onClick={onOpen}
        className="flex items-start gap-3.5 p-4 transition-colors hover:bg-warmwhite active:bg-ink-900/[0.03]"
      >
        <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full ${tone}`}>
          <Icon size={21} className={n.read ? "opacity-60" : ""} aria-hidden />
          {!n.read && (
            <span
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-coral-500"
              aria-label="읽지 않음"
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-[17.5px] leading-snug ${n.read ? "font-medium text-ink-600" : "font-semibold text-ink-900"}`}
          >
            {n.title}
          </p>
          <p className="mt-1 text-[16px] leading-snug text-ink-500">{n.body}</p>
        </div>
        <ChevronRight size={20} className="mt-2.5 shrink-0 text-ink-300" aria-hidden />
      </Link>
    </li>
  );
}
