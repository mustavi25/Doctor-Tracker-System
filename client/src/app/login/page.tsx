import { Suspense } from "react";
import type { Metadata } from "next";
import { Activity, ShieldCheck, Users } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = { title: "Sign in | Doctor Tracker" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel (desktop only) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-white/5 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-2.5 text-lg font-semibold">
          <Activity className="size-6" aria-hidden /> Doctor Tracker
        </div>
        <div className="relative space-y-6">
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Every doctor. Every patient. One clear view.
          </h2>
          <ul className="space-y-3 text-primary-foreground/80">
            <li className="flex items-center gap-3">
              <Users className="size-5" aria-hidden /> Manage doctors and their patients
            </li>
            <li className="flex items-center gap-3">
              <Activity className="size-5" aria-hidden /> Live analytics and trends
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-5" aria-hidden /> Secure, admin-only access
            </li>
          </ul>
        </div>
        <p className="relative text-sm text-primary-foreground/60">Administrative portal</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to access the admin portal.</p>
          </div>
          {/* useSearchParams() needs a Suspense boundary under Cache Components */}
          <Suspense fallback={<div className="h-56 animate-pulse rounded-xl bg-muted" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
