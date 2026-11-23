import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type ProductImage =
    Database["public"]["Tables"]["product_images"]["Row"];

export type ProductImageWithUrl = ProductImage & {
    url: string;
};

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

export async function getProductImages(
    supabase: SupabaseClient<Database>,
    productId: string
): Promise<ProductImageWithUrl[]> {
    const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true });

    if (error) {
        throw new Error("Unable to retrieve product images.");
    }

    const images = data ?? [];

    return Promise.all(
        images.map(async (productImage) => {
            const { data: signedUrlData, error: signedUrlError } =
                await supabase.storage
                    .from("product-images")
                    .createSignedUrl(
                        productImage.storage_path,
                        SIGNED_URL_EXPIRY_SECONDS
                    );

            if (signedUrlError || !signedUrlData?.signedUrl) {
                throw new Error("Unable to retrieve product image URLs.");
            }

            return {
                ...productImage,
                url: signedUrlData.signedUrl,
            };
        })
    );
}
