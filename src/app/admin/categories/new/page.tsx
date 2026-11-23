import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireCategoryAdmin } from "@/features/categories/services/category-admin";
import { getParentCategories } from "@/features/categories/services/category-service";
import { CategoryForm } from "@/features/categories/components/category-form";

async function NewCategoryContent() {
    await connection();

    const supabase = await requireCategoryAdmin();
    const parentCategories = await getParentCategories(supabase);

    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8">
                    <p className="text-sm text-gray-500">
                        <Link
                            href="/admin"
                            className="underline underline-offset-4 hover:text-gray-900"
                        >
                            Admin dashboard
                        </Link>
                        {" / "}
                        <Link
                            href="/admin/categories"
                            className="underline underline-offset-4 hover:text-gray-900"
                        >
                            Categories
                        </Link>
                        {" / Add category"}
                    </p>
                </div>

                <CategoryForm parentCategories={parentCategories} />
            </div>
        </main>
    );
}

export default function NewCategoryPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-gray-50 px-6 py-12">
                    <div className="mx-auto max-w-3xl">
                        Loading...
                    </div>
                </main>
            }
        >
            <NewCategoryContent />
        </Suspense>
    );
}