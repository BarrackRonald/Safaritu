"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SignupSuccess() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push("/login");
    }, 2500);

    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">

      {/* glow */}
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/20 blur-3xl rounded-full" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="text-6xl mb-4">🎉</div>

        <h1 className="text-white text-2xl font-bold">
          Account created successfully
        </h1>

        <p className="text-slate-300 mt-2 text-sm">
          Redirecting you to login…
        </p>

        <div className="mt-6 w-40 h-1 bg-white/10 mx-auto rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 animate-pulse" />
        </div>
      </motion.div>
    </main>
  );
}