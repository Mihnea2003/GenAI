import type { Metadata } from "next";
import EventsDashboard from "../events-dashboard";

export const metadata: Metadata = { title: "Organizer · UBB Events" };

export default function OrganizerPage() {
  return <EventsDashboard />;
}
