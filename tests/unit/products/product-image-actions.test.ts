import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    createClientMock,
    revalidatePathMock,
    storageListMock,
    queryResponses,
} = vi.hoisted(() => ({
    createClientMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    storageListMock: vi.fn(),
    queryResponses: {} as Record<string, unknown[]>,
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: createClientMock,
}));

vi.mock("next/cache", () => ({
    revalidatePath: revalidatePathMock,
}));

import {
    removeProductImageAction,
    saveProductImageAction,
} from "@/features/products/actions/product-image-actions";

const PRODUCT_ID = "product-123";
const IMAGE_ID = "image-123";
const STORAGE_PATH = `${PRODUCT_ID}/image-123.webp`;
const OLD_STORAGE_PATH = `${PRODUCT_ID}/old-image.webp`;
const ADMIN_ID = "admin-123";
const MAX_FILE_SIZE = 15 * 1024 * 1024;

function queueResponse(table: string, ...responses: unknown[]) {
    queryResponses[table] ??= [];
    queryResponses[table].push(...responses);
}

function createQueryBuilder(table: string) {
    const builder: Record<string, unknown> = {};

    const chainMethods = [
        "select",
        "insert",
        "update",
        "delete",
        "eq",
        "order",
        "limit",
        "maybeSingle",
        "single",
    ];

    for (const method of chainMethods) {
        builder[method] = vi.fn(() => builder);
    }

    builder.then = (
        resolve: (value: unknown) => unknown,
        reject: (reason: unknown) => unknown
    ) => {
        const response = queryResponses[table]?.shift() ?? {
            data: null,
            error: null,
        };

        return Promise.resolve(response).then(resolve, reject);
    };

    return builder;
}

function createSupabaseMock() {
    const from = vi.fn((table: string) => createQueryBuilder(table));

    return {
        auth: {
            getClaims: vi.fn().mockResolvedValue({
                data: {
                    claims: {
                        sub: ADMIN_ID,
                    },
                },
                error: null,
            }),
        },
        from,
        storage: {
            from: vi.fn(() => ({
                list: storageListMock,
            })),
        },
    };
}

function setAdminRoleResponse() {
    queueResponse("user_roles", {
        data: { role: "admin" },
        error: null,
    });
}

function setProductResponse() {
    queueResponse("products", {
        data: { id: PRODUCT_ID },
        error: null,
    });
}

function setValidStorageResponse() {
    storageListMock.mockResolvedValue({
        data: [
            {
                name: "image-123.webp",
                metadata: {
                    mimetype: "image/webp",
                    size: 1024,
                },
            },
        ],
        error: null,
    });
}

function configureAdmin() {
    const supabase = createSupabaseMock();
    createClientMock.mockResolvedValue(supabase);
    setAdminRoleResponse();

    return supabase;
}

