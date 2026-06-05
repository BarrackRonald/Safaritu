"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { motion } from "framer-motion";

const SignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

type FormData = {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  password: string;
};

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    businessName: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));

    if (fieldErrors[name as keyof FormData]) {
      setFieldErrors((p) => ({ ...p, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = SignupSchema.safeParse(formData);

    if (!result.success) {
      const errors: Partial<FormData> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormData;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Signup failed");
        return;
      }

      router.push("/signup-success");
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">

      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-slate-950 to-emerald-900/20" />

      {/* Floating safari-style lights */}
      <div className="absolute w-[500px] h-[500px] bg-amber-500/20 blur-3xl rounded-full top-[-120px] left-[-100px] animate-pulse" />
      <div className="absolute w-[450px] h-[450px] bg-emerald-500/20 blur-3xl rounded-full bottom-[-120px] right-[-120px] animate-pulse" />

      {/* Container */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md px-4"
      >

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-3xl font-bold text-white tracking-tight">
              SafariTu
            </span>
            <span className="text-xs text-amber-300 ml-2 uppercase tracking-widest">
              Only Safaris
            </span>
          </Link>

          <h1 className="text-2xl font-bold text-white mt-6">
            Create your account
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Start your safari business in minutes
          </p>
        </div>

        {/* Glass card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-2xl p-8">

          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="bg-red-500/10 border border-red-400/20 text-red-200 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">

              <div>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                />
                {fieldErrors.firstName && (
                  <p className="text-xs text-red-300 mt-1">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              <div>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                />
                {fieldErrors.lastName && (
                  <p className="text-xs text-red-300 mt-1">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>

            </div>

            {/* Business */}
            <div>
              <input
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Business name"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              />
              {fieldErrors.businessName && (
                <p className="text-xs text-red-300 mt-1">
                  {fieldErrors.businessName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-300 mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-300 mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center"
            >
              {loading ? "Creating account..." : "Create account"}
            </motion.button>

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-300 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-amber-300 hover:underline">
            Sign in
          </Link>
        </p>

      </motion.div>
    </main>
  );
}