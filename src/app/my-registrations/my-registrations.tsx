"use client";

import Link from "next/link";
import { useState } from "react";
import * as api from "@/lib/api-client";
import type { MyRegistrationDto } from "@/lib/api-types";
import { formatSchedule } from "@/lib/format";
import { useAsyncData } from "@/lib/use-async-data";
import { useAuth } from "@/lib/use-auth";
import AuthPanel from "../auth-panel";
import styles from "../student.module.css";

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

function statusBadge(registration: MyRegistrationDto) {
  const event = registration.event;
  if (registration.status === "cancelled") return <span className={styles.badge}>Cancelled by you</span>;
  if (event?.status === "cancelled") return <span className={`${styles.badge} ${styles.badgeCancelled}`}>Event cancelled</span>;
  if (event?.status === "completed" || (event && new Date(event.endDate) < new Date())) {
    return <span className={styles.badge}>Past event</span>;
  }
  return <span className={`${styles.badge} ${styles.badgeRegistered}`}>✓ Registered</span>;
}

/** The signed-in student's registrations, with quick cancellation. */
export default function MyRegistrations() {
  const { user, loading: authLoading } = useAuth();
  const registrations = useAsyncData(user ? `mine:${user.uid}` : null, api.listMyRegistrations);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function cancel(registration: MyRegistrationDto) {
    setBusyId(registration.eventId);
    setMessage(null);
    try {
      await api.cancelRegistration(registration.eventId);
      setMessage({ tone: "success", text: `Cancelled your registration for “${registration.event?.title ?? "the event"}”.` });
    } catch (error) {
      setMessage({ tone: "error", text: messageOf(error) });
    } finally {
      setBusyId(null);
      registrations.reload();
    }
  }

  if (authLoading) return <p className={styles.state}>Loading…</p>;

  if (!user) {
    return (
      <>
        <section className={styles.heading}>
          <h1>My registrations</h1>
          <p>Sign in to see the events you registered for. New here? Create a student account.</p>
        </section>
        <AuthPanel />
      </>
    );
  }

  const now = new Date();
  const list = registrations.data ?? [];
  const upcoming = list.filter((r) => r.status === "confirmed" && r.event && new Date(r.event.endDate) >= now && r.event.status === "published");
  const other = list.filter((r) => !upcoming.includes(r));

  const renderRow = (registration: MyRegistrationDto) => {
    const event = registration.event;
    const canCancel = registration.status === "confirmed" && event && event.status === "published" && new Date(event.endDate) >= now;
    return (
      <div className={styles.row} key={registration.id}>
        <div>
          <div style={{ marginBottom: 6 }}>{statusBadge(registration)}</div>
          <h2 className={styles.cardTitle}>{event ? event.title : "Event no longer available"}</h2>
          {event && (
            <p className={styles.org}>
              {formatSchedule(event.startDate, event.endDate)} · {event.location} · {event.organizationName}
            </p>
          )}
        </div>
        <div className={styles.rowActions}>
          {event && <Link className={`${styles.secondaryButton} ${styles.inlineButton}`} href={`/events/${event.id}`} style={{ display: "inline-flex", alignItems: "center" }}>View</Link>}
          {canCancel && (
            <button
              className={`${styles.dangerButton} ${styles.inlineButton}`}
              disabled={busyId !== null}
              onClick={() => cancel(registration)}
              type="button"
            >
              {busyId === registration.eventId ? "Cancelling…" : "Cancel"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <section className={styles.heading}>
        <h1>My registrations</h1>
        <p>Events you signed up for. Cancel if you can no longer attend, so someone else can take your seat.</p>
      </section>

      {message && (
        <p aria-live="polite" className={message.tone === "success" ? styles.success : styles.errorBox} style={{ marginBottom: 16 }}>
          {message.text}
        </p>
      )}

      {registrations.error ? (
        <div className={styles.state} role="alert">
          <h2>We couldn&apos;t load your registrations</h2>
          <p>{messageOf(registrations.error)}</p>
          <button className={`${styles.secondaryButton} ${styles.inlineButton}`} onClick={registrations.reload} type="button">Try again</button>
        </div>
      ) : !registrations.data ? (
        <div aria-busy="true" className={styles.list}>
          {[0, 1].map((i) => <div className={styles.skeleton} key={i} style={{ minHeight: 90 }} />)}
        </div>
      ) : list.length === 0 ? (
        <div className={styles.state}>
          <h2>No registrations yet</h2>
          <p>Browse upcoming events and register for the ones you like.</p>
          <Link className={`${styles.primaryButton} ${styles.inlineButton}`} href="/" style={{ display: "inline-flex", alignItems: "center", marginTop: 12 }}>Browse events</Link>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: "1.05rem", margin: "8px 0 10px" }}>Upcoming ({upcoming.length})</h2>
          {upcoming.length ? <div className={styles.list}>{upcoming.map(renderRow)}</div> : <p className={styles.panelText}>No upcoming events.</p>}
          {other.length > 0 && (
            <>
              <h2 style={{ fontSize: "1.05rem", margin: "28px 0 10px" }}>Past and cancelled ({other.length})</h2>
              <div className={styles.list}>{other.map(renderRow)}</div>
            </>
          )}
        </>
      )}
    </>
  );
}
