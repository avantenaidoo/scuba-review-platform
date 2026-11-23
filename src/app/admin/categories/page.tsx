import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/features/categories/services/category-service";
import { CategoryList } from "@/features/categories/components/category-list";

async function CategoriesContent() {
    await connection();

    const supabase = await createClient();

    // Verify the signed-in user.
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        redirect("/login");
    }

    // Verify administrator permissions on the server.
    const { data: roleRecord, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

    if (roleError || !roleRecord) {
        throw new Error("Unable to verify administrator permissions.");
    }

    if (roleRecord.role !== "admin") {
        redirect("/member");
    }

    // Retrieve categories only after authorization succeeds.
    let categories;

    try {
        categories = await getCategories(supabase);
    } catch {
        throw new Error("Unable to load categories. Please try again.");
    }

    return (
        <div className="mx-auto max-w-6xl">
            <div className="mb-8">
                <p className="text-sm text-gray-500">
                    <a
                        href="/admin"
                        className="underline underline-offset-4 hover:text-gray-900"
                    >
                        Admin dashboard
                    </a>
                    {" / "}Categories
                </p>
            </div>

            <CategoryList categories={categories} />
        </div>
    );
}

export default function AdminCategoriesPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12">
            <Suspense
                fallback={
                    <p className="text-center text-gray-600">
                        Loading categories...
                    </p>
                }
            >
                <CategoriesContent />
            </Suspense>
        </main>
    );
}