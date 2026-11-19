import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { ProfitTool } from "@/modules/tools/profit-tool";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Free Business & Profit Micro-Tools",
  description: "Free online profit margin, invoice, and tax calculator for individuals and businesses.",
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-3">Free Public Micro-Tools</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Smart Calculators Built for Speed
          </h1>
          <p className="mt-2 text-muted-foreground">
            No sign-up required to calculate—save any record into your ebrain workspace with one click.
          </p>
        </div>
        <ProfitTool />
      </main>
    </div>
  );
}
