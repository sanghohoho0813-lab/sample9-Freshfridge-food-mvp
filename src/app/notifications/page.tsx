"use client";

import { useStore } from "@/lib/store";
import { formatKoreanDate } from "@/lib/expiry-calculator";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/SkeletonList";

const KIND_EMOJI: Record<string, string> = {
  expiry: "⏰",
  recipe: "👨‍🍳",
  tip: "💡",
};

export default function NotificationsPage() {
  const { ready, state, markNotificationRead, markAllNotificationsRead } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;

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
          <h1 className="text-[28.6px] font-extrabold tracking-tight text-ink-900">알림 🔔</h1>
          <p className="mt-1 text-[17.6px] text-ink-500">
            {unread > 0 ? `읽지 않은 알림이 ${unread}개 있어요.` : "모든 알림을 확인했어요."}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="shrink-0 text-[16.9px] font-semibold text-fresh-600 hover:text-fresh-700"
          >
            모두 읽음
          </button>
        )}
      </div>

      {state.notifications.length === 0 ? (
        <EmptyState emoji="🔕" title="알림이 없어요" />
      ) : (
        <ul className="space-y-2.5">
          {state.notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => markNotificationRead(n.id)}
                className={`card card-hover w-full p-4 text-left ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-fresh-50 text-lg">
                    {KIND_EMOJI[n.kind]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[18.2px] font-bold text-ink-900">{n.title}</p>
                      {!n.read && (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-coral-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[16.2px] leading-relaxed text-ink-500">{n.body}</p>
                    <p className="mt-1 text-[14.3px] text-ink-300">{formatKoreanDate(n.date)}</p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
