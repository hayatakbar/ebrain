import type { Metadata } from "next";
import { HisabDashboard } from "@/modules/hisab/hisab-dashboard";

export const metadata: Metadata = {
  title: "Dashboard OS",
  description: "Adaptive personal and business workspace with synced Hisab-Kitab.",
};

export default function DashboardPage() {
  return <HisabDashboard />;
}
