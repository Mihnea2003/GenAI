"use client";

import { useEffect, useState, type FormEvent } from "react";
import * as api from "@/lib/api-client";
import type { EventDto, Organization, UserProfile } from "@/lib/api-types";
import { validateEventDraftFields, type EventDraft, type EventStatus } from "@/lib/event-lifecycle";
import { useProfile } from "@/lib/use-profile";
import AuthPanel from "./auth-panel";
import SiteHeader from "./site-header";
import styles from "./page.module.css";

const emptyDraft = (organizationId = ""): EventDraft => ({
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  location: "",
  organizationId,
  capacity: 1,
});

/** ISO string -> value for <input type="datetime-local"> in the browser's timezone. */
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

/** <input type="datetime-local"> value -> ISO string with timezone, as the API requires. */
const toIso = (local: string) => new Date(local).toISOString();

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

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

export default function EventsDashboard() {
  const { user, profile, profileError: rawProfileError, loading } = useProfile();
  const profileError = rawProfileError ? messageOf(rawProfileError) : "";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <SiteHeader active="organizer" />

        {loading ? (
          <p className={styles.emptyState}>Loading…</p>
        ) : !user ? (
          <>
            <section className={styles.heading}>
              <div>
                <h1>Event management</h1>
                <p>Sign in with an organizer account to create, review, and publish events.</p>
              </div>
            </section>
            <AuthPanel />
          </>
        ) : profileError ? (
          <p className={styles.error} role="alert">{profileError}</p>
        ) : profile && profile.role === "student" ? (
          <section className={styles.heading}>
            <div>
              <h1>Organizer access required</h1>
              <p>
                You are signed in as a student. Ask a platform administrator to grant you organizer access
                for your organization.
              </p>
            </div>
          </section>
        ) : profile ? (
          <OrganizerWorkspace profile={profile} />
        ) : null}
      </div>
    </main>
  );
}

