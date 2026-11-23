import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getProductImages } from "@/features/products/services/product-image-service";

const mocks = vi.hoisted(() => ({
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    storageFrom: vi.fn(),
    createSignedUrl: vi.fn(),
}));

function createSupabaseMock() {
    const query = {
        eq: mocks.eq,
        order: mocks.order,
    };

    mocks.select.mockReturnValue(query);
    mocks.eq.mockReturnValue(query);

    const supabase = {
        from: vi.fn(() => ({
            select: mocks.select,
        })),
        storage: {
            from: mocks.storageFrom,
        },
    };

    mocks.storageFrom.mockReturnValue({
        createSignedUrl: mocks.createSignedUrl,
    });

    return supabase as unknown as SupabaseClient<Database>;
}

const mainImage = {
    id: "image-1",
    product_id: "product-1",
    storage_path: "product-1/main.webp",
    alt_text: "Main product image",
    mime_type: "image/webp",
    file_size_bytes: 1024,
    width: 1200,
    height: 900,
    image_type: "main",
    is_primary: true,
    sort_order: 0,
    created_at: "2026-11-23T10:00:00.000Z",
    updated_at: "2026-11-23T10:00:00.000Z",
};

const galleryImage = {
    ...mainImage,
    id: "image-2",
    storage_path: "product-1/gallery.webp",
    alt_text: "Product detail image",
    image_type: "gallery",
    is_primary: false,
    sort_order: 1,
};

describe("getProductImages", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.order
            .mockReturnValueOnce({
                order: mocks.order,
            })
            .mockResolvedValueOnce({
                data: [mainImage, galleryImage],
                error: null,
            });

        mocks.createSignedUrl.mockImplementation(
            async (path: string) => ({
                data: {
                    signedUrl: `https://example.com/${path}`,
                },
                error: null,
            })
        );
    });

    it("retrieves product images and generates signed URLs", async () => {
        const supabase = createSupabaseMock();

        const result = await getProductImages(supabase, "product-1");

        expect(supabase.from).toHaveBeenCalledWith("product_images");
        expect(mocks.select).toHaveBeenCalledWith("*");
        expect(mocks.eq).toHaveBeenCalledWith("product_id", "product-1");

        expect(mocks.storageFrom).toHaveBeenCalledWith("product-images");

        expect(mocks.createSignedUrl).toHaveBeenCalledWith(
            "product-1/main.webp",
            3600
        );

        expect(mocks.createSignedUrl).toHaveBeenCalledWith(
            "product-1/gallery.webp",
            3600
        );

        expect(result).toEqual([
            {
                ...mainImage,
                url: "https://example.com/product-1/main.webp",
            },
            {
                ...galleryImage,
                url: "https://example.com/product-1/gallery.webp",
            },
        ]);
    });

    it("returns an empty array when the product has no images", async () => {
        mocks.order
            .mockReset()
            .mockReturnValueOnce({
                order: mocks.order,
            })
            .mockResolvedValueOnce({
                data: [],
                error: null,
            });

        const supabase = createSupabaseMock();

        const result = await getProductImages(supabase, "product-1");

        expect(result).toEqual([]);
        expect(mocks.createSignedUrl).not.toHaveBeenCalled();
    });

    it("throws when retrieving product images fails", async () => {
        mocks.order
            .mockReset()
            .mockReturnValueOnce({
                order: mocks.order,
            })
            .mockResolvedValueOnce({
                data: null,
                error: new Error("Database error"),
            });

        const supabase = createSupabaseMock();

        await expect(
            getProductImages(supabase, "product-1")
        ).rejects.toThrow("Unable to retrieve product images.");

        expect(mocks.createSignedUrl).not.toHaveBeenCalled();
    });

    it("throws when generating a signed image URL fails", async () => {
        const supabase = createSupabaseMock();

        mocks.createSignedUrl.mockResolvedValue({
            data: null,
            error: new Error("Storage error"),
        });

        await expect(
            getProductImages(supabase, "product-1")
        ).rejects.toThrow("Unable to retrieve product image URLs.");
    });
});
