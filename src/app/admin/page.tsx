import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/components/auth/actions";

export async function AdminContent() {
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

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Brands */}
                    <Link
                        href="/admin/brands"
                        className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-sm"
                    >
                        <h3 className="font-semibold text-gray-900">
                            Brands
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Add, edit and manage equipment brands and upload their logos.
                        </p>
                        <span className="mt-4 inline-block text-sm font-medium text-gray-900">
                            Manage brands →
                        </span>
                    </Link>

                    {/* Categories */}
                    <Link
                        href="/admin/categories"
                        className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-sm"
                    >
                        <h3 className="font-semibold text-gray-900">
                            Categories
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Create, edit and manage equipment categories used in the catalogue.
                        </p>
                        <span className="mt-4 inline-block text-sm font-medium text-gray-900">
                            Manage categories →
                        </span>
                    </Link>


                    {/* Products */}
                    <Link
                        href="/admin/products"
                        className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-sm"
                    >
                        <h3 className="font-semibold text-gray-900">
                            Products
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Add and manage products, including their brand, category, specifications and optimised images.
                        </p>
                        <span className="mt-4 inline-block text-sm font-medium text-gray-900">
                            Manage products →
                        </span>
                    </Link>

                </div>
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
