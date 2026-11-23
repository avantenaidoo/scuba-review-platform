import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
    getAdminProduct,
    getAdminProducts,
    getProductFormOptions,
    requireProductAdmin,
} from "@/features/products/services/product-admin";
import { getProductById } from "@/features/products/services/product-service";

vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(),
}));

vi.mock("@/features/products/services/product-service", () => ({
    getProductById: vi.fn(),
}));

type QueryResult = {
    data: unknown[] | null;
    error: unknown | null;
};

type AwaitableQuery = {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    then: (
        resolve: (value: QueryResult) => unknown,
        reject?: (reason: unknown) => unknown
    ) => Promise<unknown>;
};

function createAwaitableQuery(result: QueryResult): AwaitableQuery {
    const query: AwaitableQuery = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        in: vi.fn(() => query),
        order: vi.fn(() => query),
        then: (resolve, reject) =>
            Promise.resolve(result).then(resolve, reject),
    };

    return query;
}

const brands = [
    {
        id: "brand-1",
        name: "Scubapro",
    },
    {
        id: "brand-2",
        name: "Mares",
    },
];

const categories = [
    {
        id: "category-1",
        name: "Regulators",
        parent_id: null,
    },
    {
        id: "category-2",
        name: "First Stages",
        parent_id: "category-1",
    },
];

const adminProducts = [
    {
        id: "product-1",
        name: "MK25 EVO",
        model_number: "MK25",
        brand_id: "brand-1",
        category_id: "category-1",
        is_active: true,
        is_published: true,
    },
    {
        id: "product-2",
        name: "Avanti Quattro",
        model_number: "AQ",
        brand_id: "brand-2",
        category_id: "category-2",
        is_active: false,
        is_published: false,
    },
];

function createOptionsMock({
    brandsResult = { data: brands, error: null },
    categoriesResult = { data: categories, error: null },
}: {
    brandsResult?: QueryResult;
    categoriesResult?: QueryResult;
} = {}) {
    const brandQuery = {
        select: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
    };

    const categoryQuery = {
        select: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
    };

    brandQuery.select.mockReturnValue(brandQuery);
    brandQuery.eq.mockReturnValue(brandQuery);
    brandQuery.order.mockResolvedValue(brandsResult);

    categoryQuery.select.mockReturnValue(categoryQuery);
    categoryQuery.eq.mockReturnValue(categoryQuery);
    categoryQuery.order
        .mockReturnValueOnce(categoryQuery)
        .mockResolvedValue(categoriesResult);

    const supabase = {
        from: vi.fn((table: string) => {
            if (table === "brands") return brandQuery;
            if (table === "categories") return categoryQuery;

            throw new Error(`Unexpected table: ${table}`);
        }),
    };

    return {
        supabase,
        brandQuery,
        categoryQuery,
    };
}

function configureAdminClient({
    claims = { sub: "admin-user" },
    claimsError = null,
    roleRecord = { role: "admin" },
    roleError = null,
}: {
    claims?: { sub: string } | null;
    claimsError?: unknown;
    roleRecord?: { role: string } | null;
    roleError?: unknown;
} = {}) {
    const roleQuery = {
        select: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn(),
    };

    roleQuery.select.mockReturnValue(roleQuery);
    roleQuery.eq.mockReturnValue(roleQuery);
    roleQuery.maybeSingle.mockResolvedValue({
        data: roleRecord,
        error: roleError,
    });

    const supabase = {
        auth: {
            getClaims: vi.fn().mockResolvedValue({
                data: {
                    claims,
                },
                error: claimsError,
            }),
        },
        from: vi.fn(() => roleQuery),
    };

    vi.mocked(createClient).mockResolvedValue(supabase as never);

    return {
        supabase,
        roleQuery,
    };
}

function createAdminProductsMock({
    products = adminProducts,
    productsError = null,
    brandsResult = { data: brands, error: null },
    categoriesResult = { data: categories, error: null },
    imagesResult = {
        data: [
            {
                product_id: "product-1",
                storage_path: "products/product-1/main.webp",
            },
        ],
        error: null,
    },
    signedUrlResult = {
        data: {
            signedUrl: "https://example.com/signed-product-image.webp",
        },
        error: null,
    },
}: {
    products?: unknown[] | null;
    productsError?: unknown;
    brandsResult?: QueryResult;
    categoriesResult?: QueryResult;
    imagesResult?: QueryResult;
    signedUrlResult?: {
        data: { signedUrl: string } | null;
        error: unknown | null;
    };
} = {}) {
    const queries = {
        products: createAwaitableQuery({
            data: products,
            error: productsError,
        }),
        brands: createAwaitableQuery(brandsResult),
        categories: createAwaitableQuery(categoriesResult),
        product_images: createAwaitableQuery(imagesResult),
    };

    const createSignedUrl = vi.fn().mockResolvedValue(signedUrlResult);

    const supabase = {
        from: vi.fn((table: string) => {
            const query = queries[table as keyof typeof queries];

            if (!query) {
                throw new Error(`Unexpected table: ${table}`);
            }

            return query;
        }),
        storage: {
            from: vi.fn(() => ({
                createSignedUrl,
            })),
        },
    };

    return {
        supabase,
        queries,
        createSignedUrl,
    };
}

