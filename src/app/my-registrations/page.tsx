import type { Metadata } from "next";
import SiteHeader from "../site-header";
import styles from "../student.module.css";
import MyRegistrations from "./my-registrations";

export const metadata: Metadata = { title: "My registrations · UBB Events" };

export default function MyRegistrationsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <SiteHeader active="registrations" />
        <MyRegistrations />
      </div>
    </main>
  );
}
