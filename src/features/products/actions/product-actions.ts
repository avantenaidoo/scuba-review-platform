"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateProduct } from "../schemas/product";
import {
    createProduct,
    updateProduct,
    setProductActive,
    setProductPublished,
} from "../services/product-service";

type ProductActionResult =
    | { success: true; productId?: string }
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

function getProductInput(formData: FormData) {
    return validateProduct(
        formData.get("name"),
        formData.get("brand_id"),
        formData.get("category_id"),
        formData.get("subcategory_id"),
        formData.get("model_number"),
        formData.get("description")
    );
}

function refreshProductPages(id?: string) {
    revalidatePath("/admin/products");
    revalidatePath("/admin");

    if (id) {
        revalidatePath(`/admin/products/${id}`);
    }
}

export async function createProductAction(
    formData: FormData
): Promise<ProductActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    const validation = getProductInput(formData);

    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    try {
        const product = await createProduct(
            auth.supabase,
            validation.data
        );

        refreshProductPages();

        return {
            success: true,
            productId: product.id,
        };
    } catch {
        return {
            success: false,
            error: "Unable to create the product. Check that its name is not already in use.",
        };
    }
}

export async function updateProductAction(
    id: string,
    formData: FormData
): Promise<ProductActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    const validation = getProductInput(formData);

    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    try {
        const product = await updateProduct(
            auth.supabase,
            id,
            validation.data
        );

        refreshProductPages(id);

        return {
            success: true,
            productId: product.id,
        };
    } catch {
        return {
            success: false,
            error: "Unable to update the product. Please try again.",
        };
    }
}

export async function setProductActiveAction(
    id: string,
    isActive: boolean
): Promise<ProductActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    try {
        await setProductActive(auth.supabase, id, isActive);
        refreshProductPages(id);

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Unable to update the product status. Please try again.",
        };
    }
}

export async function setProductPublishedAction(
    id: string,
    isPublished: boolean
): Promise<ProductActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    try {
        await setProductPublished(
            auth.supabase,
            id,
            isPublished
        );

        refreshProductPages(id);

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Unable to update the product publication status. Please try again.",
        };
    }
}