import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProductById } from "./product-service";

type ProductAdminClient = SupabaseClient<Database>;

type BrandOption = Pick<
    Database["public"]["Tables"]["brands"]["Row"],
    "id" | "name"
>;

type CategoryOption = Pick<
    Database["public"]["Tables"]["categories"]["Row"],
    "id" | "name" | "parent_id"
>;

export type AdminProductListItem = {
    id: string;
    name: string;
    brandName: string;
    categoryName: string;
    modelNumber: string | null;
    isActive: boolean;
    isPublished: boolean;
    mainImageUrl: string | null;
};

export async function requireProductAdmin(): Promise<ProductAdminClient> {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || typeof userId !== "string") {
        redirect("/login");
    }

    const { data: roleRecord, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

    if (roleError) {
        throw new Error("Unable to verify administrator access.");
    }

    if (roleRecord?.role !== "admin") {
        redirect("/member");
    }

    return supabase;
}

export async function getProductFormOptions(
    supabase: ProductAdminClient
): Promise<{
    brands: BrandOption[];
    categories: CategoryOption[];
}> {
    const [brandsResult, categoriesResult] = await Promise.all([
        supabase
            .from("brands")
            .select("id, name")
            .eq("is_active", true)
            .order("name", { ascending: true }),

        supabase
            .from("categories")
            .select("id, name, parent_id")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true }),
    ]);

    if (brandsResult.error) {
        throw new Error("Unable to retrieve active brands.");
    }

    if (categoriesResult.error) {
        throw new Error("Unable to retrieve active categories.");
    }

    return {
        brands: brandsResult.data ?? [],
        categories: categoriesResult.data ?? [],
    };
}

export async function getAdminProducts(
    supabase: ProductAdminClient
): Promise<AdminProductListItem[]> {
    const { data: products, error: productsError } = await supabase
        .from("products")
        .select(
            "id, name, model_number, brand_id, category_id, is_active, is_published"
        )
        .order("name", { ascending: true });

    if (productsError) {
        throw new Error("Unable to retrieve products.");
    }

    if (!products?.length) {
        return [];
    }

    const brandIds = [...new Set(products.map((product) => product.brand_id))];
    const categoryIds = [
        ...new Set(products.map((product) => product.category_id)),
    ];
    const productIds = products.map((product) => product.id);

    const [brandsResult, categoriesResult, imagesResult] = await Promise.all([
        supabase
            .from("brands")
            .select("id, name")
            .in("id", brandIds),

        supabase
            .from("categories")
            .select("id, name")
            .in("id", categoryIds),

        supabase
            .from("product_images")
            .select("product_id, storage_path")
            .in("product_id", productIds)
            .eq("is_primary", true),
    ]);

    if (brandsResult.error) {
        throw new Error("Unable to retrieve product brands.");
    }

    if (categoriesResult.error) {
        throw new Error("Unable to retrieve product categories.");
    }

    if (imagesResult.error) {
        throw new Error("Unable to retrieve product images.");
    }

    const brandNames = new Map(
        (brandsResult.data ?? []).map((brand) => [brand.id, brand.name])
    );

    const categoryNames = new Map(
        (categoriesResult.data ?? []).map((category) => [
            category.id,
            category.name,
        ])
    );

    const primaryImagePaths = new Map(
        (imagesResult.data ?? []).map((image) => [
            image.product_id,
            image.storage_path,
        ])
    );

    const signedImageUrls = new Map<string, string>();

    await Promise.all(
        [...primaryImagePaths.entries()].map(async ([productId, path]) => {
            const { data, error } = await supabase.storage
                .from("product-images")
                .createSignedUrl(path, 3600);

            if (error || !data?.signedUrl) {
                throw new Error("Unable to retrieve product image URLs.");
            }

            signedImageUrls.set(productId, data.signedUrl);
        })
    );

    return products.map((product) => ({
        id: product.id,
        name: product.name,
        brandName: brandNames.get(product.brand_id) ?? "Unknown brand",
        categoryName:
            categoryNames.get(product.category_id) ?? "Unknown category",
        modelNumber: product.model_number,
        isActive: product.is_active,
        isPublished: product.is_published,
        mainImageUrl: signedImageUrls.get(product.id) ?? null,
    }));
}

export async function getAdminProduct(
    supabase: ProductAdminClient,
    id: string
) {
    const product = await getProductById(supabase, id);

    if (!product) {
        return null;
    }

    return product;
}