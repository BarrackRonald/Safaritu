// app/api/auth/signout/route.ts
// Signs the user out and redirects to the login page.
// Called as a POST from the dashboard sign-out button.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_APP_URL!),
    { status: 302 }
  );
}