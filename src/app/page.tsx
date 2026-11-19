import Link from "next/link";
import { ArrowRight, Building2, Shield, UserPlus, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function GuestHomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Badge variant="secondary" className="mb-5 px-3 py-1 text-xs">
              Guest Portal • Multi-Organization Identity
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">
                ebrain
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              You are currently browsing as a <strong>Guest</strong>. Register once as a User, then
              create or join multiple Organizations with distinct roles (Owner, Admin, Employee, or
              Client).
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 text-white hover:bg-indigo-700")}
              >
                <span>Create User Account</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">
            Platform Access Architecture
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <UserPlus className="mb-2 h-6 w-6 text-indigo-600" />
                <CardTitle className="text-base">1. Guest → User</CardTitle>
                <CardDescription>
                  Visitors register simply as a User—no forced account type at sign up.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Building2 className="mb-2 h-6 w-6 text-emerald-600" />
                <CardTitle className="text-base">2. Organizations</CardTitle>
                <CardDescription>
                  Create your company or client organizations inside PostgreSQL.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="mb-2 h-6 w-6 text-sky-600" />
                <CardTitle className="text-base">3. Multi-Role RBAC</CardTitle>
                <CardDescription>
                  Hold different roles (Owner, Employee, Client) across different organizations.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="mb-2 h-6 w-6 text-amber-500" />
                <CardTitle className="text-base">4. Super Admin</CardTitle>
                <CardDescription>
                  Full platform control over users, organizations, roles, and access.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
