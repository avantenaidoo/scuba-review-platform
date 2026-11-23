"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateCategory } from "../schemas/category";
import {
    createCategory,
    updateCategory,
    setCategoryActive,
} from "../services/category-service";

type ActionResult =
    | { success: true }
    | { success: false; error: string };

async function getAdminClient() {
    const supabase = await createClient();

    const { data, error: claimsError } =
        await supabase.auth.getClaims();

    const userId = data?.claims?.sub;

    if (claimsError || !userId) {
        return {
            supabase: null,
            error: "You must be signed in.",
        };
    }

    const { data: role, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

    if (roleError || role?.role !== "admin") {
        return {
            supabase: null,
            error: "Administrator access required.",
        };
    }

    return { supabase, error: null };
}

function getCategoryInput(formData: FormData) {
    return validateCategory(
        formData.get("name"),
        formData.get("description"),
        formData.get("parentId")
    );
}

function refreshCategoryPages() {
    revalidatePath("/admin/categories");
    revalidatePath("/admin");
}

export async function createCategoryAction(
    formData: FormData
): Promise<ActionResult> {
    const { supabase, error } = await getAdminClient();

    if (!supabase) {
        return { success: false, error: error! };
    }

    const validation = getCategoryInput(formData);

    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    try {
        await createCategory(supabase, validation.data);
        refreshCategoryPages();

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Unable to create category. Please check the category details and try again.",
        };
    }
}

export async function updateCategoryAction(
    id: string,
    formData: FormData
): Promise<ActionResult> {
    const { supabase, error } = await getAdminClient();

    if (!supabase) {
        return { success: false, error: error! };
    }

    const validation = getCategoryInput(formData);

    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    try {
        await updateCategory(supabase, id, validation.data);
        refreshCategoryPages();

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Unable to update category. Please check the category details and try again.",
        };
    }
}

export async function setCategoryActiveAction(
    id: string,
    isActive: boolean
): Promise<ActionResult> {
    const { supabase, error } = await getAdminClient();

    if (!supabase) {
        return { success: false, error: error! };
    }

    try {
        await setCategoryActive(supabase, id, isActive);
        refreshCategoryPages();

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Unable to update category status. Please try again.",
        };
    }
}