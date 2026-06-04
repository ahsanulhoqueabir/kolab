"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import Image from "next/image";
import { siteConfig } from "@/config/site.config";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const login = useAuthStore((s) => s.login);
  const isProcessing = useAuthStore((s) => s.isProcessing);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    clearError();

    try {
      await login({ email: data.email, password: data.password });

      // Redirect to the user's role landing page, or fall back to returnTo / dashboard
      const { landingPage } = useAuthStore.getState();
      const returnTo = searchParams.get("returnTo");
      const target = returnTo || landingPage || "/dashboard";
      router.push(target);
    } catch {
      // error is already set in the store
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side: Content */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-4 dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          {/* Logo & Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center rounded-2xl bg-zinc-100 p-3 dark:bg-zinc-900">
              <Image
                src="/kolab.png"
                alt="Kolab Logo"
                className="h-10 w-auto"
                width={40}
                height={40}
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Please enter your details to sign in
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                autoComplete="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={"Enter your password"}
                  autoComplete="current-password"
                  className="pr-10"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20">
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isProcessing}
              className="h-11 w-full rounded-xl bg-zinc-900 text-sm font-semibold text-white transition-all hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {isProcessing ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} Kolab Enterprise. All rights
            reserved.
          </p>
        </div>
      </div>

      {/* Right side: Image/Abstract (hidden on mobile) */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-zinc-900 px-12 lg:flex">
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#4f4f4f,transparent)]" />
        <div className="z-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            {siteConfig.tagline}
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto">
            {siteConfig.description}
          </p>
        </div>
        {/* Subtle decorative elements */}
        <div className="mt-12 grid grid-cols-2 gap-4 z-10 opacity-30">
          <div className="h-32 w-32 rounded-3xl border border-zinc-700 rotate-12" />
          <div className="h-32 w-32 rounded-3xl bg-zinc-800 -rotate-12" />
        </div>
      </div>
    </div>
  );
}
