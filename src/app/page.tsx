import EventsBrowser from "./events-browser";
import SiteHeader from "./site-header";
import styles from "./student.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <SiteHeader active="events" />
        <EventsBrowser />
      </div>
    </main>
  );
}
