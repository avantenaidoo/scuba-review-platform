
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/components/auth/actions";

async function AdminContent() {
    await connection();
    
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;

    if (error || !claims?.sub) {
        redirect("/login");
    }

    const { data: roleRecord, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", claims.sub)
        .maybeSingle();

    if (roleError || !roleRecord) {
        throw new Error("Unable to verify administrator permissions.");
    }

    if (roleRecord.role !== "admin") {
        redirect("/member");
    }

    return (
        <div className="mx-auto max-w-6xl">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">
                        Scuba Equipment Review Platform
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                        Admin Dashboard
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
            </header>

            <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                    Administration
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                    Manage the equipment catalogue, including brands, categories,
                    products, specifications and images.
                </p>

                <p className="mt-4 text-sm text-gray-500">
                    Catalogue management will be available here as the admin features
                    are implemented.
                </p>
            </section>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12">
            <Suspense
                fallback={
                    <p className="text-center text-gray-600">
                        Loading administrator dashboard...
                    </p>
                }
            >
                <AdminContent />
            </Suspense>
        </main>
    );
}
