import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireCategoryAdmin } from "@/features/categories/services/category-admin";
import {
    getCategoryById,
    getParentCategories,
} from "@/features/categories/services/category-service";
import { CategoryForm } from "@/features/categories/components/category-form";

type EditCategoryPageProps = {
    params: Promise<{ id: string }>;
};

async function EditCategoryContent({ params }: EditCategoryPageProps) {
    await connection();

    const { id } = await params;
    const supabase = await requireCategoryAdmin();

    const category = await getCategoryById(supabase, id);

    if (!category) {
        notFound();
    }

    const parentCategories = await getParentCategories(supabase, id);

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
                        {" / Edit category"}
                    </p>
                </div>

                <CategoryForm
                    category={category}
                    parentCategories={parentCategories}
                />
            </div>
        </main>
    );
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-gray-50 px-6 py-12">
                    <div className="mx-auto max-w-3xl">
                        Loading category...
                    </div>
                </main>
            }
        >
            <EditCategoryContent params={params} />
        </Suspense>
    );
}