import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProductFormOptions } from "@/features/products/services/product-admin";
import { ProductForm } from "@/features/products/components/product-form";

async function NewProductContent() {
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

    // Retrieve form options only after authorization succeeds.
    let brands;
    let categories;

    try {
        const options = await getProductFormOptions(supabase);
        brands = options.brands;
        categories = options.categories;
    } catch {
        throw new Error("Unable to load product form options. Please try again.");
    }

    return (
        <div className="mx-auto max-w-6xl">
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
                        href="/admin/products"
                        className="underline underline-offset-4 hover:text-gray-900"
                    >
                        Products
                    </Link>
                    {" / "}Add product
                </p>
            </div>

            <ProductForm
                brands={brands}
                categories={categories}
            />
        </div>
    );
}

export default function NewAdminProductPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12">
            <Suspense
                fallback={
                    <p className="text-center text-gray-600">
                        Loading product form...
                    </p>
                }
            >
                <NewProductContent />
            </Suspense>
        </main>
    );
}
