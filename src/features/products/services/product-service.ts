import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ProductInput } from "@/features/products/schemas/product";

const PRODUCT_COLUMNS =
    "id, brand_id, category_id, subcategory_id, name, slug, model_number, description, is_active, is_published, published_at, created_at, updated_at";

export type ProductRecord =
    Database["public"]["Tables"]["products"]["Row"];

type ProductClient = SupabaseClient<Database>;

export async function getProducts(
    supabase: ProductClient
): Promise<ProductRecord[]> {
    const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .order("name", { ascending: true });

    if (error) {
        throw new Error("Unable to retrieve products.");
    }

    return data ?? [];
}

export async function getProductById(
    supabase: ProductClient,
    id: string
): Promise<ProductRecord | null> {
    const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw new Error("Unable to retrieve product.");
    }

    return data;
}

export async function createProduct(
    supabase: ProductClient,
    input: ProductInput
): Promise<ProductRecord> {
    const { data, error } = await supabase
        .from("products")
        .insert(input)
        .select(PRODUCT_COLUMNS)
        .single();

    if (error || !data) {
        throw new Error("Unable to create product.");
    }

    return data;
}

export async function updateProduct(
    supabase: ProductClient,
    id: string,
    input: ProductInput
): Promise<ProductRecord> {
    const { data, error } = await supabase
        .from("products")
        .update(input)
        .eq("id", id)
        .select(PRODUCT_COLUMNS)
        .single();

    if (error || !data) {
        throw new Error("Unable to update product.");
    }

    return data;
}

export async function setProductActive(
    supabase: ProductClient,
    id: string,
    isActive: boolean
): Promise<ProductRecord> {
    const { data, error } = await supabase
        .from("products")
        .update({ is_active: isActive })
        .eq("id", id)
        .select(PRODUCT_COLUMNS)
        .single();

    if (error || !data) {
        throw new Error("Unable to update product status.");
    }

    return data;
}

export async function setProductPublished(
    supabase: ProductClient,
    id: string,
    isPublished: boolean
): Promise<ProductRecord> {
    const { data, error } = await supabase
        .from("products")
        .update({
            is_published: isPublished,
            published_at: isPublished ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select(PRODUCT_COLUMNS)
        .single();

    if (error || !data) {
        throw new Error("Unable to update product publication status.");
    }

    return data;
}