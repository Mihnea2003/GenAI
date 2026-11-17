"use client";

import { useState, type FormEvent } from "react";
import {
  canTransitionEventStatus,
  validateEventDraft,
  type EventDraft,
  type EventStatus,
} from "@/lib/event-lifecycle";
import styles from "./page.module.css";

type ManagedEvent = EventDraft & { id: string; status: EventStatus };

const sampleEvents: ManagedEvent[] = [
  {
    id: "sample-event-1",
    title: "Research Skills Workshop",
    description: "An introduction to research methods and academic sources.",
    startDate: "2030-10-12T10:00",
    endDate: "2030-10-12T12:00",
    location: "Faculty of Mathematics and Computer Science",
    organization: "Student Association (sample)",
    capacity: 40,
    status: "published",
  },
  {
    id: "sample-event-2",
    title: "Welcome Week Meetup",
    description: "A draft event awaiting organizer review.",
    startDate: "2030-10-20T17:00",
    endDate: "2030-10-20T19:00",
    location: "UBB Central Campus (sample)",
    organization: "Student Association (sample)",
    capacity: 80,
    status: "draft",
  },
];

const emptyDraft: EventDraft = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  location: "",
  organization: "",
  capacity: 1,
};

function displayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function EventsDashboard() {
  const [events, setEvents] = useState(sampleEvents);
  const [draft, setDraft] = useState<EventDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const visibleEvents = events.filter((item) =>
    [item.title, item.location, item.organization].join(" ").toLocaleLowerCase().includes(query),
  );

  function resetForm() {
    setDraft(emptyDraft);
    setEditingId(null);
    setError("");
  }

  function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateEventDraft(draft);
    if (errors.length) {
      setError(errors.join(" "));
      return;
    }

    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const status: EventStatus =
      submitter instanceof HTMLButtonElement && submitter.value === "publish"
        ? "published"
        : "draft";

    if (editingId) {
      setEvents((current) => current.map((item) =>
        item.id === editingId ? { ...item, ...draft } : item,
      ));
    } else {
      setEvents((current) => [{ ...draft, id: `demo-${Date.now()}`, status }, ...current]);
    }
    resetForm();
  }

  function editEvent(item: ManagedEvent) {
    setDraft({
      title: item.title,
      description: item.description,
      startDate: item.startDate,
      endDate: item.endDate,
      location: item.location,
      organization: item.organization,
      capacity: item.capacity,
    });
    setEditingId(item.id);
    setError("");
    document.getElementById("event-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function setStatus(id: string, next: EventStatus) {
    setEvents((current) => current.map((item) =>
      item.id === id && canTransitionEventStatus(item.status, next)
        ? { ...item, status: next }
        : item,
    ));
  }

  function changeDraft<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brand}>UBB Events</div>
          <span className={styles.demoTag}>Local demo · not saved</span>
        </header>

        <section className={styles.heading}>
          <div>
            <h1>Event management</h1>
            <p>Create, review, and publish events for a student organization.</p>
          </div>
          <button
            className={styles.primaryButton}
            onClick={() => {
              resetForm();
              document.getElementById("event-form")?.scrollIntoView({ behavior: "smooth" });
            }}
            type="button"
          >
            Create event
          </button>
        </section>

        <section aria-labelledby="events-heading">
          <div className={styles.toolbar}>
            <h2 id="events-heading">Organization events</h2>
            <input
              aria-label="Search events"
              className={styles.searchInput}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, location, organization"
              type="search"
              value={search}
            />
          </div>
          <div className={styles.eventList}>
            {visibleEvents.length === 0 ? (
              <p className={styles.emptyState}>No events match this search.</p>
            ) : visibleEvents.map((item) => (
              <article className={styles.eventItem} key={item.id}>
                <div className={styles.eventMain}>
                  <div aria-hidden="true" className={styles.dateBlock}>
                    {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(item.startDate))}
                  </div>
                  <div className={styles.eventInfo}>
                    <span className={`${styles.status} ${styles[item.status]}`}>{item.status}</span>
                    <h3>{item.title}</h3>
                    <p>{item.organization} · {item.location}</p>
                    <p>{displayDate(item.startDate)} · capacity {item.capacity}</p>
                  </div>
                </div>
                <div className={styles.eventActions}>
                  <button className={styles.textButton} onClick={() => editEvent(item)} type="button">Edit</button>
                  {item.status === "draft" && (
                    <button className={styles.textButton} onClick={() => setStatus(item.id, "published")} type="button">Publish</button>
                  )}
                  {item.status === "published" && <>
                    <button className={styles.textButton} onClick={() => setStatus(item.id, "completed")} type="button">Mark complete</button>
                    <button className={styles.textButton} onClick={() => setStatus(item.id, "cancelled")} type="button">Cancel event</button>
                  </>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="form-heading" className={styles.formPanel} id="event-form">
          <div className={styles.formHeader}>
            <h2 id="form-heading">{editingId ? "Edit event" : "New event"}</h2>
            {editingId && <button className={styles.textButton} onClick={resetForm} type="button">Stop editing</button>}
          </div>
          <form onSubmit={submitEvent}>
            <div className={styles.formGrid}>
              <label className={`${styles.field} ${styles.wideField}`}>
                Event title
                <input className={styles.input} onChange={(event) => changeDraft("title", event.target.value)} required value={draft.title} />
              </label>
              <label className={`${styles.field} ${styles.wideField}`}>
                Description
                <textarea className={styles.input} onChange={(event) => changeDraft("description", event.target.value)} required rows={3} value={draft.description} />
              </label>
              <label className={styles.field}>
                Organization
                <input className={styles.input} onChange={(event) => changeDraft("organization", event.target.value)} required value={draft.organization} />
              </label>
              <label className={styles.field}>
                Location
                <input className={styles.input} onChange={(event) => changeDraft("location", event.target.value)} required value={draft.location} />
              </label>
              <label className={styles.field}>
                Starts
                <input className={styles.input} onChange={(event) => changeDraft("startDate", event.target.value)} required type="datetime-local" value={draft.startDate} />
              </label>
              <label className={styles.field}>
                Ends
                <input className={styles.input} onChange={(event) => changeDraft("endDate", event.target.value)} required type="datetime-local" value={draft.endDate} />
              </label>
              <label className={styles.field}>
                Capacity
                <input className={styles.input} min={1} onChange={(event) => changeDraft("capacity", Number(event.target.value))} required type="number" value={draft.capacity} />
              </label>
            </div>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.formFooter}>
              <p className={styles.subtle}>All fields are required for this prototype.</p>
              <div className={styles.formActions}>
                <button className={styles.secondaryButton} name="intent" type="submit" value="draft">Save draft</button>
                {!editingId && <button className={styles.primaryButton} name="intent" type="submit" value="publish">Publish event</button>}
                {editingId && <button className={styles.primaryButton} type="submit">Save changes</button>}
              </div>
            </div>
          </form>
        </section>

        <p className={styles.notice}>
          Sample data is held only in the current page session. Firebase persistence, sign-in, and server-side role checks are not connected yet.
        </p>
      </div>
    </main>
  );
}