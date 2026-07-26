"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { CUSTOMERS } from "@/lib/data/mock";

/**
 * Customers — Figma 3847:20531.
 * Heading 18px/600, caption 14px/400 muted, then the registered-customer table.
 * The design shows an em dash where a customer has no company.
 */
export default function CustomersPage() {
  const [query, setQuery] = React.useState("");

  const visible = CUSTOMERS.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company ?? "").toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold leading-7 text-brand">
              Customers
            </h2>
            <p className="text-sm leading-5 text-muted">
              {CUSTOMERS.length} registered customers
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers..."
              aria-label="Search customers"
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {visible.length === 0 ? (
          <p className="border-t border-line py-12 text-center text-sm text-muted">
            No customers found
          </p>
        ) : (
          <Table>
            {/* Figma: 40px header band filled rgba(196,188,176,0.3). */}
            <THead tinted>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Phone</TH>
                <TH>Company</TH>
                <TH className="text-center">Orders</TH>
              </TR>
            </THead>
            <TBody>
              {visible.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <span className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <span className="font-medium">{c.name}</span>
                    </span>
                  </TD>
                  <TD className="text-muted">{c.email}</TD>
                  <TD className="whitespace-nowrap text-muted">{c.phone}</TD>
                  <TD className={c.company ? "" : "text-muted"}>
                    {c.company ?? "—"}
                  </TD>
                  {/* Figma: the order count is a brand-filled pill, not plain text. */}
                  <TD className="text-center">
                    <Badge tone="solid" className="tabular-nums">
                      {c.orders}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
