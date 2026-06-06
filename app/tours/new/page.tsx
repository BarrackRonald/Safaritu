// app/operator/tours/new/page.tsx
// Page for creating a new safari. Wraps TourForm with the operator shell.

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import OperatorShell from "@/components/layout/OperatorShell";
import TourForm from "@/components/tours/TourForm";
import Link from "next/link";

export const metadata = { title: "New Safari — SafariTu" };

export default async function NewTourPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const operatorUser = await getOperatorBySupabaseId(user.id);
  if (!operatorUser) redirect("/login");

  return (
    <OperatorShell operator={operatorUser.operator}>
      <div className="mb-6">
        <Link
          href="/operator/tours"
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← Back to safaris
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 mt-2">
          New safari
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Fill in the details below. You can save as a draft and publish later.
        </p>
      </div>
      <TourForm />
    </OperatorShell>
  );
}