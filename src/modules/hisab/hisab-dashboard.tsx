"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Brain,
  Building2,
  Check,
  ChevronsUpDown,
  Globe,
  Home,
  LayoutGrid,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  User,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type WorkspaceType = "personal" | "business";
type EntryType = "income" | "expense" | "receivable" | "payable";

interface LedgerItem {
  id: string;
  workspace: WorkspaceType;
  title: string;
  counterparty: string;
  type: EntryType;
  amount: number;
  synced: boolean;
  date: string;
}

const initialEntries: LedgerItem[] = [
  {
    id: "1",
    workspace: "personal",
    title: "Monthly Salary Deposit",
    counterparty: "@techcorp-pk",
    type: "income",
    amount: 185000,
    synced: true,
    date: "Today",
  },
  {
    id: "2",
    workspace: "personal",
    title: "Grocery & Household Supplies",
    counterparty: "@al-fatah-mart",
    type: "expense",
    amount: 14500,
    synced: true,
    date: "Yesterday",
  },
  {
    id: "3",
    workspace: "personal",
    title: "Udhaar Given to Bilal",
    counterparty: "@bilal-dev",
    type: "receivable",
    amount: 10000,
    synced: false,
    date: "2 days ago",
  },
  {
    id: "4",
    workspace: "business",
    title: "Tax Filing Retainer — Client #104",
    counterparty: "@nexus-traders",
    type: "income",
    amount: 75000,
    synced: true,
    date: "Today",
  },
  {
    id: "5",
    workspace: "business",
    title: "Pending Invoice — Annual Audit",
    counterparty: "@greenline-logistics",
    type: "receivable",
    amount: 120000,
    synced: true,
    date: "Yesterday",
  },
  {
    id: "6",
    workspace: "business",
    title: "Cloud VPS & Office Internet",
    counterparty: "@contabo-eu",
    type: "expense",
    amount: 8500,
    synced: false,
    date: "3 days ago",
  },
];

