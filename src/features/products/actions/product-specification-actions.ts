"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProductSpecificationInput } from "../services/product-specification-service";
import {
    createProductSpecification,
    updateProductSpecification,
    deleteProductSpecification,
} from "../services/product-specification-service";

type SpecificationActionResult =
    | { success: true; specificationId?: string }
    | { success: false; error: string };

async function getAdminClient() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || typeof userId !== "string") {
        return {
            supabase: null,
            error: "You must be signed in.",
        };
    }

    const { data: roleRecord, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

    if (roleError || roleRecord?.role !== "admin") {
        return {
            supabase: null,
            error: "Administrator access required.",
        };
    }

    return { supabase, error: null };
}

function validateSpecification(
    input: ProductSpecificationInput
): string | null {
    if (
        typeof input.name !== "string" ||
        !input.name.trim()
    ) {
        return "Specification name is required.";
    }

    if (
        input.sort_order !== undefined &&
        (!Number.isInteger(input.sort_order) || input.sort_order < 0)
    ) {
        return "Specification order must be a non-negative integer.";
    }

    if (input.value === undefined) {
        return "Specification value is required.";
    }

    return null;
}

function refreshProductPages(productId: string) {
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
}

export async function createProductSpecificationAction(
    productId: string,
    input: ProductSpecificationInput
): Promise<SpecificationActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    if (!productId.trim()) {
        return { success: false, error: "Invalid product." };
    }

    const validationError = validateSpecification(input);

    if (validationError) {
        return { success: false, error: validationError };
    }

    try {
        const specification = await createProductSpecification(
            auth.supabase,
            productId,
            {
                ...input,
                name: input.name.trim(),
            }
        );

        refreshProductPages(productId);

        return {
            success: true,
            specificationId: specification.id,
        };
    } catch {
        return {
            success: false,
            error: "Unable to create the product specification. Check that its name is not already in use.",
        };
    }
}

export async function updateProductSpecificationAction(
    productId: string,
    specificationId: string,
    input: ProductSpecificationInput
): Promise<SpecificationActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    if (!productId.trim() || !specificationId.trim()) {
        return { success: false, error: "Invalid product specification." };
    }

    const validationError = validateSpecification(input);

    if (validationError) {
        return { success: false, error: validationError };
    }

    try {
        await updateProductSpecification(
            auth.supabase,
            productId,
            specificationId,
            {
                ...input,
                name: input.name.trim(),
            }
        );

        refreshProductPages(productId);

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Unable to update the product specification. Check that its name is not already in use.",
        };
    }
}

export async function deleteProductSpecificationAction(
    productId: string,
    specificationId: string
): Promise<SpecificationActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    if (!productId.trim() || !specificationId.trim()) {
        return { success: false, error: "Invalid product specification." };
    }

    try {
        await deleteProductSpecification(
            auth.supabase,
            productId,
            specificationId
        );

        refreshProductPages(productId);

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Unable to delete the product specification. Please try again.",
        };
    }
}