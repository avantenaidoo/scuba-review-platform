
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/components/auth/actions";

async function MemberContent() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;

    if (error || !claims?.sub) {
        redirect("/login");
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", claims.sub)
        .maybeSingle();

    if (profileError || !profile) {
        throw new Error("Unable to load your account profile.");
    }

    const { data: roleRecord, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", claims.sub)
        .maybeSingle();

    if (roleError || !roleRecord) {
        throw new Error("Unable to verify your account permissions.");
    }

    return (
        <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">
                        Scuba Equipment Review Platform
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                        Welcome, {profile.display_name || "Diver"}
                    </h1>
                </div>

                <form action={signOutAction}>
                    <button
                        type="submit"
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Sign out
                    </button>
                </form>
            </div>

            <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                    Your account
                </h2>

                <p className="mt-3 text-sm text-gray-600">
                    Account role: <strong>{roleRecord.role}</strong>
                </p>

                <p className="mt-2 text-sm text-gray-600">
                    Your membership and equipment catalogue access will appear here.
                </p>
            </section>
        </div>
    );
}

export default function MemberDashboard() {
    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12">
            <Suspense fallback={<p className="text-center text-gray-600">Loading your account...</p>}>
                <MemberContent />
            </Suspense>
        </main>
    );
}
