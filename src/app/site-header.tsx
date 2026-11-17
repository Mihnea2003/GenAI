"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useProfile } from "@/lib/use-profile";
import styles from "./student.module.css";

export type HeaderSection = "events" | "registrations" | "organizer";

/**
 * Shared top bar: navigation for students and organizers plus the signed-in account.
 * Each page passes its own section instead of reading the URL with usePathname(), which
 * (with Cache Components) would block prerendering on dynamic routes like /events/[eventId].
 */
export default function SiteHeader({ active }: { active: HeaderSection }) {
  const { user, profile } = useProfile();
  const isOrganizer = profile?.role === "organizer" || profile?.role === "admin";

  const links: { href: string; label: string; section: HeaderSection }[] = [
    { href: "/", label: "Events", section: "events" },
    ...(user ? [{ href: "/my-registrations", label: "My registrations", section: "registrations" as const }] : []),
    ...(isOrganizer ? [{ href: "/organizer", label: "Organizer", section: "organizer" as const }] : []),
  ];
  const isActive = (section: HeaderSection) => section === active;

  return (
    <header className={styles.siteHeader}>
      <Link className={styles.brand} href="/">UBB Events</Link>
      <nav aria-label="Main" className={styles.nav}>
        {links.map((link) => (
          <Link
            aria-current={isActive(link.section) ? "page" : undefined}
            className={isActive(link.section) ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className={styles.account}>
        {user ? (
          <>
            <span className={styles.accountEmail} title={user.email ?? undefined}>{user.email}</span>
            <button className={styles.linkButton} onClick={() => signOut(getFirebaseAuth())} type="button">
              Sign out
            </button>
          </>
        ) : (
          <Link className={styles.linkButton} href="/my-registrations">Sign in</Link>
        )}
      </div>
    </header>
  );
}
