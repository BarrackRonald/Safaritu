// components/tours/TourStatusBadge.tsx
// Displays a colour-coded badge for tour status.

import type { TourStatus } from "@/types";

const STATUS_STYLES: Record<TourStatus, string> = {
  DRAFT: "bg-stone-100 text-stone-600",
  PUBLISHED: "bg-green-50 text-green-700",
  ARCHIVED: "bg-red-50 text-red-600",
};

const STATUS_LABELS: Record<TourStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export default function TourStatusBadge({ status }: { status: TourStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}