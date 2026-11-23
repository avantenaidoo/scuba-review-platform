import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
    getClaims: vi.fn(),
    maybeSingle: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    setProductActive: vi.fn(),
    setProductPublished: vi.fn(),
    revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
    revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: mocks.createClient,
}));

vi.mock("@/features/products/services/product-service", () => ({
    createProduct: mocks.createProduct,
    updateProduct: mocks.updateProduct,
    setProductActive: mocks.setProductActive,
    setProductPublished: mocks.setProductPublished,
}));

import {
    createProductAction,
    updateProductAction,
    setProductActiveAction,
    setProductPublishedAction,
} from "@/features/products/actions/product-actions";

const productRecord = {
    id: "product-1",
    name: "Legend Regulator",
};

function createFormData() {
    const formData = new FormData();

    formData.set("name", "Legend Regulator");
    formData.set("brand_id", "brand-1");
    formData.set("category_id", "category-1");
    formData.set("subcategory_id", "subcategory-1");
    formData.set("model_number", "LEGEND-001");
    formData.set("description", "A scuba regulator.");

    return formData;
}

describe("Product actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.getClaims.mockResolvedValue({
            data: {
                claims: {
                    sub: "admin-user-1",
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
            from: () => ({
                select: () => ({
                    eq: () => ({
                        maybeSingle: mocks.maybeSingle,
                    }),
                }),
            }),
        });
    });

    describe("createProductAction", () => {
        it("creates a product and returns its ID", async () => {
            mocks.createProduct.mockResolvedValue(productRecord);

            const result = await createProductAction(createFormData());

            expect(result).toEqual({
                success: true,
                productId: "product-1",
            });

            expect(mocks.createProduct).toHaveBeenCalledTimes(1);
            expect(mocks.revalidatePath).toHaveBeenCalledWith(
                "/admin/products"
            );
            expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
        });

        it("rejects unauthenticated users", async () => {
            mocks.getClaims.mockResolvedValue({
                data: { claims: null },
                error: new Error("Unauthenticated"),
            });

            const result = await createProductAction(createFormData());

            expect(result).toEqual({
                success: false,
                error: "You must be signed in.",
            });

            expect(mocks.createProduct).not.toHaveBeenCalled();
        });

        it("rejects users without administrator access", async () => {
            mocks.maybeSingle.mockResolvedValue({
                data: { role: "member" },
                error: null,
            });

            const result = await createProductAction(createFormData());

            expect(result).toEqual({
                success: false,
                error: "Administrator access required.",
            });

            expect(mocks.createProduct).not.toHaveBeenCalled();
        });

        it("rejects invalid product input", async () => {
            const formData = createFormData();
            formData.set("name", "");

            const result = await createProductAction(formData);

            expect(result).toEqual({
                success: false,
                error: "Product name is required.",
            });

            expect(mocks.createProduct).not.toHaveBeenCalled();
        });

        it("returns an error when product creation fails", async () => {
            mocks.createProduct.mockRejectedValue(
                new Error("Database error")
            );

            const result = await createProductAction(createFormData());

            expect(result).toEqual({
                success: false,
                error: "Unable to create the product. Check that its name is not already in use.",
            });
        });
    });

    describe("updateProductAction", () => {
        it("updates a product and returns its ID", async () => {
            mocks.updateProduct.mockResolvedValue(productRecord);

            const result = await updateProductAction(
                "product-1",
                createFormData()
            );

            expect(result).toEqual({
                success: true,
                productId: "product-1",
            });

            expect(mocks.updateProduct).toHaveBeenCalledTimes(1);
            expect(mocks.updateProduct).toHaveBeenCalledWith(
                expect.anything(),
                "product-1",
                expect.objectContaining({
                    name: "Legend Regulator",
                    brand_id: "brand-1",
                    category_id: "category-1",
                })
            );

            expect(mocks.revalidatePath).toHaveBeenCalledWith(
                "/admin/products/product-1"
            );
        });

        it("returns an error when product updating fails", async () => {
            mocks.updateProduct.mockRejectedValue(
                new Error("Database error")
            );

            const result = await updateProductAction(
                "product-1",
                createFormData()
            );

            expect(result).toEqual({
                success: false,
                error: "Unable to update the product. Please try again.",
            });
        });
    });

    describe("setProductActiveAction", () => {
        it("updates the active status", async () => {
            mocks.setProductActive.mockResolvedValue(productRecord);

            const result = await setProductActiveAction(
                "product-1",
                false
            );

            expect(result).toEqual({ success: true });

            expect(mocks.setProductActive).toHaveBeenCalledWith(
                expect.anything(),
                "product-1",
                false
            );
        });

        it("returns an error when status updating fails", async () => {
            mocks.setProductActive.mockRejectedValue(
                new Error("Database error")
            );

            const result = await setProductActiveAction(
                "product-1",
                false
            );

            expect(result).toEqual({
                success: false,
                error: "Unable to update the product status. Please try again.",
            });
        });
    });

    describe("setProductPublishedAction", () => {
        it("updates the publication status", async () => {
            mocks.setProductPublished.mockResolvedValue(productRecord);

            const result = await setProductPublishedAction(
                "product-1",
                true
            );

            expect(result).toEqual({ success: true });

            expect(mocks.setProductPublished).toHaveBeenCalledWith(
                expect.anything(),
                "product-1",
                true
            );
        });

        it("returns an error when publication updating fails", async () => {
            mocks.setProductPublished.mockRejectedValue(
                new Error("Database error")
            );

            const result = await setProductPublishedAction(
                "product-1",
                true
            );

            expect(result).toEqual({
                success: false,
                error: "Unable to update the product publication status. Please try again.",
            });
        });
    });
});