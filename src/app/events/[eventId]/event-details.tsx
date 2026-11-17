"use client";

import Link from "next/link";
import { useState } from "react";
import * as api from "@/lib/api-client";
import { ApiClientError } from "@/lib/api-client";
import type { EventDto, RegistrationDto } from "@/lib/api-types";
import { capacityLabel, formatSchedule } from "@/lib/format";
import { REGISTRATION_BLOCK_MESSAGES, registrationBlockReason } from "@/lib/registration-rules";
import { useAsyncData } from "@/lib/use-async-data";
import { useAuth } from "@/lib/use-auth";
import AuthPanel from "../../auth-panel";
import styles from "../../student.module.css";

type Feedback = { tone: "success" | "warning" | "error"; text: string } | null;

const toneClass = { success: styles.success, warning: styles.warning, error: styles.errorBox };

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

/** Event details plus the student's registration panel. */
export default function EventDetails({ eventId }: { eventId: string }) {
  const { user, loading: authLoading } = useAuth();
  const event = useAsyncData(`event:${eventId}`, () => api.getEvent(eventId));
  const registration = useAsyncData(user ? `registration:${eventId}:${user.uid}` : null, () =>
    api.getMyRegistration(eventId),
  );

  if (event.error) {
    const notFound = event.error instanceof ApiClientError && event.error.code === "EVENT_NOT_FOUND";
    return (
      <>
        <Link className={styles.back} href="/">← All events</Link>
        <div className={styles.state} role="alert">
          <h2>{notFound ? "Event not found" : "We couldn't load this event"}</h2>
          <p>{notFound ? "It may have been removed, or it is not published yet." : messageOf(event.error)}</p>
          {!notFound && (
            <button className={`${styles.secondaryButton} ${styles.inlineButton}`} onClick={event.reload} type="button">Try again</button>
          )}
        </div>
      </>
    );
  }

  if (!event.data) {
    return (
      <>
        <Link className={styles.back} href="/">← All events</Link>
        <div aria-busy="true" aria-label="Loading event" className={styles.details}>
          <div className={styles.skeleton} style={{ minHeight: 320 }} />
          <div className={styles.skeleton} style={{ minHeight: 220 }} />
        </div>
      </>
    );
  }

  const data = event.data;
  const percentFull = Math.min(100, Math.round((data.registeredCount / data.capacity) * 100));

  return (
    <>
      <Link className={styles.back} href="/">← All events</Link>
      <div className={styles.details}>
        <article className={styles.detailsMain}>
          {data.status !== "published" && (
            <span className={`${styles.badge} ${data.status === "cancelled" ? styles.badgeCancelled : ""}`}>{data.status}</span>
          )}
          <h1>{data.title}</h1>
          <p className={styles.org}>Organized by {data.organizationName}</p>

          <dl className={styles.facts}>
            <div className={styles.fact}><dt>When</dt><dd>{formatSchedule(data.startDate, data.endDate)}</dd></div>
            <div className={styles.fact}><dt>Where</dt><dd>{data.location}</dd></div>
            <div className={styles.fact}><dt>Organizer</dt><dd>{data.organizationName}</dd></div>
            <div className={styles.fact}>
              <dt>Capacity</dt>
              <dd>{data.registeredCount} registered · {capacityLabel(data)}</dd>
            </div>
          </dl>

          <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>About this event</h2>
          <p className={styles.description}>{data.description}</p>
        </article>

        <aside aria-labelledby="registration-heading" className={styles.panel}>
          <h2 id="registration-heading">Registration</h2>
          <div
            aria-label={`${data.registeredCount} of ${data.capacity} seats taken`}
            aria-valuemax={data.capacity}
            aria-valuemin={0}
            aria-valuenow={data.registeredCount}
            className={styles.meter}
            role="meter"
          >
            <div className={`${styles.meterFill} ${percentFull >= 100 ? styles.meterFull : ""}`} style={{ width: `${percentFull}%` }} />
          </div>
          <p className={styles.panelText}>{capacityLabel(data)}</p>

          <RegistrationPanel
            authLoading={authLoading}
            event={data}
            onChanged={() => {
              event.reload();
              registration.reload();
            }}
            registration={registration.data}
            registrationError={registration.error}
            signedIn={Boolean(user)}
          />
        </aside>
      </div>
    </>
  );
}