function OrganizerWorkspace({ profile }: { profile: UserProfile }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState(profile.organizationId ?? "");
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loadedOrg, setLoadedOrg] = useState<string | null>(null);
  const [listError, setListError] = useState("");
  const [draft, setDraft] = useState<EventDraft>(emptyDraft(profile.organizationId ?? ""));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Admins can manage every organization; organizers only their own.
  const manageable = profile.role === "admin"
    ? organizations
    : organizations.filter((org) => org.id === profile.organizationId);

  useEffect(() => {
    api.listOrganizations().then(setOrganizations).catch((e) => setListError(messageOf(e)));
  }, []);

  useEffect(() => {
    let active = true;
    api.listManagedEvents(selectedOrg || undefined)
      .then((list) => {
        if (!active) return;
        setEvents(list);
        setListError("");
        setLoadedOrg(selectedOrg);
      })
      .catch((e) => {
        if (!active) return;
        setListError(messageOf(e));
        setLoadedOrg(selectedOrg);
      });
    return () => {
      active = false;
    };
  }, [selectedOrg]);
  const listLoading = loadedOrg !== selectedOrg;

  const query = search.trim().toLocaleLowerCase();
  const visibleEvents = events.filter((item) =>
    [item.title, item.location, item.organizationName].join(" ").toLocaleLowerCase().includes(query),
  );

  function resetForm() {
    setDraft(emptyDraft(selectedOrg || profile.organizationId || manageable[0]?.id || ""));
    setEditingId(null);
    setError("");
  }

  const replaceEvent = (updated: EventDto) =>
    setEvents((current) => current.map((item) => (item.id === updated.id ? updated : item)));

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Quick client-side feedback; the server repeats every check and is the authority.
    const errors = validateEventDraftFields(draft, { requireFutureStart: !editingId });
    if (errors.length) {
      setError(errors.map((e) => e.message).join(" "));
      return;
    }

    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const status = submitter instanceof HTMLButtonElement && submitter.value === "publish" ? "published" : "draft";
    const fields = {
      title: draft.title,
      description: draft.description,
      location: draft.location,
      capacity: draft.capacity,
      startDate: toIso(draft.startDate),
      endDate: toIso(draft.endDate),
    };

    setBusy(true);
    setError("");
    try {
      if (editingId) {
        replaceEvent(await api.updateEvent(editingId, fields));
      } else {
        const created = await api.createEvent({ ...fields, organizationId: draft.organizationId, status });
        setEvents((current) => [...current, created].sort((a, b) => a.startDate.localeCompare(b.startDate)));
      }
      resetForm();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  function editEvent(item: EventDto) {
    setDraft({
      title: item.title,
      description: item.description,
      startDate: toLocalInput(item.startDate),
      endDate: toLocalInput(item.endDate),
      location: item.location,
      organizationId: item.organizationId,
      capacity: item.capacity,
    });
    setEditingId(item.id);
    setError("");
    document.getElementById("event-form")?.scrollIntoView({ behavior: "smooth" });
  }

  async function setStatus(id: string, next: EventStatus) {
    setListError("");
    try {
      replaceEvent(await api.updateEvent(id, { status: next }));
    } catch (e) {
      setListError(messageOf(e));
    }
  }

  function changeDraft<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const editable = (status: EventStatus) => status === "draft" || status === "published";

  return (
    <>
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
          {profile.role === "admin" && (
            <select
              aria-label="Organization"
              className={styles.searchInput}
              onChange={(event) => setSelectedOrg(event.target.value)}
              value={selectedOrg}
            >
              <option value="">All organizations</option>
              {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          )}
          <input
            aria-label="Search events"
            className={styles.searchInput}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, location, organization"
            type="search"
            value={search}
          />
        </div>
        {listError && <p className={styles.error} role="alert">{listError}</p>}
        <div className={styles.eventList}>
          {listLoading ? (
            <p className={styles.emptyState}>Loading events…</p>
          ) : visibleEvents.length === 0 ? (
            <p className={styles.emptyState}>{events.length ? "No events match this search." : "No events yet. Create the first one."}</p>
          ) : visibleEvents.map((item) => (
            <article className={styles.eventItem} key={item.id}>
              <div className={styles.eventMain}>
                <div aria-hidden="true" className={styles.dateBlock}>
                  {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(item.startDate))}
                </div>
                <div className={styles.eventInfo}>
                  <span className={`${styles.status} ${styles[item.status]}`}>{item.status}</span>
                  <h3>{item.title}</h3>
                  <p>{item.organizationName} · {item.location}</p>
                  <p>{displayDate(item.startDate)} · {item.registeredCount}/{item.capacity} registered</p>
                </div>
              </div>
              <div className={styles.eventActions}>
                {editable(item.status) && (
                  <button className={styles.textButton} onClick={() => editEvent(item)} type="button">Edit</button>
                )}
                {item.status === "draft" && <>
                  <button className={styles.textButton} onClick={() => setStatus(item.id, "published")} type="button">Publish</button>
                  <button className={styles.textButton} onClick={() => setStatus(item.id, "cancelled")} type="button">Discard</button>
                </>}
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
              <select
                className={styles.input}
                disabled={Boolean(editingId)}
                onChange={(event) => changeDraft("organizationId", event.target.value)}
                required
                value={draft.organizationId}
              >
                <option value="">Select an organization</option>
                {manageable.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
              </select>
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
            <p className={styles.subtle}>All fields are required. Changes are saved to Firebase.</p>
            <div className={styles.formActions}>
              {!editingId && <button className={styles.secondaryButton} disabled={busy} name="intent" type="submit" value="draft">Save draft</button>}
              {!editingId && <button className={styles.primaryButton} disabled={busy} name="intent" type="submit" value="publish">Publish event</button>}
              {editingId && <button className={styles.primaryButton} disabled={busy} type="submit">Save changes</button>}
            </div>
          </div>
        </form>
      </section>
    </>
  );
}
