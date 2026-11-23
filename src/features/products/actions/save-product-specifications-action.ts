"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
    createProductSpecification,
    deleteProductSpecification,
    getProductSpecifications,
    updateProductSpecification,
} from "../services/product-specification-service";

export type ProductSpecificationSaveInput = {
    id?: string;
    name: string;
    value: string;
    sort_order: number;
};

type SaveProductSpecificationsResult =
    | { success: true }
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

function validateSpecifications(
    specifications: ProductSpecificationSaveInput[]
): string | null {
    if (!Array.isArray(specifications)) {
        return "Invalid product specifications.";
    }

    const names = new Set<string>();

    for (const specification of specifications) {
        if (
            !specification ||
            typeof specification.name !== "string" ||
            !specification.name.trim()
        ) {
            return "Every specification must have a name.";
        }

        if (
            specification.name.trim().length > 100 ||
            typeof specification.value !== "string" ||
            specification.value.length > 500
        ) {
            return "A specification exceeds the allowed length.";
        }

        if (
            !Number.isInteger(specification.sort_order) ||
            specification.sort_order < 0
        ) {
            return "Invalid specification order.";
        }

        const normalizedName = specification.name.trim().toLowerCase();

        if (names.has(normalizedName)) {
            return "Specification names must be unique.";
        }

        names.add(normalizedName);

        if (
            specification.id !== undefined &&
            (typeof specification.id !== "string" ||
                !specification.id.trim())
        ) {
            return "Invalid specification ID.";
        }
    }

    return null;
}

export async function saveProductSpecificationsAction(
    productId: string,
    specifications: ProductSpecificationSaveInput[]
): Promise<SaveProductSpecificationsResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    if (typeof productId !== "string" || !productId.trim()) {
        return { success: false, error: "Invalid product." };
    }

    const validationError = validateSpecifications(specifications);

    if (validationError) {
        return { success: false, error: validationError };
    }

    try {
        const existingSpecifications = await getProductSpecifications(
            auth.supabase,
            productId
        );

        const existingById = new Map(
            existingSpecifications.map((specification) => [
                specification.id,
                specification,
            ])
        );

        const submittedIds = new Set<string>();

        for (const specification of specifications) {
            if (specification.id) {
                if (
                    !existingById.has(specification.id) ||
                    submittedIds.has(specification.id)
                ) {
                    return {
                        success: false,
                        error: "A submitted specification does not belong to this product.",
                    };
                }

                submittedIds.add(specification.id);
            }
        }

        for (const specification of specifications) {
            const input = {
                name: specification.name.trim(),
                value: specification.value,
                sort_order: specification.sort_order,
            };

            if (specification.id) {
                await updateProductSpecification(
                    auth.supabase,
                    productId,
                    specification.id,
                    input
                );
            } else {
                await createProductSpecification(
                    auth.supabase,
                    productId,
                    input
                );
            }
        }

        const removedSpecifications = existingSpecifications.filter(
            (specification) => !submittedIds.has(specification.id)
        );

        for (const specification of removedSpecifications) {
            await deleteProductSpecification(
                auth.supabase,
                productId,
                specification.id
            );
        }

        revalidatePath("/admin/products");
        revalidatePath(`/admin/products/${productId}`);

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Unable to save the product specifications. Please try again.",
        };
    }
}