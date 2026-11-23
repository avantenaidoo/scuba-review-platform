import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

import {
    getProductSpecifications,
    createProductSpecification,
    updateProductSpecification,
    deleteProductSpecification,
} from "@/features/products/services/product-specification-service";

type ProductSpecificationClient = SupabaseClient<Database>;

const specification = {
    id: "specification-1",
    product_id: "product-1",
    name: "First-stage type",
    value: "Diaphragm",
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
};

function createSupabaseMock() {
    const query = {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        single: vi.fn(),
    };

    const from = vi.fn(() => query);

    query.select.mockReturnValue(query);
    query.insert.mockReturnValue(query);
    query.update.mockReturnValue(query);
    query.delete.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);

    return {
        supabase: {
            from,
        } as unknown as ProductSpecificationClient,
        from,
        query,
    };
}

describe("Product specification service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getProductSpecifications", () => {
        it("retrieves specifications ordered by sort order and name", async () => {
            const { supabase, from, query } = createSupabaseMock();

            query.order
                .mockReturnValueOnce(query)
                .mockResolvedValueOnce({
                    data: [specification],
                    error: null,
                });

            const result = await getProductSpecifications(
                supabase,
                "product-1"
            );

            expect(result).toEqual([specification]);

            expect(from).toHaveBeenCalledWith(
                "product_specifications"
            );

            expect(query.select).toHaveBeenCalledWith("*");

            expect(query.eq).toHaveBeenCalledWith(
                "product_id",
                "product-1"
            );

            expect(query.order).toHaveBeenNthCalledWith(
                1,
                "sort_order",
                { ascending: true }
            );

            expect(query.order).toHaveBeenNthCalledWith(
                2,
                "name",
                { ascending: true }
            );
        });

        it("returns an empty array when no specifications exist", async () => {
            const { supabase, query } = createSupabaseMock();

            query.order
                .mockReturnValueOnce(query)
                .mockResolvedValueOnce({
                    data: null,
                    error: null,
                });

            const result = await getProductSpecifications(
                supabase,
                "product-1"
            );

            expect(result).toEqual([]);
        });

        it("throws an error when retrieval fails", async () => {
            const { supabase, query } = createSupabaseMock();

            query.order
                .mockReturnValueOnce(query)
                .mockResolvedValueOnce({
                    data: null,
                    error: new Error("Database error"),
                });

            await expect(
                getProductSpecifications(supabase, "product-1")
            ).rejects.toThrow(
                "Unable to retrieve product specifications."
            );
        });
    });

    describe("createProductSpecification", () => {
        it("creates a specification with its product ID", async () => {
            const { supabase, from, query } = createSupabaseMock();

            query.single.mockResolvedValue({
                data: specification,
                error: null,
            });

            const result = await createProductSpecification(
                supabase,
                "product-1",
                {
                    name: "First-stage type",
                    value: "Diaphragm",
                }
            );

            expect(result).toEqual(specification);

            expect(from).toHaveBeenCalledWith(
                "product_specifications"
            );

            expect(query.insert).toHaveBeenCalledWith({
                product_id: "product-1",
                name: "First-stage type",
                value: "Diaphragm",
                sort_order: 0,
            });

            expect(query.select).toHaveBeenCalledWith("*");
            expect(query.single).toHaveBeenCalledTimes(1);
        });

        it("preserves a supplied sort order", async () => {
            const { supabase, query } = createSupabaseMock();

            query.single.mockResolvedValue({
                data: {
                    ...specification,
                    sort_order: 3,
                },
                error: null,
            });

            await createProductSpecification(
                supabase,
                "product-1",
                {
                    name: "Number of ports",
                    value: 4,
                    sort_order: 3,
                }
            );

            expect(query.insert).toHaveBeenCalledWith({
                product_id: "product-1",
                name: "Number of ports",
                value: 4,
                sort_order: 3,
            });
        });

        it("throws an error when creation fails", async () => {
            const { supabase, query } = createSupabaseMock();

            query.single.mockResolvedValue({
                data: null,
                error: new Error("Database error"),
            });

            await expect(
                createProductSpecification(
                    supabase,
                    "product-1",
                    {
                        name: "First-stage type",
                        value: "Diaphragm",
                    }
                )
            ).rejects.toThrow(
                "Unable to create product specification."
            );
        });
    });

    describe("updateProductSpecification", () => {
        it("updates a specification belonging to the supplied product", async () => {
            const { supabase, query } = createSupabaseMock();

            query.single.mockResolvedValue({
                data: {
                    ...specification,
                    name: "First stage",
                    value: "Balanced diaphragm",
                },
                error: null,
            });

            const result = await updateProductSpecification(
                supabase,
                "product-1",
                "specification-1",
                {
                    name: "First stage",
                    value: "Balanced diaphragm",
                    sort_order: 1,
                }
            );

            expect(result.name).toBe("First stage");
            expect(result.value).toBe("Balanced diaphragm");

            expect(query.update).toHaveBeenCalledWith({
                name: "First stage",
                value: "Balanced diaphragm",
                sort_order: 1,
            });

            expect(query.eq).toHaveBeenNthCalledWith(
                1,
                "product_id",
                "product-1"
            );

            expect(query.eq).toHaveBeenNthCalledWith(
                2,
                "id",
                "specification-1"
            );
        });

        it("throws an error when updating fails", async () => {
            const { supabase, query } = createSupabaseMock();

            query.single.mockResolvedValue({
                data: null,
                error: new Error("Database error"),
            });

            await expect(
                updateProductSpecification(
                    supabase,
                    "product-1",
                    "specification-1",
                    {
                        name: "First stage",
                        value: "Balanced diaphragm",
                    }
                )
            ).rejects.toThrow(
                "Unable to update product specification."
            );
        });
    });

    describe("deleteProductSpecification", () => {
        it("deletes a specification belonging to the supplied product", async () => {
            const { supabase, query } = createSupabaseMock();

            query.eq
                .mockReturnValueOnce(query)
                .mockResolvedValueOnce({
                    error: null,
                });

            await expect(
                deleteProductSpecification(
                    supabase,
                    "product-1",
                    "specification-1"
                )
            ).resolves.toBeUndefined();

            expect(query.delete).toHaveBeenCalledTimes(1);

            expect(query.eq).toHaveBeenNthCalledWith(
                1,
                "product_id",
                "product-1"
            );

            expect(query.eq).toHaveBeenNthCalledWith(
                2,
                "id",
                "specification-1"
            );
        });

        it("throws an error when deletion fails", async () => {
            const { supabase, query } = createSupabaseMock();

            query.eq
                .mockReturnValueOnce(query)
                .mockResolvedValueOnce({
                    error: new Error("Database error"),
                });

            await expect(
                deleteProductSpecification(
                    supabase,
                    "product-1",
                    "specification-1"
                )
            ).rejects.toThrow(
                "Unable to delete product specification."
            );
        });
    });
});