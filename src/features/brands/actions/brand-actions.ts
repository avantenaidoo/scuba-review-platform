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

type BrandLogoActionResult =
    | {
        success: true;
        previousLogoPath: string | null;
    }
    | {
        success: false;
        error: string;
    };

const MAX_BRAND_LOGO_SIZE = 5 * 1024 * 1024;

export async function saveBrandLogoAction(
    id: string,
    logoPath: string,
    altText: string,
    sizeBytes: number
): Promise<BrandLogoActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    const cleanAltText = altText.trim();

    if (!cleanAltText || cleanAltText.length > 125) {
        return {
            success: false,
            error: "Logo alt text must be between 1 and 125 characters.",
        };
    }

    if (
        !Number.isInteger(sizeBytes) ||
        sizeBytes <= 0 ||
        sizeBytes > MAX_BRAND_LOGO_SIZE
    ) {
        return {
            success: false,
            error: "The processed logo must not exceed 5 MiB.",
        };
    }

    if (
        !logoPath.startsWith(`${id}/`) ||
        logoPath.includes("..") ||
        !logoPath.endsWith(".webp")
    ) {
        return {
            success: false,
            error: "Invalid logo storage path.",
        };
    }

    const fileName = logoPath.slice(id.length + 1);

    if (!fileName || fileName.includes("/")) {
        return {
            success: false,
            error: "Invalid logo storage path.",
        };
    }

    const { data: storedFiles, error: storageError } = await auth.supabase
        .storage
        .from("brand-logos")
        .list(id, {
            search: fileName,
            limit: 1,
        });

    const storedFile = storedFiles?.find(
        (file) => file.name === fileName
    );

    if (storageError || !storedFile) {
        return {
            success: false,
            error: "The uploaded logo could not be verified.",
        };
    }

    const storedSize = Number(storedFile.metadata?.size);

    if (
        storedFile.metadata?.mimetype !== "image/webp" ||
        storedSize !== sizeBytes
    ) {
        return {
            success: false,
            error: "The uploaded logo metadata does not match the stored file.",
        };
    }

    const { data: existingBrand, error: lookupError } = await auth.supabase
        .from("brands")
        .select("logo_path")
        .eq("id", id)
        .maybeSingle();

    if (lookupError || !existingBrand) {
        return {
            success: false,
            error: "Unable to find the brand.",
        };
    }

    const { error } = await auth.supabase
        .from("brands")
        .update({
            logo_path: logoPath,
            logo_alt_text: cleanAltText,
            logo_mime_type: "image/webp",
            logo_size_bytes: sizeBytes,
        })
        .eq("id", id);

    if (error) {
        return {
            success: false,
            error: "Unable to save the brand logo.",
        };
    }

    revalidatePath("/admin/brands");
    revalidatePath(`/admin/brands/${id}`);
    revalidatePath("/admin");

    return {
        success: true,
        previousLogoPath: existingBrand.logo_path,
    };
}

export async function clearBrandLogoAction(
    id: string
): Promise<BrandLogoActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    const { data: existingBrand, error: lookupError } = await auth.supabase
        .from("brands")
        .select("logo_path")
        .eq("id", id)
        .maybeSingle();

    if (lookupError || !existingBrand) {
        return {
            success: false,
            error: "Unable to find the brand.",
        };
    }

    const { error } = await auth.supabase
        .from("brands")
        .update({
            logo_path: null,
            logo_alt_text: null,
            logo_mime_type: null,
            logo_size_bytes: null,
        })
        .eq("id", id);

    if (error) {
        return {
            success: false,
            error: "Unable to remove the brand logo.",
        };
    }

    revalidatePath("/admin/brands");
    revalidatePath(`/admin/brands/${id}`);
    revalidatePath("/admin");

    return {
        success: true,
        previousLogoPath: existingBrand.logo_path,
    };
}