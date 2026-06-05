"use client";
// app/(auth)/reset-password/page.tsx
// Sends a password reset email via Supabase Auth.

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";

const EmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = EmailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-bold text-2xl text-amber-700">SafariTu</span>
            <span className="text-xs text-stone-400 ml-2 tracking-widest uppercase">
              Only Safaris
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-stone-900 mt-6 mb-1">
            Reset your password
          </h1>
          <p className="text-stone-500 text-sm">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <p className="font-semibold text-stone-900 mb-2">Check your inbox</p>
              <p className="text-sm text-stone-500">
                We&apos;ve sent a password reset link to{" "}
                <span className="font-medium text-stone-700">{email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-stone-700 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-700 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-stone-500 mt-6">
          <Link href="/login" className="text-amber-700 font-medium hover:underline">
            ← Back to sign in
          </Link>
        </p>

      </div>
    </main>
  );
}