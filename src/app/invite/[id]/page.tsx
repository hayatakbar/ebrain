"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Building2, CheckCircle2, Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface InviteInfo {
  id: string;
  email: string;
  role: string;
  status: string;
  orgName: string;
  orgSlug: string;
}

export default function AcceptInvitePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/invitations/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invitation not found.");
      } else {
        setInvite(data.invitation);
      }
      setLoading(false);
    }
    if (params.id) load();
  }, [params.id]);

  async function handleAccept() {
    setError("");
    setAccepting(true);
    const res = await fetch(`/api/invitations/${params.id}/accept`, { method: "POST" });
    const data = await res.json();
    setAccepting(false);

    if (!res.ok) {
      setError(data.error || "Could not accept invitation.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const currentPath = `/invite/${params.id}`;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl">Organization Invitation</CardTitle>
            <CardDescription>
              Join an organization workspace on ebrain with your assigned role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading || isPending ? (
              <p className="text-sm text-muted-foreground">Loading invitation...</p>
            ) : error && !invite ? (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-600">
                {error}
              </div>
            ) : invite ? (
              <>
                <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Organization</span>
                    <span className="font-semibold">{invite.orgName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned Role</span>
                    <Badge className="capitalize">{invite.role}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invited Email</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Mail className="h-3.5 w-3.5" /> {invite.email}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}

                {!session?.user ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Register or sign in using <strong>{invite.email}</strong> to accept this invite.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/register?redirect=${encodeURIComponent(currentPath)}`}
                        className={cn(buttonVariants(), "bg-indigo-600 text-white hover:bg-indigo-700")}
                      >
                        Register
                      </Link>
                      <Link
                        href={`/login?redirect=${encodeURIComponent(currentPath)}`}
                        className={buttonVariants({ variant: "outline" })}
                      >
                        Sign In
                      </Link>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleAccept}
                    disabled={accepting || invite.status !== "pending"}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {invite.status !== "pending"
                      ? `Invitation ${invite.status}`
                      : accepting
                        ? "Joining..."
                        : `Accept & Join ${invite.orgName}`}
                  </Button>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
