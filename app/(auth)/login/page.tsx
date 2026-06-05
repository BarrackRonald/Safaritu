"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { motion } from "framer-motion";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo =
    searchParams.get("redirectTo") ?? "/operator/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-slate-950 to-emerald-900/20" />

      {/* Floating blobs */}
      <div className="absolute w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-3xl top-[-100px] left-[-120px] animate-pulse" />
      <div className="absolute w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-3xl bottom-[-120px] right-[-100px] animate-pulse" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md px-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-bold text-3xl text-white tracking-tight">
              SafariTu
            </span>
            <span className="text-xs text-amber-300 ml-2 tracking-widest uppercase">
              Only Safaris
            </span>
          </Link>

          <h1 className="text-2xl font-bold text-white mt-6">
            Welcome back
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Sign in to your operator dashboard
          </p>
        </div>

        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div className="bg-red-500/10 border border-red-400/20 text-red-200 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-sm text-slate-200">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="you@company.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm text-slate-200">
                  Password
                </label>

                <Link
                  href="/reset-password"
                  className="text-xs text-amber-300 hover:underline"
                >
                  Forgot?
                </Link>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {/* Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
            >
              {loading ? "Signing in..." : "Sign in"}
            </motion.button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-300 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-amber-300 font-medium hover:underline"
          >
            Create one
          </Link>
        </p>
      </motion.div>
    </main>
  );
}