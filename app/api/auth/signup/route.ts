// app/api/auth/signup/route.ts
// Handles new operator registration.
// Creates the Supabase Auth user first, then the Operator + OperatorUser
// records in the database. If either step fails, we clean up and return an error.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createOperatorWithOwner } from "@/lib/prisma/operator";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const SignupSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  businessName: z.string().min(2, "Business name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = SignupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, businessName, email, password } = result.data;

    const supabase = await createSupabaseAdminClient();

    // Check if email already exists in our DB
    const existing = await import("@/lib/prisma/client").then(({ prisma }) =>
      prisma.operator.findUnique({ where: { email } })
    );
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Generate a unique slug from the business name
    let slug = slugify(businessName);
    const slugExists = await import("@/lib/prisma/client").then(({ prisma }) =>
      prisma.operator.findUnique({ where: { slug } })
    );
    if (slugExists) {
      // Append a short random suffix to make it unique
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Create the Supabase Auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // auto-confirm for now; set to false to require email verification
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          business_name: businessName,
        },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: authError?.message ?? "Failed to create account.",
        },
        { status: 400 }
      );
    }

    // Create Operator + OperatorUser in our database
    try {
      await createOperatorWithOwner({
        name: businessName,
        slug,
        email,
        supabaseId: authData.user.id,
      });
    } catch (dbError) {
      // DB write failed — clean up the Supabase auth user to keep things consistent
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.error("[signup] DB write failed, rolled back auth user:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to create your account. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[signup] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}