export function HisabDashboard() {
  const { theme, setTheme } = useTheme();
  const [workspace, setWorkspace] = useState<WorkspaceType>("personal");
  const [entries, setEntries] = useState<LedgerItem[]>(initialEntries);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [entryType, setEntryType] = useState<EntryType>("income");
  const [amount, setAmount] = useState("");

  const scopedEntries = entries.filter(
    (item) =>
      item.workspace === workspace &&
      (item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.counterparty.toLowerCase().includes(search.toLowerCase()))
  );

  const totalIn = entries
    .filter((i) => i.workspace === workspace && (i.type === "income" || i.type === "receivable"))
    .reduce((acc, cur) => acc + cur.amount, 0);

  const totalOut = entries
    .filter((i) => i.workspace === workspace && (i.type === "expense" || i.type === "payable"))
    .reduce((acc, cur) => acc + cur.amount, 0);

  const netBalance = totalIn - totalOut;

  function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!title.trim() || !numericAmount) return;

    const newItem: LedgerItem = {
      id: Date.now().toString(),
      workspace,
      title: title.trim(),
      counterparty: counterparty.trim()
        ? counterparty.startsWith("@")
          ? counterparty.trim()
          : `@${counterparty.trim()}`
        : "@self",
      type: entryType,
      amount: numericAmount,
      synced: counterparty.trim().length > 0,
      date: "Just now",
    };

    setEntries([newItem, ...entries]);
    setTitle("");
    setCounterparty("");
    setAmount("");
    setOpen(false);
  }

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2.5 px-2 font-bold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-emerald-500 text-white">
            <Brain className="h-4 w-4" />
          </div>
          <span>ebrain OS</span>
        </Link>

        {/* Workspace Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mb-6 w-full justify-between px-3"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              {workspace === "personal" ? (
                <User className="h-4 w-4 text-indigo-500" />
              ) : (
                <Building2 className="h-4 w-4 text-emerald-500" />
              )}
              <span className="truncate font-medium">
                {workspace === "personal" ? "Personal Space" : "TaxationPk Biz"}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setWorkspace("personal")} className="flex justify-between">
              <span className="flex items-center gap-2"><User className="h-4 w-4" /> Personal Space</span>
              {workspace === "personal" && <Check className="h-4 w-4 text-indigo-600" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setWorkspace("business")} className="flex justify-between">
              <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> TaxationPk Biz</span>
              {workspace === "business" && <Check className="h-4 w-4 text-emerald-600" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <nav className="flex-1 space-y-1 text-sm">
          <Button variant="secondary" className="w-full justify-start gap-2.5">
            <Wallet className="h-4 w-4 text-indigo-600" />
            Hisab-Kitab Ledger
          </Button>
          <Link
            href="/tools"
            className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start gap-2.5")}
          >
            <Wrench className="h-4 w-4" /> Free Micro-Tools
          </Link>
          <Link
            href="/p/taxationpk"
            className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start gap-2.5")}
          >
            <Globe className="h-4 w-4" /> Public SEO Profile
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-2.5 text-muted-foreground" disabled>
            <Users className="h-4 w-4" /> Affiliates &amp; Referrals
            <Badge variant="outline" className="ml-auto text-[10px]">Soon</Badge>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2.5 text-muted-foreground" disabled>
            <Sparkles className="h-4 w-4" /> AI Assistant Hub
            <Badge variant="outline" className="ml-auto text-[10px]">P3</Badge>
          </Button>
        </nav>

        <div className="mt-auto rounded-xl border bg-muted/40 p-3 text-xs">
          <p className="font-medium">Referral Code: EBRAIN-PK</p>
          <p className="mt-1 text-muted-foreground">Invite businesses to auto-sync ledgers.</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="md:hidden">
              <Brain className="h-6 w-6 text-indigo-600" />
            </Link>
            <div>
              <h1 className="text-base font-semibold sm:text-lg">
                {workspace === "personal" ? "Personal Hisab-Kitab" : "Business Command Ledger"}
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {workspace === "personal"
                  ? "Track daily expenses, income & personal udhaar"
                  : "Synced client invoices, payables & network statistics"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setWorkspace(workspace === "personal" ? "business" : "personal")}
            >
              {workspace === "personal" ? "Personal" : "Business"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger
                className={cn(buttonVariants({ size: "sm" }), "bg-indigo-600 text-white hover:bg-indigo-700")}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Entry
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New {workspace === "personal" ? "Personal" : "Business"} Entry</DialogTitle>
                  <DialogDescription>
                    Add a @handle to sync this entry across the ebrain network.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddEntry} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="entry-title">Description</Label>
                    <Input
                      id="entry-title"
                      placeholder="e.g., Web Design Retainer or Grocery"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entry-party">Counterparty Handle (Optional)</Label>
                    <Input
                      id="entry-party"
                      placeholder="e.g., @zara-mart or @ali"
                      value={counterparty}
                      onChange={(e) => setCounterparty(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="entry-type">Type</Label>
                      <select
                        id="entry-type"
                        value={entryType}
                        onChange={(e) => setEntryType(e.target.value as EntryType)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                      >
                        <option value="income">Income (+)</option>
                        <option value="receivable">Receivable / Udhaar (+)</option>
                        <option value="expense">Expense (-)</option>
                        <option value="payable">Payable (-)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entry-amt">Amount (PKR)</Label>
                      <Input
                        id="entry-amt"
                        type="number"
                        placeholder="5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                    Save to Ledger
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Net Balance ({workspace})</CardDescription>
                <CardTitle className="text-2xl font-bold">
                  PKR {netBalance.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-xs">Live Synced</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total In (Income + Receivable)</CardDescription>
                <CardTitle className="text-2xl font-bold text-emerald-600">
                  + PKR {totalIn.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" /> Incoming cashflow
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Out (Expense + Payable)</CardDescription>
                <CardTitle className="text-2xl font-bold text-rose-600">
                  - PKR {totalOut.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" /> Outgoing &amp; bills
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="ledger" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="ledger">Hisab-Kitab Entries</TabsTrigger>
                <TabsTrigger value="modules">Module App Store</TabsTrigger>
              </TabsList>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entry or @handle..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="ledger">
              <Card>
                <CardContent className="divide-y p-0">
                  {scopedEntries.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No entries match your search. Click &ldquo;Add Entry&rdquo; to log one!
                    </div>
                  ) : (
                    scopedEntries.map((item) => {
                      const isPositive = item.type === "income" || item.type === "receivable";
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 p-4 transition hover:bg-muted/40"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-medium text-sm">{item.title}</p>
                              {item.synced && (
                                <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-600 border-emerald-500/30">
                                  <RefreshCw className="h-2.5 w-2.5" /> Network Synced
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.counterparty} • {item.type.toUpperCase()} • {item.date}
                            </p>
                          </div>
                          <div className={`shrink-0 text-sm font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                            {isPositive ? "+" : "-"} PKR {item.amount.toLocaleString()}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="modules">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Hisab-Kitab Sync</CardTitle>
                      <Badge className="bg-emerald-600 text-white">Active</Badge>
                    </div>
                    <CardDescription>Dual-sided personal &amp; business digital ledger.</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Marketplace &amp; Ads</CardTitle>
                      <Badge variant="secondary">Phase 2</Badge>
                    </div>
                    <CardDescription>Promoted listings, bookings &amp; B2C wallet payments.</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">AI Assistant Hub</CardTitle>
                      <Badge variant="secondary">Phase 3</Badge>
                    </div>
                    <CardDescription>Ask questions across your invoices, tax &amp; cashflow.</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur md:hidden">
        <Link href="/" className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
          <Home className="h-4 w-4" /> Home
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[11px] font-medium text-indigo-600">
          <LayoutGrid className="h-4 w-4" /> Ledger
        </Link>
        <Link href="/tools" className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
          <Wrench className="h-4 w-4" /> Tools
        </Link>
        <Link href="/p/taxationpk" className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
          <User className="h-4 w-4" /> Profile
        </Link>
      </nav>
    </div>
  );
}
