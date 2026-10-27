"use client";

import { CalendarDays, Check, LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";

type WelcomeScreenProps = {
  onContinue: () => void;
};

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const [message, setMessage] = useState("");

  function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(
      "Account sign-in is not connected yet. Your details were not sent or saved. Continue as a guest to use the planner.",
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--dayline-ground)] px-4 py-10 text-[var(--dayline-ink)] sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--dayline-line)] bg-white shadow-[0_24px_70px_rgba(27,42,35,0.08)] md:grid-cols-[1fr_0.9fr]">
        <section className="flex flex-col justify-between bg-[var(--dayline-mint)] p-7 sm:p-10 md:p-12">
          <div className="flex w-fit items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--dayline-forest)] text-white">
              <CalendarDays aria-hidden="true" size={20} strokeWidth={1.8} />
            </span>
            <span className="text-lg font-semibold">dayline</span>
          </div>

          <div className="my-12 max-w-md md:my-16">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dayline-forest)]">
              A little more clarity
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Make room for your day.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-[var(--dayline-muted)]">
              Keep your tasks, schedule, and next step together in one calm place.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--dayline-lime)] text-[var(--dayline-forest)]">
              <Check aria-hidden="true" size={18} />
            </span>
            <p className="text-sm leading-6 text-[var(--dayline-ink)]">
              Start with one task. Adjust the plan as your day changes.
            </p>
          </div>
        </section>

        <section className="p-7 sm:p-10 md:p-12" aria-labelledby="sign-in-heading">
          <p className="text-sm font-medium text-[var(--dayline-muted)]">Welcome</p>
          <h2 id="sign-in-heading" className="mt-2 text-2xl font-semibold">
            Sign in to Dayline
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--dayline-muted)]">
            Sign-in is a preview only. You can use the planner without an account.
          </p>

          <form onSubmit={handleSignIn} className="mt-7 space-y-4">
            <label className="block text-sm font-medium" htmlFor="email">
              Email address
              <span className="relative mt-1.5 block">
                <Mail aria-hidden="true" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dayline-muted)]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-lg border border-[var(--dayline-line)] bg-white pl-10 pr-3 text-sm font-normal outline-none transition focus:border-[var(--dayline-forest)] focus:ring-2 focus:ring-[var(--dayline-mint)]"
                />
              </span>
            </label>

            <label className="block text-sm font-medium" htmlFor="password">
              Password
              <span className="relative mt-1.5 block">
                <LockKeyhole aria-hidden="true" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dayline-muted)]" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-lg border border-[var(--dayline-line)] bg-white pl-10 pr-3 text-sm font-normal outline-none transition focus:border-[var(--dayline-forest)] focus:ring-2 focus:ring-[var(--dayline-mint)]"
                />
              </span>
            </label>

            <button
              type="submit"
              className="min-h-11 w-full rounded-lg bg-[var(--dayline-forest)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--dayline-forest-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]"
            >
              Sign in
            </button>
          </form>

          <p aria-live="polite" className="mt-3 min-h-5 text-xs leading-5 text-[var(--dayline-muted)]">
            {message}
          </p>

          <div className="my-5 flex items-center gap-3 text-xs text-[var(--dayline-muted)]">
            <span className="h-px flex-1 bg-[var(--dayline-line)]" />
            or
            <span className="h-px flex-1 bg-[var(--dayline-line)]" />
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="min-h-11 w-full rounded-lg border border-[var(--dayline-line)] bg-white px-4 text-sm font-semibold text-[var(--dayline-ink)] transition-colors hover:bg-[var(--dayline-ground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]"
          >
            Continue as a guest
          </button>
          <p className="mt-4 text-center text-xs leading-5 text-[var(--dayline-muted)]">
            Your planner is a prototype. Tasks are only kept while the page is open.
          </p>
        </section>
      </div>
    </main>
  );
}
