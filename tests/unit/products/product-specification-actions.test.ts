import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    createProductSpecificationAction,
    updateProductSpecificationAction,
    deleteProductSpecificationAction,
} from "@/features/products/actions/product-specification-actions";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
    revalidatePath: vi.fn(),
    createProductSpecification: vi.fn(),
    updateProductSpecification: vi.fn(),
    deleteProductSpecification: vi.fn(),
    getClaims: vi.fn(),
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
}));

vi.mock("next/cache", () => ({
    revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: mocks.createClient,
}));

vi.mock("@/features/products/services/product-specification-service", () => ({
    createProductSpecification: mocks.createProductSpecification,
    updateProductSpecification: mocks.updateProductSpecification,
    deleteProductSpecification: mocks.deleteProductSpecification,
}));

const createdSpecification = {
    id: "specification-1",
    product_id: "product-1",
    name: "First-stage type",
    value: "Diaphragm",
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
};

function configureAdmin() {
    mocks.getClaims.mockResolvedValue({
        data: {
            claims: {
                sub: "admin-user",
            },
        },
        error: null,
    });

    mocks.maybeSingle.mockResolvedValue({
        data: { role: "admin" },
        error: null,
    });

    mocks.createClient.mockResolvedValue({
        auth: {
            getClaims: mocks.getClaims,
        },
        from: mocks.from,
    });
}

describe("Product specification actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.from.mockReturnValue({
            select: mocks.select,
        });

        mocks.select.mockReturnValue({
            eq: mocks.eq,
        });

        mocks.eq.mockReturnValue({
            maybeSingle: mocks.maybeSingle,
        });

        configureAdmin();
    });

    describe("createProductSpecificationAction", () => {
        it("creates a specification and returns its ID", async () => {
            mocks.createProductSpecification.mockResolvedValue(
                createdSpecification
            );

            const result = await createProductSpecificationAction(
                "product-1",
                {
                    name: " First-stage type ",
                    value: "Diaphragm",
                }
            );

            expect(result).toEqual({
                success: true,
                specificationId: "specification-1",
            });

            expect(mocks.createProductSpecification).toHaveBeenCalledWith(
                expect.anything(),
                "product-1",
                {
                    name: "First-stage type",
                    value: "Diaphragm",
                }
            );

            expect(mocks.revalidatePath).toHaveBeenCalledWith(
                "/admin/products"
            );

            expect(mocks.revalidatePath).toHaveBeenCalledWith(
                "/admin/products/product-1"
            );
        });

        it("rejects unauthenticated users", async () => {
            mocks.getClaims.mockResolvedValue({
                data: { claims: null },
                error: new Error("Unauthenticated"),
            });

            const result = await createProductSpecificationAction(
                "product-1",
                {
                    name: "First-stage type",
                    value: "Diaphragm",
                }
            );

            expect(result).toEqual({
                success: false,
                error: "You must be signed in.",
            });

            expect(mocks.createProductSpecification).not.toHaveBeenCalled();
        });

        it("rejects users who are not administrators", async () => {
            mocks.maybeSingle.mockResolvedValue({
                data: { role: "member" },
                error: null,
            });

            const result = await createProductSpecificationAction(
                "product-1",
                {
                    name: "First-stage type",
                    value: "Diaphragm",
                }
            );

            expect(result).toEqual({
                success: false,
                error: "Administrator access required.",
            });

            expect(mocks.createProductSpecification).not.toHaveBeenCalled();
        });

        it("rejects an empty specification name", async () => {
            const result = await createProductSpecificationAction(
                "product-1",
                {
                    name: "  ",
                    value: "Diaphragm",
                }
            );

            expect(result).toEqual({
                success: false,
                error: "Specification name is required.",
            });

            expect(mocks.createProductSpecification).not.toHaveBeenCalled();
        });

        it("rejects an invalid sort order", async () => {
            const result = await createProductSpecificationAction(
                "product-1",
                {
                    name: "First-stage type",
                    value: "Diaphragm",
                    sort_order: -1,
                }
            );

            expect(result).toEqual({
                success: false,
                error: "Specification order must be a non-negative integer.",
            });

            expect(mocks.createProductSpecification).not.toHaveBeenCalled();
        });

        it("returns an error when creation fails", async () => {
            mocks.createProductSpecification.mockRejectedValue(
                new Error("Database error")
            );

            const result = await createProductSpecificationAction(
                "product-1",
                {
                    name: "First-stage type",
                    value: "Diaphragm",
                }
            );

            expect(result).toEqual({
                success: false,
                error: "Unable to create the product specification. Check that its name is not already in use.",
            });
        });
    });

    describe("updateProductSpecificationAction", () => {
        it("updates a specification and revalidates product pages", async () => {
            mocks.updateProductSpecification.mockResolvedValue(
                createdSpecification
            );

            const result = await updateProductSpecificationAction(
                "product-1",
                "specification-1",
                {
                    name: "First stage",
                    value: "Balanced diaphragm",
                    sort_order: 1,
                }
            );

            expect(result).toEqual({ success: true });

            expect(mocks.updateProductSpecification).toHaveBeenCalledWith(
                expect.anything(),
                "product-1",
                "specification-1",
                {
                    name: "First stage",
                    value: "Balanced diaphragm",
                    sort_order: 1,
                }
            );

            expect(mocks.revalidatePath).toHaveBeenCalledWith(
                "/admin/products/product-1"
            );
        });

        it("returns an error when updating fails", async () => {
            mocks.updateProductSpecification.mockRejectedValue(
                new Error("Database error")
            );

            const result = await updateProductSpecificationAction(
                "product-1",
                "specification-1",
                {
                    name: "First stage",
                    value: "Balanced diaphragm",
                }
            );

            expect(result).toEqual({
                success: false,
                error: "Unable to update the product specification. Check that its name is not already in use.",
            });
        });
    });

    describe("deleteProductSpecificationAction", () => {
        it("deletes a specification and revalidates product pages", async () => {
            mocks.deleteProductSpecification.mockResolvedValue(undefined);

            const result = await deleteProductSpecificationAction(
                "product-1",
                "specification-1"
            );

            expect(result).toEqual({ success: true });

            expect(mocks.deleteProductSpecification).toHaveBeenCalledWith(
                expect.anything(),
                "product-1",
                "specification-1"
            );

            expect(mocks.revalidatePath).toHaveBeenCalledWith(
                "/admin/products/product-1"
            );
        });

        it("returns an error when deletion fails", async () => {
            mocks.deleteProductSpecification.mockRejectedValue(
                new Error("Database error")
            );

            const result = await deleteProductSpecificationAction(
                "product-1",
                "specification-1"
            );

            expect(result).toEqual({
                success: false,
                error: "Unable to delete the product specification. Please try again.",
            });
        });
    });
});