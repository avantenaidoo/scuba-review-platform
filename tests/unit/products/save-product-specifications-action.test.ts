import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    saveProductSpecificationsAction,
} from "@/features/products/actions/save-product-specifications-action";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
    revalidatePath: vi.fn(),
    getProductSpecifications: vi.fn(),
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
    getProductSpecifications: mocks.getProductSpecifications,
    createProductSpecification: mocks.createProductSpecification,
    updateProductSpecification: mocks.updateProductSpecification,
    deleteProductSpecification: mocks.deleteProductSpecification,
}));

const existingSpecification = {
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

describe("saveProductSpecificationsAction", () => {
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

        mocks.getProductSpecifications.mockResolvedValue([]);
        mocks.createProductSpecification.mockResolvedValue({});
        mocks.updateProductSpecification.mockResolvedValue({});
        mocks.deleteProductSpecification.mockResolvedValue(undefined);

        configureAdmin();
    });

    it("creates new specifications", async () => {
        const result = await saveProductSpecificationsAction(
            "product-1",
            [
                {
                    name: "First-stage type",
                    value: "Diaphragm",
                    sort_order: 0,
                },
                {
                    name: "Number of ports",
                    value: "4",
                    sort_order: 1,
                },
            ]
        );

        expect(result).toEqual({ success: true });

        expect(mocks.createProductSpecification).toHaveBeenNthCalledWith(
            1,
            expect.anything(),
            "product-1",
            {
                name: "First-stage type",
                value: "Diaphragm",
                sort_order: 0,
            }
        );

        expect(mocks.createProductSpecification).toHaveBeenNthCalledWith(
            2,
            expect.anything(),
            "product-1",
            {
                name: "Number of ports",
                value: "4",
                sort_order: 1,
            }
        );
    });

    it("updates existing specifications without recreating them", async () => {
        mocks.getProductSpecifications.mockResolvedValue([
            existingSpecification,
        ]);

        const result = await saveProductSpecificationsAction(
            "product-1",
            [
                {
                    id: "specification-1",
                    name: "First stage",
                    value: "Balanced diaphragm",
                    sort_order: 0,
                },
            ]
        );

        expect(result).toEqual({ success: true });

        expect(mocks.updateProductSpecification).toHaveBeenCalledWith(
            expect.anything(),
            "product-1",
            "specification-1",
            {
                name: "First stage",
                value: "Balanced diaphragm",
                sort_order: 0,
            }
        );

        expect(mocks.createProductSpecification).not.toHaveBeenCalled();
        expect(mocks.deleteProductSpecification).not.toHaveBeenCalled();
    });

    it("deletes specifications removed from the submitted list", async () => {
        mocks.getProductSpecifications.mockResolvedValue([
            existingSpecification,
        ]);

        const result = await saveProductSpecificationsAction(
            "product-1",
            []
        );

        expect(result).toEqual({ success: true });

        expect(mocks.deleteProductSpecification).toHaveBeenCalledWith(
            expect.anything(),
            "product-1",
            "specification-1"
        );
    });

    it("rejects unauthenticated users", async () => {
        mocks.getClaims.mockResolvedValue({
            data: { claims: null },
            error: new Error("Unauthenticated"),
        });

        const result = await saveProductSpecificationsAction(
            "product-1",
            []
        );

        expect(result).toEqual({
            success: false,
            error: "You must be signed in.",
        });

        expect(mocks.getProductSpecifications).not.toHaveBeenCalled();
    });

    it("rejects users who are not administrators", async () => {
        mocks.maybeSingle.mockResolvedValue({
            data: { role: "member" },
            error: null,
        });

        const result = await saveProductSpecificationsAction(
            "product-1",
            []
        );

        expect(result).toEqual({
            success: false,
            error: "Administrator access required.",
        });
    });

    it("rejects specifications without names", async () => {
        const result = await saveProductSpecificationsAction(
            "product-1",
            [
                {
                    name: " ",
                    value: "Diaphragm",
                    sort_order: 0,
                },
            ]
        );

        expect(result).toEqual({
            success: false,
            error: "Every specification must have a name.",
        });

        expect(mocks.getProductSpecifications).not.toHaveBeenCalled();
    });

    it("rejects duplicate specification names", async () => {
        const result = await saveProductSpecificationsAction(
            "product-1",
            [
                {
                    name: "Material",
                    value: "Titanium",
                    sort_order: 0,
                },
                {
                    name: " material ",
                    value: "Stainless steel",
                    sort_order: 1,
                },
            ]
        );

        expect(result).toEqual({
            success: false,
            error: "Specification names must be unique.",
        });
    });

    it("rejects specification IDs that do not belong to the product", async () => {
        mocks.getProductSpecifications.mockResolvedValue([
            existingSpecification,
        ]);

        const result = await saveProductSpecificationsAction(
            "product-1",
            [
                {
                    id: "another-products-specification",
                    name: "First-stage type",
                    value: "Diaphragm",
                    sort_order: 0,
                },
            ]
        );

        expect(result).toEqual({
            success: false,
            error: "A submitted specification does not belong to this product.",
        });

        expect(mocks.updateProductSpecification).not.toHaveBeenCalled();
        expect(mocks.deleteProductSpecification).not.toHaveBeenCalled();
    });

    it("rejects duplicate submitted specification IDs", async () => {
        mocks.getProductSpecifications.mockResolvedValue([
            existingSpecification,
        ]);

        const result = await saveProductSpecificationsAction(
            "product-1",
            [
                {
                    id: "specification-1",
                    name: "First-stage type",
                    value: "Diaphragm",
                    sort_order: 0,
                },
                {
                    id: "specification-1",
                    name: "Second-stage type",
                    value: "Downstream",
                    sort_order: 1,
                },
            ]
        );

        expect(result).toEqual({
            success: false,
            error: "A submitted specification does not belong to this product.",
        });

        expect(mocks.updateProductSpecification).not.toHaveBeenCalled();
    });

    it("revalidates the product pages after saving", async () => {
        const result = await saveProductSpecificationsAction(
            "product-1",
            []
        );

        expect(result).toEqual({ success: true });

        expect(mocks.revalidatePath).toHaveBeenCalledWith(
            "/admin/products"
        );

        expect(mocks.revalidatePath).toHaveBeenCalledWith(
            "/admin/products/product-1"
        );
    });

    it("returns an error when saving fails", async () => {
        mocks.createProductSpecification.mockRejectedValue(
            new Error("Database error")
        );

        const result = await saveProductSpecificationsAction(
            "product-1",
            [
                {
                    name: "First-stage type",
                    value: "Diaphragm",
                    sort_order: 0,
                },
            ]
        );

        expect(result).toEqual({
            success: false,
            error: "Unable to save the product specifications. Please try again.",
        });
    });
});