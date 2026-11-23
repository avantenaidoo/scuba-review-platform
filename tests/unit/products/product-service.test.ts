import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    createProduct,
    getProductById,
    getProducts,
    setProductActive,
    setProductPublished,
    updateProduct,
    type ProductRecord,
} from "@/features/products/services/product-service";
import type { ProductInput } from "@/features/products/schemas/product";

const product: ProductRecord = {
    id: "product-1",
    name: "MK25 EVO Regulator",
    slug: "mk25-evo-regulator",
    brand_id: "brand-1",
    category_id: "category-1",
    subcategory_id: "subcategory-1",
    model_number: "MK25 EVO",
    description: "High-performance first-stage regulator.",
    is_active: true,
    is_published: false,
    published_at: null,
    created_at: "2026-11-23T00:00:00Z",
    updated_at: "2026-11-23T00:00:00Z",
};

const input: ProductInput = {
    name: "MK25 EVO Regulator",
    slug: "mk25-evo-regulator",
    brand_id: "brand-1",
    category_id: "category-1",
    subcategory_id: "subcategory-1",
    model_number: "MK25 EVO",
    description: "High-performance first-stage regulator.",
};

function createSupabaseMock(result: {
    data: unknown;
    error: unknown;
}) {
    const query: Record<string, ReturnType<typeof vi.fn>> = {};

    for (const method of [
        "select",
        "insert",
        "update",
        "eq",
        "order",
    ]) {
        query[method] = vi.fn(() => query);
    }

    query.single = vi.fn().mockResolvedValue(result);
    query.maybeSingle = vi.fn().mockResolvedValue(result);
    query.order = vi.fn().mockResolvedValue(result);

    const supabase = {
        from: vi.fn(() => query),
    };

    return { supabase, query };
}

describe("product-service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("retrieves products ordered by name", async () => {
        const { supabase, query } = createSupabaseMock({
            data: [product],
            error: null,
        });

        const result = await getProducts(supabase as never);

        expect(result).toEqual([product]);
        expect(supabase.from).toHaveBeenCalledWith("products");
        expect(query.order).toHaveBeenCalledWith("name", {
            ascending: true,
        });
    });

    it("retrieves a product by ID", async () => {
        const { supabase, query } = createSupabaseMock({
            data: product,
            error: null,
        });

        const result = await getProductById(
            supabase as never,
            "product-1"
        );

        expect(result).toEqual(product);
        expect(supabase.from).toHaveBeenCalledWith("products");
        expect(query.eq).toHaveBeenCalledWith("id", "product-1");
    });

    it("creates a product", async () => {
        const { supabase, query } = createSupabaseMock({
            data: product,
            error: null,
        });

        const result = await createProduct(supabase as never, input);

        expect(result).toEqual(product);
        expect(query.insert).toHaveBeenCalledWith(input);
    });

    it("updates a product", async () => {
        const { supabase, query } = createSupabaseMock({
            data: product,
            error: null,
        });

        const result = await updateProduct(
            supabase as never,
            "product-1",
            input
        );

        expect(result).toEqual(product);
        expect(query.update).toHaveBeenCalledWith(input);
        expect(query.eq).toHaveBeenCalledWith("id", "product-1");
    });

    it("changes a product's active status", async () => {
        const inactiveProduct = { ...product, is_active: false };
        const { supabase, query } = createSupabaseMock({
            data: inactiveProduct,
            error: null,
        });

        const result = await setProductActive(
            supabase as never,
            "product-1",
            false
        );

        expect(result).toEqual(inactiveProduct);
        expect(query.update).toHaveBeenCalledWith({
            is_active: false,
        });
        expect(query.eq).toHaveBeenCalledWith("id", "product-1");
    });

    it("throws a safe error when retrieval fails", async () => {
        const { supabase } = createSupabaseMock({
            data: null,
            error: new Error("Database details"),
        });

        await expect(getProducts(supabase as never)).rejects.toThrow(
            "Unable to retrieve products."
        );
    });

    it("throws a safe error when product creation fails", async () => {
        const { supabase } = createSupabaseMock({
            data: null,
            error: new Error("Database details"),
        });

        await expect(
            createProduct(supabase as never, input)
        ).rejects.toThrow("Unable to create product.");
    });

    it("publishes a product and records the publication date", async () => {
        const publishedProduct = {
            ...product,
            is_published: true,
            published_at: "2026-11-23T13:00:00.000Z",
        };

        const { supabase, query } = createSupabaseMock({
            data: publishedProduct,
            error: null,
        });

        const result = await setProductPublished(
            supabase as never,
            "product-1",
            true
        );

        expect(result).toEqual(publishedProduct);
        expect(query.update).toHaveBeenCalledWith(
            expect.objectContaining({
                is_published: true,
                published_at: expect.any(String),
            })
        );
        expect(query.eq).toHaveBeenCalledWith("id", "product-1");
    });

    it("unpublishes a product and clears the publication date", async () => {
        const unpublishedProduct = {
            ...product,
            is_published: false,
            published_at: null,
        };

        const { supabase, query } = createSupabaseMock({
            data: unpublishedProduct,
            error: null,
        });

        const result = await setProductPublished(
            supabase as never,
            "product-1",
            false
        );

        expect(result).toEqual(unpublishedProduct);
        expect(query.update).toHaveBeenCalledWith({
            is_published: false,
            published_at: null,
        });
        expect(query.eq).toHaveBeenCalledWith("id", "product-1");
    });

    it("throws a safe error when publication status update fails", async () => {
        const { supabase } = createSupabaseMock({
            data: null,
            error: new Error("Database details"),
        });

        await expect(
            setProductPublished(supabase as never, "product-1", true)
        ).rejects.toThrow(
            "Unable to update product publication status."
        );
    });
});