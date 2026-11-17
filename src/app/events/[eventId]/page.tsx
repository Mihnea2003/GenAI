import type { Metadata } from "next";
import { Suspense } from "react";
import SiteHeader from "../../site-header";
import styles from "../../student.module.css";
import EventDetails from "./event-details";

export const metadata: Metadata = { title: "Event details · UBB Events" };

export default function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <SiteHeader active="events" />
        {/* With Cache Components, route params are runtime data and must be read inside Suspense. */}
        <Suspense fallback={<div aria-busy="true" className={styles.skeleton} style={{ marginTop: 24, minHeight: 320 }} />}>
          {params.then(({ eventId }) => <EventDetails eventId={eventId} />)}
        </Suspense>
      </div>
    </main>
  );
}
