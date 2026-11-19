"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Brain, Moon, Sun, LayoutDashboard, Wrench, BookOpen, UserCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-500 text-white shadow-sm">
            <Brain className="h-5 w-5" />
          </div>
          <span>ebrain</span>
          <span className="hidden rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            OS v1
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/blog" className="flex items-center gap-1.5 transition hover:text-foreground">
            <BookOpen className="h-4 w-4" /> Blog
          </Link>
          <Link href="/tools" className="flex items-center gap-1.5 transition hover:text-foreground">
            <Wrench className="h-4 w-4" /> Free Tools
          </Link>
          <Link href="/p/taxationpk" className="flex items-center gap-1.5 transition hover:text-foreground">
            <UserCheck className="h-4 w-4" /> Public Profile
          </Link>
        </nav>

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
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ size: "sm" }), "bg-indigo-600 text-white hover:bg-indigo-700")}
          >
            <LayoutDashboard className="h-4 w-4 mr-1.5" />
            <span>Open OS</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
