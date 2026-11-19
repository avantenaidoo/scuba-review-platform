"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateBrand } from "../schemas/brand";
import {
    createBrand,
    updateBrand,
    setBrandActive,
} from "../services/brand-service";

type BrandActionResult =
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

function getBrandInput(formData: FormData) {
    return validateBrand(
        formData.get("name"),
        formData.get("description")
    );
}

function refreshBrandPages() {
    revalidatePath("/admin/brands");
    revalidatePath("/admin");
}

export async function createBrandAction(
    formData: FormData
): Promise<BrandActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    const validation = getBrandInput(formData);

    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    try {
        await createBrand(auth.supabase, validation.data);
        refreshBrandPages();

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Unable to create the brand. Check that its name is not already in use.",
        };
    }
}

export async function updateBrandAction(
    id: string,
    formData: FormData
): Promise<BrandActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    const validation = getBrandInput(formData);

    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    try {
        await updateBrand(auth.supabase, id, validation.data);
        refreshBrandPages();

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Unable to update the brand. Please try again.",
        };
    }
}

export async function setBrandActiveAction(
    id: string,
    isActive: boolean
): Promise<BrandActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    try {
        await setBrandActive(auth.supabase, id, isActive);
        refreshBrandPages();

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Unable to update the brand status. Please try again.",
        };
    }
}
