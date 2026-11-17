
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/components/auth/actions";
import { createClient } from "@/lib/supabase/server";

async function LoginContent() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (!error && data?.claims?.sub) {
        redirect("/member");
    }

    return <AuthForm mode="login" action={signInAction} />;
}

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
            <Suspense
                fallback={
                    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                        Loading...
                    </div>
                }
            >
                <LoginContent />
            </Suspense>
        </main>
    );
}
