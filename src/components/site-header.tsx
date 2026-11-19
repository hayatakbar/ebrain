"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Brain, LayoutDashboard, LogOut, Moon, Shield, Sun } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-500 text-white shadow-sm">
            <Brain className="h-5 w-5" />
          </div>
          <span>ebrain</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {isPending ? null : session?.user ? (
            <>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {session.user.name} ({session.user.role || "user"})
              </Badge>
              {session.user.role === "admin" && (
                <Link
                  href="/admin"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <Shield className="mr-1.5 h-4 w-4 text-amber-500" />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: "sm" }), "bg-indigo-600 text-white hover:bg-indigo-700")}
              >
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Sign In
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "sm" }), "bg-indigo-600 text-white hover:bg-indigo-700")}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
