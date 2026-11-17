"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api-client";
import type { EventDto } from "@/lib/api-types";
import { capacityLabel, formatDayMonth, formatSchedule } from "@/lib/format";
import { useAsyncData } from "@/lib/use-async-data";
import { useAuth } from "@/lib/use-auth";
import styles from "./student.module.css";

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

export function availabilityBadge(event: EventDto, registered: boolean) {
  if (registered) return <span className={`${styles.badge} ${styles.badgeRegistered}`}>✓ You&apos;re registered</span>;
  const label = capacityLabel(event);
  const tone =
    event.status === "cancelled" ? styles.badgeCancelled
      : event.remainingCapacity === 0 ? styles.badgeFull
        : event.remainingCapacity <= Math.max(3, event.capacity * 0.1) ? styles.badgeFew
          : styles.badgeOpen;
  return <span className={`${styles.badge} ${tone}`}>{label}</span>;
}

function EventCard({ event, registered }: { event: EventDto; registered: boolean }) {
  const { day, month } = formatDayMonth(event.startDate);
  return (
    <Link aria-label={`${event.title}, ${formatSchedule(event.startDate, event.endDate)}`} className={styles.card} href={`/events/${event.id}`}>
      <div className={styles.cardTop}>
        <div aria-hidden="true" className={styles.date}>
          <strong>{day}</strong>
          <span>{month}</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>{event.title}</h2>
          <p className={styles.org}>{event.organizationName}</p>
        </div>
      </div>
      <div className={styles.meta}>
        <span>🕒 {formatSchedule(event.startDate, event.endDate)}</span>
        <span>📍 {event.location}</span>
      </div>
      <div className={styles.cardFooter}>{availabilityBadge(event, registered)}</div>
    </Link>
  );
}

/** Student event discovery: published, upcoming events with search and organization filter. */
export default function EventsBrowser() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [organizationId, setOrganizationId] = useState("");

  // Wait until the user stops typing before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const organizations = useAsyncData("organizations", api.listOrganizations);
  const events = useAsyncData(`events:${query}:${organizationId}`, () =>
    api.listPublishedEvents({ q: query || undefined, organizationId: organizationId || undefined }),
    { keepPrevious: true },
  );
  const mine = useAsyncData(user ? `mine:${user.uid}` : null, api.listMyRegistrations);
  const registeredIds = useMemo(
    () => new Set((user ? mine.data ?? [] : []).filter((r) => r.status === "confirmed").map((r) => r.eventId)),
    [user, mine.data],
  );

  const filtered = query !== "" || organizationId !== "";

  return (
    <>
      <section className={styles.heading}>
        <h1>Upcoming events</h1>
        <p>Workshops, talks and activities organized by UBB student organizations.</p>
      </section>

      <div className={styles.filters} role="search">
        <input
          aria-label="Search events"
          className={styles.input}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, topic, location or organization"
          type="search"
          value={search}
        />
        <select
          aria-label="Filter by organization"
          className={styles.input}
          onChange={(e) => setOrganizationId(e.target.value)}
          value={organizationId}
        >
          <option value="">All organizations</option>
          {(organizations.data ?? []).map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
        </select>
      </div>

      {events.error ? (
        <div className={styles.state} role="alert">
          <h2>We couldn&apos;t load events</h2>
          <p>{messageOf(events.error)}</p>
          <button className={`${styles.secondaryButton} ${styles.inlineButton}`} onClick={events.reload} type="button">Try again</button>
        </div>
      ) : !events.data ? (
        <div aria-busy="true" aria-label="Loading events" className={styles.grid}>
          {[0, 1, 2].map((i) => <div className={styles.skeleton} key={i} />)}
        </div>
      ) : events.data.length === 0 ? (
        <div className={styles.state}>
          <h2>{filtered ? "No events match your search" : "No upcoming events yet"}</h2>
          <p>{filtered ? "Try a different keyword or show all organizations." : "Check back soon. Organizations publish new events regularly."}</p>
          {filtered && (
            <button
              className={`${styles.secondaryButton} ${styles.inlineButton}`}
              onClick={() => { setSearch(""); setQuery(""); setOrganizationId(""); }}
              type="button"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p aria-live="polite" className={styles.resultCount}>
            {events.data.length} {events.data.length === 1 ? "event" : "events"}{events.loading ? " · updating…" : ""}
          </p>
          <div className={styles.grid}>
            {events.data.map((event) => (
              <EventCard event={event} key={event.id} registered={registeredIds.has(event.id)} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