describe("product image actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        for (const key of Object.keys(queryResponses)) {
            delete queryResponses[key];
        }

        storageListMock.mockResolvedValue({
            data: [],
            error: null,
        });
    });

    describe("saveProductImageAction", () => {
        it("rejects unauthenticated users", async () => {
            const supabase = createSupabaseMock();

            supabase.auth.getClaims.mockResolvedValue({
                data: { claims: null },
                error: null,
            });

            createClientMock.mockResolvedValue(supabase);

            const result = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Product image",
                1024,
                "main",
                800,
                600
            );

            expect(result.success).toBe(false);
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it("rejects users who are not administrators", async () => {
            const supabase = createSupabaseMock();

            createClientMock.mockResolvedValue(supabase);

            queueResponse("user_roles", {
                data: { role: "member" },
                error: null,
            });

            const result = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Product image",
                1024,
                "main",
                800,
                600
            );

            expect(result.success).toBe(false);
            expect(storageListMock).not.toHaveBeenCalled();
        });

        it("rejects an empty or excessively long alt text", async () => {
            configureAdmin();

            const emptyAltText = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "",
                1024,
                "main",
                800,
                600
            );

            const longAltText = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "a".repeat(126),
                1024,
                "main",
                800,
                600
            );

            expect(emptyAltText.success).toBe(false);
            expect(longAltText.success).toBe(false);
            expect(storageListMock).not.toHaveBeenCalled();
        });

        it("rejects an invalid file size", async () => {
            configureAdmin();

            const zeroSizeResult = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Product image",
                0,
                "main",
                800,
                600
            );

            const oversizedResult = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Product image",
                MAX_FILE_SIZE + 1,
                "main",
                800,
                600
            );

            expect(zeroSizeResult.success).toBe(false);
            expect(oversizedResult.success).toBe(false);
            expect(storageListMock).not.toHaveBeenCalled();
        });

        it("rejects an invalid image type", async () => {
            configureAdmin();

            const result = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Product image",
                1024,
                "thumbnail" as "main",
                800,
                600
            );

            expect(result.success).toBe(false);
            expect(storageListMock).not.toHaveBeenCalled();
        });

        it("rejects invalid image dimensions", async () => {
            configureAdmin();

            const result = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Product image",
                1024,
                "main",
                0,
                600
            );

            expect(result.success).toBe(false);
            expect(storageListMock).not.toHaveBeenCalled();
        });

        it("rejects a storage path that does not belong to the product", async () => {
            configureAdmin();

            const result = await saveProductImageAction(
                "another-product",
                STORAGE_PATH,
                "Product image",
                1024,
                "main",
                800,
                600
            );

            expect(result.success).toBe(false);
            expect(storageListMock).not.toHaveBeenCalled();
        });

        it("rejects a storage file that cannot be found", async () => {
            configureAdmin();
            setProductResponse();

            storageListMock.mockResolvedValue({
                data: [],
                error: null,
            });

            const result = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Product image",
                1024,
                "main",
                800,
                600
            );

            expect(result.success).toBe(false);
        });

        it("rejects a storage file with an incorrect MIME type", async () => {
            configureAdmin();
            setProductResponse();

            storageListMock.mockResolvedValue({
                data: [
                    {
                        name: "image-123.webp",
                        metadata: {
                            mimetype: "image/png",
                            size: 1024,
                        },
                    },
                ],
                error: null,
            });

            const result = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Product image",
                1024,
                "main",
                800,
                600
            );

            expect(result.success).toBe(false);
        });

        it("rejects a storage file whose size does not match the submitted size", async () => {
            configureAdmin();
            setProductResponse();

            storageListMock.mockResolvedValue({
                data: [
                    {
                        name: "image-123.webp",
                        metadata: {
                            mimetype: "image/webp",
                            size: 2048,
                        },
                    },
                ],
                error: null,
            });

            const result = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Product image",
                1024,
                "main",
                800,
                600
            );

            expect(result.success).toBe(false);
        });

        it("handles a storage verification error", async () => {
            configureAdmin();
            setProductResponse();

            storageListMock.mockResolvedValue({
                data: null,
                error: { message: "Storage unavailable" },
            });

            const result = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Product image",
                1024,
                "main",
                800,
                600
            );

            expect(result.success).toBe(false);
        });

        it("saves a main image and returns the previous image path", async () => {
            configureAdmin();
            setProductResponse();
            setValidStorageResponse();

            queueResponse(
                "product_images",
                {
                    data: {
                        id: IMAGE_ID,
                        storage_path: OLD_STORAGE_PATH,
                    },
                    error: null,
                },
                {
                    data: { id: IMAGE_ID },
                    error: null,
                }
            );

            const result = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Product image",
                1024,
                "main",
                800,
                600
            );

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.imageId).toBe(IMAGE_ID);
                expect(result.previousImagePath).toBe(OLD_STORAGE_PATH);
            }

            expect(revalidatePathMock).toHaveBeenCalledWith(
                "/admin/products"
            );
            expect(revalidatePathMock).toHaveBeenCalledWith(
                `/admin/products/${PRODUCT_ID}`
            );
        });

        it("saves a gallery image", async () => {
            configureAdmin();
            setProductResponse();
            setValidStorageResponse();

            queueResponse(
                "product_images",
                {
                    data: { sort_order: 1 },
                    error: null,
                },
                {
                    data: { id: IMAGE_ID },
                    error: null,
                }
            );

            const result = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Gallery image",
                1024,
                "gallery",
                800,
                600
            );

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.imageId).toBe(IMAGE_ID);
            }
        });

        it("returns an error when product image metadata cannot be saved", async () => {
            configureAdmin();
            setProductResponse();
            setValidStorageResponse();

            queueResponse("product_images", {
                data: null,
                error: { message: "Database error" },
            });

            const result = await saveProductImageAction(
                PRODUCT_ID,
                STORAGE_PATH,
                "Product image",
                1024,
                "main",
                800,
                600
            );

            expect(result.success).toBe(false);
        });
    });

    describe("removeProductImageAction", () => {
        it("rejects unauthenticated users", async () => {
            const supabase = createSupabaseMock();

            supabase.auth.getClaims.mockResolvedValue({
                data: { claims: null },
                error: null,
            });

            createClientMock.mockResolvedValue(supabase);

            const result = await removeProductImageAction(
                PRODUCT_ID,
                IMAGE_ID
            );

            expect(result.success).toBe(false);
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it("rejects users who are not administrators", async () => {
            const supabase = createSupabaseMock();

            createClientMock.mockResolvedValue(supabase);

            queueResponse("user_roles", {
                data: { role: "member" },
                error: null,
            });

            const result = await removeProductImageAction(
                PRODUCT_ID,
                IMAGE_ID
            );

            expect(result.success).toBe(false);
        });

        it("returns an error when the image does not exist", async () => {
            configureAdmin();

            queueResponse("product_images", {
                data: null,
                error: null,
            });

            const result = await removeProductImageAction(
                PRODUCT_ID,
                IMAGE_ID
            );

            expect(result.success).toBe(false);
        });

        it("removes image metadata and returns its storage path", async () => {
            configureAdmin();

            queueResponse(
                "product_images",
                {
                    data: {
                        id: IMAGE_ID,
                        product_id: PRODUCT_ID,
                        storage_path: STORAGE_PATH,
                    },
                    error: null,
                },
                {
                    data: null,
                    error: null,
                }
            );

            const result = await removeProductImageAction(
                PRODUCT_ID,
                IMAGE_ID
            );

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.previousImagePath).toBe(STORAGE_PATH);
            }

            expect(revalidatePathMock).toHaveBeenCalledWith(
                "/admin/products"
            );
            expect(revalidatePathMock).toHaveBeenCalledWith(
                `/admin/products/${PRODUCT_ID}`
            );
        });

        it("returns an error when deleting image metadata fails", async () => {
            configureAdmin();

            queueResponse(
                "product_images",
                {
                    data: {
                        id: IMAGE_ID,
                        product_id: PRODUCT_ID,
                        storage_path: STORAGE_PATH,
                    },
                    error: null,
                },
                {
                    data: null,
                    error: { message: "Database delete failed" },
                }
            );

            const result = await removeProductImageAction(
                PRODUCT_ID,
                IMAGE_ID
            );

            expect(result.success).toBe(false);
        });
    });
});
