"use client";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-curious-50 px-4">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-curious-900">Curious</h1>
          <p className="mt-2 text-sm text-curious-600">
            Enter your email to begin.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
