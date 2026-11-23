"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ProductImageType = "main" | "gallery";

type ProductImageActionResult =
    | {
        success: true;
        imageId: string;
        previousImagePath: string | null;
    }
    | {
        success: false;
        error: string;
    };

type RemoveProductImageActionResult =
    | {
        success: true;
        previousImagePath: string;
    }
    | {
        success: false;
        error: string;
    };

const MAX_PRODUCT_IMAGE_SIZE = 15 * 1024 * 1024;

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

function refreshProductPages(productId: string) {
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/admin");
}

export async function saveProductImageAction(
    productId: string,
    storagePath: string,
    altText: string,
    sizeBytes: number,
    imageType: ProductImageType,
    width: number,
    height: number
): Promise<ProductImageActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    const cleanAltText = altText.trim();

    if (!cleanAltText || cleanAltText.length > 125) {
        return {
            success: false,
            error: "Image alt text must be between 1 and 125 characters.",
        };
    }

    if (
        !Number.isInteger(sizeBytes) ||
        sizeBytes <= 0 ||
        sizeBytes > MAX_PRODUCT_IMAGE_SIZE
    ) {
        return {
            success: false,
            error: "The processed image must not exceed 15 MiB.",
        };
    }

    if (
        !Number.isInteger(width) ||
        width <= 0 ||
        !Number.isInteger(height) ||
        height <= 0
    ) {
        return {
            success: false,
            error: "Invalid image dimensions.",
        };
    }

    if (imageType !== "main" && imageType !== "gallery") {
        return {
            success: false,
            error: "Invalid product image type.",
        };
    }

    if (
        !storagePath.startsWith(`${productId}/`) ||
        storagePath.includes("..") ||
        !storagePath.endsWith(".webp")
    ) {
        return {
            success: false,
            error: "Invalid product image storage path.",
        };
    }

    const fileName = storagePath.slice(productId.length + 1);

    if (!fileName || fileName.includes("/")) {
        return {
            success: false,
            error: "Invalid product image storage path.",
        };
    }

    const { data: product, error: productError } = await auth.supabase
        .from("products")
        .select("id")
        .eq("id", productId)
        .maybeSingle();

    if (productError || !product) {
        return {
            success: false,
            error: "Unable to find the product.",
        };
    }

    const { data: storedFiles, error: storageError } = await auth.supabase
        .storage
        .from("product-images")
        .list(productId, {
            search: fileName,
            limit: 1,
        });

    const storedFile = storedFiles?.find(
        (file) => file.name === fileName
    );

    if (storageError || !storedFile) {
        return {
            success: false,
            error: "The uploaded product image could not be verified.",
        };
    }

    const storedSize = Number(storedFile.metadata?.size);

    if (
        storedFile.metadata?.mimetype !== "image/webp" ||
        storedSize !== sizeBytes
    ) {
        return {
            success: false,
            error: "The uploaded image metadata does not match the stored file.",
        };
    }

    if (imageType === "main") {
        const { data: existingImage, error: lookupError } =
            await auth.supabase
                .from("product_images")
                .select("id, storage_path")
                .eq("product_id", productId)
                .eq("is_primary", true)
                .maybeSingle();

        if (lookupError) {
            return {
                success: false,
                error: "Unable to retrieve the existing main image.",
            };
        }

        if (existingImage) {
            const { data: updatedImage, error: updateError } =
                await auth.supabase
                    .from("product_images")
                    .update({
                        storage_path: storagePath,
                        alt_text: cleanAltText,
                        mime_type: "image/webp",
                        file_size_bytes: sizeBytes,
                        width,
                        height,
                        image_type: "main",
                        is_primary: true,
                        sort_order: 0,
                    })
                    .eq("id", existingImage.id)
                    .select("id")
                    .single();

            if (updateError || !updatedImage) {
                return {
                    success: false,
                    error: "Unable to update the main product image.",
                };
            }

            refreshProductPages(productId);

            return {
                success: true,
                imageId: updatedImage.id,
                previousImagePath: existingImage.storage_path,
            };
        }
    }

    let sortOrder = 0;

    if (imageType === "gallery") {
        const { data: lastImage, error: sortError } = await auth.supabase
            .from("product_images")
            .select("sort_order")
            .eq("product_id", productId)
            .eq("image_type", "gallery")
            .order("sort_order", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (sortError) {
            return {
                success: false,
                error: "Unable to retrieve the gallery image order.",
            };
        }

        sortOrder = (lastImage?.sort_order ?? -1) + 1;
    }

    const { data: newImage, error: insertError } = await auth.supabase
        .from("product_images")
        .insert({
            product_id: productId,
            storage_path: storagePath,
            alt_text: cleanAltText,
            mime_type: "image/webp",
            file_size_bytes: sizeBytes,
            width,
            height,
            image_type: imageType,
            is_primary: imageType === "main",
            sort_order: sortOrder,
        })
        .select("id")
        .single();

    if (insertError || !newImage) {
        return {
            success: false,
            error: "Unable to save the product image.",
        };
    }

    refreshProductPages(productId);

    return {
        success: true,
        imageId: newImage.id,
        previousImagePath: null,
    };
}

export async function removeProductImageAction(
    productId: string,
    imageId: string
): Promise<RemoveProductImageActionResult> {
    const auth = await getAdminClient();

    if (!auth.supabase) {
        return { success: false, error: auth.error };
    }

    const { data: existingImage, error: lookupError } = await auth.supabase
        .from("product_images")
        .select("id, storage_path")
        .eq("id", imageId)
        .eq("product_id", productId)
        .maybeSingle();

    if (lookupError || !existingImage) {
        return {
            success: false,
            error: "Unable to find the product image.",
        };
    }

    const { error: deleteError } = await auth.supabase
        .from("product_images")
        .delete()
        .eq("id", imageId)
        .eq("product_id", productId);

    if (deleteError) {
        return {
            success: false,
            error: "Unable to remove the product image.",
        };
    }

    refreshProductPages(productId);

    return {
        success: true,
        previousImagePath: existingImage.storage_path,
    };
}
