import styles from "./page.module.css";

const features = [
  "Event creation and publication",
  "Registration with capacity validation",
  "Role-based organization management",
  "Attendance tracking for organizers",
  "Search and discovery for students",
  "Firebase-powered persistence",
];

const roles = [
  { label: "Student", description: "Browse events and register for activities." },
  { label: "Organizer", description: "Create events and manage registrations." },
  { label: "Admin", description: "Control organization membership and policies." },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.badge}>UBB Events</div>
        <h1>Student organization event management for Babeș-Bolyai University.</h1>
        <p>
          A centralized platform for organizing events, handling registrations,
          managing responsibilities, and tracking attendance across student groups.
        </p>
        <div className={styles.actions}>
          <button className={styles.primary}>Explore events</button>
          <button className={styles.secondary}>View project plan</button>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.panel}>
          <h2>Core MVP</h2>
          <ul>
            {features.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className={styles.panel}>
          <h2>Roles</h2>
          <div className={styles.roles}>
            {roles.map((role) => (
              <div key={role.label} className={styles.roleCard}>
                <strong>{role.label}</strong>
                <span>{role.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
