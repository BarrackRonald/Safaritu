"use client";
// components/crm/CustomerLeadStatusSelect.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadStatus } from "@prisma/client";

type Props = { customerId: string; current: LeadStatus };

const OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "LEAD",      label: "Lead"      },
  { value: "PROSPECT",  label: "Prospect"  },
  { value: "CUSTOMER",  label: "Customer"  },
  { value: "VIP",       label: "VIP"       },
  { value: "INACTIVE",  label: "Inactive"  },
];

const STYLES: Record<LeadStatus, string> = {
  LEAD:     "bg-blue-50   text-blue-700   border-blue-200",
  PROSPECT: "bg-amber-50  text-amber-700  border-amber-200",
  CUSTOMER: "bg-green-50  text-green-700  border-green-200",
  VIP:      "bg-purple-50 text-purple-700 border-purple-200",
  INACTIVE: "bg-stone-100 text-stone-500  border-stone-200",
};

export default function CustomerLeadStatusSelect({ customerId, current }: Props) {
  const router  = useRouter();
  const [status,  setStatus]  = useState<LeadStatus>(current);
  const [loading, setLoading] = useState(false);

  async function handleChange(next: LeadStatus) {
    if (next === status) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/customers/${customerId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ leadStatus: next }),
      });
      const data = await res.json();
      if (data.success) { setStatus(next); router.refresh(); }
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as LeadStatus)}
      disabled={loading}
      className={`text-xs font-semibold border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-50 transition-colors ${STYLES[status]}`}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}