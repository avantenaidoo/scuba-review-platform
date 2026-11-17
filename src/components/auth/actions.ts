
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
    error: string | null;
    success: string | null;
};

const initialError = (message: string): AuthState => ({
    error: message,
    success: null,
});

export async function signInAction(
    _previousState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
        return initialError("Please enter your email and password.");
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return initialError("Invalid email or password.");
    }

    redirect("/member");
}

export async function signUpAction(
    _previousState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const displayName = String(formData.get("display_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(
        formData.get("confirm_password") ?? ""
    );

    if (!displayName || !email || !password || !confirmPassword) {
        return initialError("Please complete all fields.");
    }

    if (displayName.length > 100) {
        return initialError("Your name must be 100 characters or fewer.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return initialError("Please enter a valid email address.");
    }

    if (password.length < 8) {
        return initialError("Your password must contain at least 8 characters.");
    }

    if (password !== confirmPassword) {
        return initialError("Your passwords do not match.");
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName,
            },
        },
    });

    if (error) {
        return initialError(error.message);
    }

    if (data.session) {
        redirect("/member");
    }

    return {
        error: null,
        success: "Registration successful. Please check your email to confirm your account.",
    };
}

export async function signOutAction(): Promise<void> {
    const supabase = await createClient();

    await supabase.auth.signOut();

    redirect("/login");
}
