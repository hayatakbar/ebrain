import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Blog & Guides",
  description: "Guides on personal hisab-kitab, digital business ledgers, taxation, and productivity.",
};

const posts = [
  {
    slug: "why-connected-hisab-kitab-beats-isolated-spreadsheets",
    category: "Digital Ledger",
    readTime: "4 min read",
    title: "Why a Connected Hisab-Kitab Beats Isolated Spreadsheets",
    excerpt:
      "When both customer and business share one transparent ledger, disputes drop and trust compounds automatically.",
  },
  {
    slug: "how-freelancers-separate-personal-and-business-cashflow",
    category: "Business Suite",
    readTime: "5 min read",
    title: "How Individuals & Freelancers Separate Personal vs. Business Cashflow",
    excerpt:
      "Switch cleanly between your personal expense tracker and business invoicing without paying for two separate apps.",
  },
  {
    slug: "small-business-profit-margin-checklist",
    category: "Growth & Finance",
    readTime: "3 min read",
    title: "The 3-Minute Profit Margin Checklist Before Sending Any Quote",
    excerpt:
      "Stop underpricing your services—calculate discounts, taxes, and real net profit using our free public tool.",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
        <div className="mb-10">
          <Badge variant="secondary" className="mb-3">ebrain SEO Hub</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Insights, Guides &amp; Playbooks</h1>
          <p className="mt-2 text-muted-foreground">
            Practical resources to help individuals and businesses save time and grow revenue.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.slug} className="flex flex-col justify-between transition hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant="outline">{post.category}</Badge>
                  <span>{post.readTime}</span>
                </div>
                <CardTitle className="text-lg leading-snug">{post.title}</CardTitle>
                <CardDescription className="pt-2">{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  Try related free tool →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