describe("requireProductAdmin", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns the Supabase client for an administrator", async () => {
        const { supabase } = configureAdminClient();

        const result = await requireProductAdmin();

        expect(result).toBe(supabase);
        expect(createClient).toHaveBeenCalledOnce();
    });

    it("redirects to login when authentication claims are unavailable", async () => {
        configureAdminClient({
            claims: null,
            claimsError: new Error("Unauthenticated"),
        });

        await requireProductAdmin();

        expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("throws when administrator role verification fails", async () => {
        configureAdminClient({
            roleError: new Error("Database error"),
        });

        await expect(requireProductAdmin()).rejects.toThrow(
            "Unable to verify administrator access."
        );
    });

    it("redirects non-administrators to the member area", async () => {
        configureAdminClient({
            roleRecord: { role: "member" },
        });

        await requireProductAdmin();

        expect(redirect).toHaveBeenCalledWith("/member");
    });
});

describe("getProductFormOptions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns active brands and categories", async () => {
        const { supabase, brandQuery, categoryQuery } =
            createOptionsMock();

        const result = await getProductFormOptions(supabase as never);

        expect(result).toEqual({
            brands,
            categories,
        });

        expect(supabase.from).toHaveBeenCalledWith("brands");
        expect(supabase.from).toHaveBeenCalledWith("categories");

        expect(brandQuery.eq).toHaveBeenCalledWith("is_active", true);
        expect(categoryQuery.eq).toHaveBeenCalledWith("is_active", true);
    });

    it("throws when active brands cannot be retrieved", async () => {
        const { supabase } = createOptionsMock({
            brandsResult: {
                data: null,
                error: new Error("Database error"),
            },
        });

        await expect(
            getProductFormOptions(supabase as never)
        ).rejects.toThrow("Unable to retrieve active brands.");
    });

    it("throws when active categories cannot be retrieved", async () => {
        const { supabase } = createOptionsMock({
            categoriesResult: {
                data: null,
                error: new Error("Database error"),
            },
        });

        await expect(
            getProductFormOptions(supabase as never)
        ).rejects.toThrow("Unable to retrieve active categories.");
    });
});

describe("getAdminProduct", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns the requested product", async () => {
        const product = {
            id: "product-1",
            name: "MK25 EVO",
        };

        vi.mocked(getProductById).mockResolvedValue(product as never);

        const result = await getAdminProduct({} as never, "product-1");

        expect(getProductById).toHaveBeenCalledWith(
            expect.anything(),
            "product-1"
        );
        expect(result).toEqual(product);
    });

    it("returns null when the product does not exist", async () => {
        vi.mocked(getProductById).mockResolvedValue(null);

        const result = await getAdminProduct({} as never, "missing-product");

        expect(result).toBeNull();
    });
});

describe("getAdminProducts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("retrieves admin products with their brand, category and main image", async () => {
        const { supabase, createSignedUrl } = createAdminProductsMock();

        const result = await getAdminProducts(supabase as never);

        expect(result).toEqual([
            {
                id: "product-1",
                name: "MK25 EVO",
                brandName: "Scubapro",
                categoryName: "Regulators",
                modelNumber: "MK25",
                isActive: true,
                isPublished: true,
                mainImageUrl:
                    "https://example.com/signed-product-image.webp",
            },
            {
                id: "product-2",
                name: "Avanti Quattro",
                brandName: "Mares",
                categoryName: "First Stages",
                modelNumber: "AQ",
                isActive: false,
                isPublished: false,
                mainImageUrl: null,
            },
        ]);

        expect(createSignedUrl).toHaveBeenCalledWith(
            "products/product-1/main.webp",
            3600
        );
    });

    it("returns an empty array when no products exist", async () => {
        const { supabase } = createAdminProductsMock({
            products: [],
        });

        const result = await getAdminProducts(supabase as never);

        expect(result).toEqual([]);
    });

    it("throws when the products query fails", async () => {
        const { supabase } = createAdminProductsMock({
            products: null,
            productsError: new Error("Database error"),
        });

        await expect(
            getAdminProducts(supabase as never)
        ).rejects.toThrow("Unable to retrieve products.");
    });

    it("throws when brand retrieval fails", async () => {
        const { supabase } = createAdminProductsMock({
            brandsResult: {
                data: null,
                error: new Error("Database error"),
            },
        });

        await expect(
            getAdminProducts(supabase as never)
        ).rejects.toThrow("Unable to retrieve product brands.");
    });

    it("throws when category retrieval fails", async () => {
        const { supabase } = createAdminProductsMock({
            categoriesResult: {
                data: null,
                error: new Error("Database error"),
            },
        });

        await expect(
            getAdminProducts(supabase as never)
        ).rejects.toThrow("Unable to retrieve product categories.");
    });

    it("throws when product image retrieval fails", async () => {
        const { supabase } = createAdminProductsMock({
            imagesResult: {
                data: null,
                error: new Error("Database error"),
            },
        });

        await expect(
            getAdminProducts(supabase as never)
        ).rejects.toThrow("Unable to retrieve product images.");
    });

    it("throws when a main image signed URL cannot be created", async () => {
        const { supabase } = createAdminProductsMock({
            signedUrlResult: {
                data: null,
                error: new Error("Storage error"),
            },
        });

        await expect(
            getAdminProducts(supabase as never)
        ).rejects.toThrow("Unable to retrieve product image URLs.");
    });
});