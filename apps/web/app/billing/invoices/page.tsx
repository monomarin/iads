"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Invoice {
  id: string;
  amount: string;
  currency: string;
  status: string;
  paidAt: string | null;
  pdfUrl: string | null;
  createdAt: string;
}

export default function InvoicesPage() {
  const { getToken, isSignedIn } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    loadData();
  }, [isSignedIn]);

  async function loadData() {
    const token = (await getToken()) || undefined;
    const res = await api.get("/api/billing/invoices", token);
    setInvoices((res as { invoices: Invoice[] }).invoices ?? []);
    setLoading(false);
  }

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Invoices</h1>

        {invoices.length === 0 ? (
          <div className="mt-20 text-center text-muted-foreground">No invoices yet.</div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <Card key={inv.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-foreground">
                    ${inv.amount} {inv.currency.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    inv.status === "paid" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {inv.status}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
