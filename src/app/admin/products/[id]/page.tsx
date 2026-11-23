import { Suspense } from "react";
import { connection } from "next/server";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import {
    getAdminProduct,
    getProductFormOptions,
} from "@/features/products/services/product-admin";

import { getProductSpecifications } from "@/features/products/services/product-specification-service";
import { getProductImages } from "@/features/products/services/product-image-service";

import { ProductForm } from "@/features/products/components/product-form";

type EditProductPageProps = {
    params: Promise<{
        id: string;
    }>;
};

async function EditProductContent({
    productId,
}: {
    productId: string;
}) {
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

    // Retrieve the product only after authorization succeeds.
    let product;

    try {
        product = await getAdminProduct(supabase, productId);
    } catch {
        throw new Error("Unable to load product. Please try again.");
    }

    if (!product) {
        notFound();
    }

    // Retrieve form options, specifications and existing images.
    let formOptions: Awaited<ReturnType<typeof getProductFormOptions>>;
    let initialSpecifications: Awaited<
        ReturnType<typeof getProductSpecifications>
    >;
    let initialImages: Awaited<
        ReturnType<typeof getProductImages>
    >;

    try {
        [
            formOptions,
            initialSpecifications,
            initialImages,
        ] = await Promise.all([
            getProductFormOptions(supabase),
            getProductSpecifications(supabase, productId),
            getProductImages(supabase, productId),
        ]);
    } catch {
        throw new Error(
            "Unable to load product form data. Please try again."
        );
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
                    {" / "}
                    <a
                        href="/admin/products"
                        className="underline underline-offset-4 hover:text-gray-900"
                    >
                        Products
                    </a>
                    {" / "}Edit product
                </p>
            </div>

            <ProductForm
                product={product}
                brands={formOptions.brands}
                categories={formOptions.categories}
                initialSpecifications={initialSpecifications}
                initialImages={initialImages}
            />
        </div>
    );
}

export default async function EditAdminProductPage({
    params,
}: EditProductPageProps) {
    const { id } = await params;

    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12">
            <Suspense
                fallback={
                    <p className="text-center text-gray-600">
                        Loading product...
                    </p>
                }
            >
                <EditProductContent productId={id} />
            </Suspense>
        </main>
    );
}
