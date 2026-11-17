"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useProfile } from "@/lib/use-profile";
import styles from "./student.module.css";

/** Shared top bar: navigation for students and organizers plus the signed-in account. */
export default function SiteHeader() {
  const pathname = usePathname();
  const { user, profile } = useProfile();
  const isOrganizer = profile?.role === "organizer" || profile?.role === "admin";

  const links = [
    { href: "/", label: "Events" },
    ...(user ? [{ href: "/my-registrations", label: "My registrations" }] : []),
    ...(isOrganizer ? [{ href: "/organizer", label: "Organizer" }] : []),
  ];
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/events") : pathname.startsWith(href);

  return (
    <header className={styles.siteHeader}>
      <Link className={styles.brand} href="/">UBB Events</Link>
      <nav aria-label="Main" className={styles.nav}>
        {links.map((link) => (
          <Link
            aria-current={isActive(link.href) ? "page" : undefined}
            className={isActive(link.href) ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
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
