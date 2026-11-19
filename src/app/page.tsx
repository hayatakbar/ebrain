import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
  Wrench,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
            <Badge variant="secondary" className="mb-6 px-3.5 py-1 text-xs font-medium">
              Individuals • Businesses • Connected Network
            </Badge>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
              One Brain for Your{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">
                Life, Business &amp; Hisab-Kitab
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Manage personal expenses, run your business suite, sync digital ledgers with customers,
              and grow with public SEO profiles and free micro-tools—all inside one modular OS.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 text-white hover:bg-indigo-700")}
              >
                <span>Launch Dashboard OS</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/tools"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                <Wrench className="mr-2 h-4 w-4" />
                <span>Try Free Micro-Tools</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Every Doorway Leads to One Connected Ecosystem
            </h2>
            <p className="text-muted-foreground">
              Public SEO tools bring users in; adaptive workspaces keep them organized.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="transition hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <CardTitle>Synced Hisab-Kitab</CardTitle>
                <CardDescription>
                  Unlike isolated software, invoices and udhaar entries sync between individuals and
                  businesses on one network.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  Open Ledger Dashboard →
                </Link>
              </CardContent>
            </Card>

            <Card className="transition hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Wrench className="h-5 w-5" />
                </div>
                <CardTitle>Free Public Micro-Tools</CardTitle>
                <CardDescription>
                  Instant profit, margin, and invoice calculators open to everyone on Google—save
                  results straight into your workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  Try Profit Calculator →
                </Link>
              </CardContent>
            </Card>

            <Card className="transition hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <CardTitle>SEO Blog &amp; Public Profiles</CardTitle>
                <CardDescription>
                  Publish guides, showcase verified business profiles, build trust scores, and unlock
                  referrals and promotions.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Link href="/blog" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  Read Blog →
                </Link>
                <Link href="/p/taxationpk" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  Sample Profile →
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h3 className="mb-6 text-lg font-semibold">Modular Rollout Architecture</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-xl border bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-sm">Phase 1: Core OS &amp; SEO (Live)</p>
                  <p className="text-xs text-muted-foreground">
                    Hisab-Kitab, Workspace Switcher, Blog, Free Micro-Tools, Public Profiles
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border bg-background p-4">
                <Layers className="mt-0.5 h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-medium text-sm">Phase 2: Commerce &amp; Native Apps</p>
                  <p className="text-xs text-muted-foreground">
                    Marketplace, Chat, Ads &amp; Affiliates, Windows/Mac/iOS/Android Apps
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border bg-background p-4">
                <Sparkles className="mt-0.5 h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Phase 3: AI Assistant Hub</p>
                  <p className="text-xs text-muted-foreground">
                    Smart insights powered by 100% tested ledger and business data
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            ebrain Modular OS • Built to Scale
          </span>
          <div className="flex gap-4">
            <Link href="/blog" className="hover:underline flex items-center gap-1"><BookOpen className="h-3 w-3" /> Blog</Link>
            <Link href="/tools" className="hover:underline flex items-center gap-1"><Wrench className="h-3 w-3" /> Tools</Link>
            <Link href="/dashboard" className="hover:underline flex items-center gap-1"><Building2 className="h-3 w-3" /> Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
