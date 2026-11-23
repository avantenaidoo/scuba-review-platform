import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type ProductSpecification =
    Database["public"]["Tables"]["product_specifications"]["Row"];

export type ProductSpecificationInput = {
    name: string;
    value: ProductSpecification["value"];
    sort_order?: number;
};

type ProductSpecificationClient = SupabaseClient<Database>;

export async function getProductSpecifications(
    supabase: ProductSpecificationClient,
    productId: string
): Promise<ProductSpecification[]> {
    const { data, error } = await supabase
        .from("product_specifications")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    if (error) {
        throw new Error("Unable to retrieve product specifications.");
    }

    return data ?? [];
}

export async function createProductSpecification(
    supabase: ProductSpecificationClient,
    productId: string,
    input: ProductSpecificationInput
): Promise<ProductSpecification> {
    const { data, error } = await supabase
        .from("product_specifications")
        .insert({
            product_id: productId,
            name: input.name,
            value: input.value,
            sort_order: input.sort_order ?? 0,
        })
        .select("*")
        .single();

    if (error || !data) {
        throw new Error("Unable to create product specification.");
    }

    return data;
}

export async function updateProductSpecification(
    supabase: ProductSpecificationClient,
    productId: string,
    specificationId: string,
    input: ProductSpecificationInput
): Promise<ProductSpecification> {
    const { data, error } = await supabase
        .from("product_specifications")
        .update({
            name: input.name,
            value: input.value,
            sort_order: input.sort_order ?? 0,
        })
        .eq("product_id", productId)
        .eq("id", specificationId)
        .select("*")
        .single();

    if (error || !data) {
        throw new Error("Unable to update product specification.");
    }

    return data;
}

export async function deleteProductSpecification(
    supabase: ProductSpecificationClient,
    productId: string,
    specificationId: string
): Promise<void> {
    const { error } = await supabase
        .from("product_specifications")
        .delete()
        .eq("product_id", productId)
        .eq("id", specificationId);

    if (error) {
        throw new Error("Unable to delete product specification.");
    }
}