import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MapPin, Star, ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `@${handle} — Verified Public Profile`,
    description: `Connect, view services, and sync digital ledger entries with @${handle} on ebrain.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const initials = handle.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-indigo-600 text-white text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">@{handle}</CardTitle>
                  <Badge className="bg-emerald-600 text-white flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified Business
                  </Badge>
                </div>
                <CardDescription className="mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Pakistan</span>
                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" /> 4.9 Trust Score</span>
                </CardDescription>
              </div>
            </div>

            <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
              <Link href="/dashboard" className="flex items-center gap-1.5">
                <span>Sync Ledger / Connect</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent className="grid gap-4 pt-2 sm:grid-cols-3">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">Synced Transactions</p>
              <p className="mt-1 text-2xl font-bold">142</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">Active Modules</p>
              <p className="mt-1 text-2xl font-bold">Ledger + Tax</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">Referral Partner</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">Active</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
