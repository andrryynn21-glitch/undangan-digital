"use client";

import { useActionState } from "react";

import { login } from "@/lib/auth-actions";
import { LOGIN_INITIAL_STATE } from "@/lib/form-state";

/** Disamakan dengan `fieldClass` di InvitationForm agar satu keluarga tampilan. */
const fieldClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    login,
    LOGIN_INITIAL_STATE
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={fieldClass}
        />
      </label>

      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Memeriksa..." : "Login"}
      </button>
    </form>
  );
}
