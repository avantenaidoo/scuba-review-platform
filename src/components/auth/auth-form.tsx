
"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "@/components/auth/actions";

type AuthAction = (
    previousState: AuthState,
    formData: FormData
) => Promise<AuthState>;

type AuthFormProps = {
    mode: "login" | "register";
    action: AuthAction;
};

const initialState: AuthState = {
    error: null,
    success: null,
};

export function AuthForm({ mode, action }: AuthFormProps) {
    const [state, formAction, isPending] = useActionState(
        action,
        initialState
    );

    const isRegister = mode === "register";

    return (
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">
                {isRegister ? "Create your account" : "Welcome back"}
            </h1>

            <p className="mt-2 text-sm text-gray-600">
                {isRegister
                    ? "Register to join the scuba equipment review community."
                    : "Sign in to access your account."}
            </p>

            <form action={formAction} className="mt-6 space-y-5">
                {isRegister && (
                    <div>
                        <label
                            htmlFor="display_name"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Full name
                        </label>
                        <input
                            id="display_name"
                            name="display_name"
                            type="text"
                            autoComplete="name"
                            maxLength={100}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                )}

                <div>
                    <label
                        htmlFor="email"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Email address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={isRegister ? "new-password" : "current-password"}
                        minLength={isRegister ? 8 : undefined}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                {isRegister && (
                    <div>
                        <label
                            htmlFor="confirm_password"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Confirm password
                        </label>
                        <input
                            id="confirm_password"
                            name="confirm_password"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                )}

                {state.error && (
                    <p role="alert" className="text-sm text-red-600">
                        {state.error}
                    </p>
                )}

                {state.success && (
                    <p role="status" className="text-sm text-green-700">
                        {state.success}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-lg bg-gray-900 px-4 py-3 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending
                        ? "Please wait..."
                        : isRegister
                            ? "Create account"
                            : "Sign in"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                <Link
                    href={isRegister ? "/login" : "/register"}
                    className="font-medium text-blue-700 hover:underline"
                >
                    {isRegister ? "Sign in" : "Register"}
                </Link>
            </p>
        </div>
    );
}
