"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate, statusLabel } from "@/lib/format";
import type { JobStatus } from "@/lib/types";

type Notification = {
  id: string;
  jobId: string;
  jobTitle: string;
  at: string;
  actor: string;
  type: string;
  message: string;
  status: JobStatus;
  unreadHint: boolean;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [actionable, setActionable] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.notifications || []);
        setActionable(data.counts?.actionable || 0);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="page-shell wide">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Inbox</p>
          <h1>Notifications</h1>
          <p className="muted">
            {actionable} actionable · {items.length} recent events
          </p>
        </div>
        <Link href="/admin" className="btn-ghost">
          Admin
        </Link>
      </div>

      <div className="job-list">
        {items.map((item) => (
          <Link key={item.id} href={`/jobs/${item.jobId}`} className="job-row">
            <div>
              <strong>{item.jobTitle}</strong>
              <div className="muted job-row-meta">
                {formatDate(item.at)} · {item.actor} · {item.type}
                {item.unreadHint ? (
                  <span className="priority-flag">Action</span>
                ) : null}
                <span className={`status-chip status-${item.status}`}>
                  {statusLabel(item.status)}
                </span>
              </div>
              <p style={{ margin: "0.35rem 0 0" }}>{item.message}</p>
            </div>
          </Link>
        ))}
        {!items.length ? (
          <p className="muted">No notifications yet — create or seed jobs.</p>
        ) : null}
      </div>
    </div>
  );
}
