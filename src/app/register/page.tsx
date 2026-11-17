
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/components/auth/actions";
import { createClient } from "@/lib/supabase/server";

async function RegisterContent() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (!error && data?.claims?.sub) {
        redirect("/member");
    }

    return <AuthForm mode="register" action={signUpAction} />;
}

export default function RegisterPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
            <Suspense
                fallback={
                    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                        Loading...
                    </div>
                }
            >
                <RegisterContent />
            </Suspense>
        </main>
    );
}
