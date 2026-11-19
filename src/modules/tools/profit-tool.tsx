"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProfitTool() {
  const [revenue, setRevenue] = useState("50000");
  const [cost, setCost] = useState("28000");
  const [taxRate, setTaxRate] = useState("15");

  const revNum = Number(revenue) || 0;
  const costNum = Number(cost) || 0;
  const taxNum = Number(taxRate) || 0;

  const taxAmount = Math.round((revNum * taxNum) / 100);
  const netProfit = revNum - costNum - taxAmount;
  const marginPct = revNum > 0 ? ((netProfit / revNum) * 100).toFixed(1) : "0.0";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-indigo-600" />
            <CardTitle>Invoice &amp; Net Profit Calculator</CardTitle>
          </div>
          <CardDescription>
            Free instant tool—calculate real net profit after costs and tax.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rev">Sale / Invoice Amount (PKR)</Label>
            <Input
              id="rev"
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Direct Cost / Expense (PKR)</Label>
            <Input
              id="cost"
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax">Tax / GST (%)</Label>
            <Input
              id="tax"
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col justify-between bg-muted/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Live Breakdown</CardTitle>
            <Badge className={netProfit >= 0 ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}>
              {marginPct}% Margin
            </Badge>
          </div>
          <CardDescription>Updates instantly as you type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-xl border bg-background p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Revenue</span>
              <span className="font-medium">PKR {revNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Direct Costs</span>
              <span className="font-medium text-rose-600">- PKR {costNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Tax ({taxNum}%)</span>
              <span className="font-medium text-amber-600">- PKR {taxAmount.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-base font-bold">
              <span>Net Profit</span>
              <span className={netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                PKR {netProfit.toLocaleString()}
              </span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className={cn(buttonVariants(), "w-full bg-indigo-600 text-white hover:bg-indigo-700")}
          >
            <span>Save Entry to Your Hisab-Kitab Workspace</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