function RegistrationPanel(props: {
  event: EventDto;
  registration: RegistrationDto | null | undefined;
  registrationError: unknown;
  signedIn: boolean;
  authLoading: boolean;
  onChanged: () => void;
}) {
  const { event, registration, registrationError, signedIn, authLoading, onChanged } = props;
  const [busy, setBusy] = useState<"register" | "cancel" | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  async function register() {
    setBusy("register");
    setFeedback(null);
    try {
      await api.registerForEvent(event.id);
      setFeedback({ tone: "success", text: "You're registered! The event now appears in My registrations." });
    } catch (error) {
      const code = error instanceof ApiClientError ? error.code : null;
      if (code === "ALREADY_REGISTERED") {
        setFeedback({ tone: "warning", text: "You were already registered for this event." });
      } else if (code === "EVENT_FULL") {
        setFeedback({ tone: "warning", text: "Sorry, the last seat was just taken. This event is now full." });
      } else if (code === "UNAUTHENTICATED") {
        setShowAuth(true);
        setFeedback({ tone: "warning", text: "Your session expired. Please sign in again." });
      } else {
        setFeedback({ tone: "error", text: messageOf(error) });
      }
    } finally {
      setBusy(null);
      onChanged(); // refresh seat counts and status from the server either way
    }
  }

  async function cancel() {
    setBusy("cancel");
    setFeedback(null);
    try {
      await api.cancelRegistration(event.id);
      setFeedback({ tone: "success", text: "Your registration was cancelled and your seat was released." });
    } catch (error) {
      setFeedback({ tone: "error", text: messageOf(error) });
    } finally {
      setBusy(null);
      setConfirmingCancel(false);
      onChanged();
    }
  }

  const feedbackBox = feedback && (
    <p aria-live="polite" className={toneClass[feedback.tone]} role={feedback.tone === "error" ? "alert" : "status"}>
      {feedback.text}
    </p>
  );

  if (authLoading) return <p className={styles.panelText}>Checking your account…</p>;

  if (!signedIn) {
    return (
      <>
        {feedbackBox}
        <p className={styles.panelText}>Sign in with your student account to register.</p>
        {showAuth ? (
          <AuthPanel compact />
        ) : (
          <button className={styles.primaryButton} onClick={() => setShowAuth(true)} type="button">Sign in to register</button>
        )}
      </>
    );
  }

  if (registrationError) {
    return <p className={styles.errorBox} role="alert">Couldn&apos;t check your registration: {messageOf(registrationError)}</p>;
  }
  if (registration === undefined) return <p className={styles.panelText}>Checking your registration…</p>;

  if (registration?.status === "confirmed") {
    const canCancel = event.status !== "completed";
    return (
      <>
        {feedbackBox ?? (
          <p className={styles.success} role="status">✓ You&apos;re registered for this event.</p>
        )}
        <p className={styles.panelText}>
          Registered on {new Date(registration.registeredAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
          {event.status === "cancelled" && " The organizers cancelled this event."}
        </p>
        {canCancel && (confirmingCancel ? (
          <>
            <p className={styles.panelText}>Cancel your registration? Your seat will be given to someone else.</p>
            <button className={styles.dangerButton} disabled={busy !== null} onClick={cancel} type="button">
              {busy === "cancel" ? "Cancelling…" : "Yes, cancel my registration"}
            </button>
            <button className={styles.secondaryButton} disabled={busy !== null} onClick={() => setConfirmingCancel(false)} type="button">
              Keep my seat
            </button>
          </>
        ) : (
          <button className={styles.secondaryButton} onClick={() => setConfirmingCancel(true)} type="button">Cancel registration</button>
        ))}
      </>
    );
  }

  const blocked = registrationBlockReason({ ...event, startDate: new Date(event.startDate) });
  if (blocked) {
    return (
      <>
        {feedbackBox}
        {!feedback && <p className={blocked === "EVENT_FULL" ? styles.warning : styles.errorBox}>{REGISTRATION_BLOCK_MESSAGES[blocked]}</p>}
        {registration?.status === "cancelled" && <p className={styles.panelText}>You cancelled your earlier registration.</p>}
      </>
    );
  }

  return (
    <>
      {feedbackBox}
      {registration?.status === "cancelled" && !feedback && (
        <p className={styles.panelText}>You cancelled your earlier registration. You can register again while seats are available.</p>
      )}
      <button className={styles.primaryButton} disabled={busy !== null} onClick={register} type="button">
        {busy === "register" ? "Registering…" : "Register for this event"}
      </button>
    </>
  );
}
