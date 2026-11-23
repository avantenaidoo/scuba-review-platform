import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
    revalidatePath: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    setCategoryActive: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: mocks.createClient,
}));

vi.mock("next/cache", () => ({
    revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/features/categories/services/category-service", () => ({
    createCategory: mocks.createCategory,
    updateCategory: mocks.updateCategory,
    setCategoryActive: mocks.setCategoryActive,
}));

import {
    createCategoryAction,
    updateCategoryAction,
    setCategoryActiveAction,
} from "@/features/categories/actions/category-actions";

function createFormData(
    name = "Regulators",
    description = "Regulator equipment",
    parentId = ""
) {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    formData.set("parentId", parentId);
    return formData;
}

function createSupabaseMock({
    userId = "user-1",
    role = "admin",
    claimsError = null,
    roleError = null,
}: {
    userId?: string | null;
    role?: string | null;
    claimsError?: unknown;
    roleError?: unknown;
} = {}) {
    const query = {
        select: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn(),
    };

    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.maybeSingle.mockResolvedValue({
        data: role ? { role } : null,
        error: roleError,
    });

    const supabase = {
        auth: {
            getClaims: vi.fn().mockResolvedValue({
                data: userId ? { claims: { sub: userId } } : null,
                error: claimsError,
            }),
        },
        from: vi.fn().mockReturnValue(query),
    };

    mocks.createClient.mockResolvedValue(supabase);

    return { supabase, query };
}

describe("category-actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.createCategory.mockResolvedValue({});
        mocks.updateCategory.mockResolvedValue({});
        mocks.setCategoryActive.mockResolvedValue({});
    });

    it("creates a category successfully", async () => {
        const { supabase } = createSupabaseMock();

        const result = await createCategoryAction(createFormData());

        expect(supabase.from).toHaveBeenCalledWith("user_roles");
        expect(mocks.createCategory).toHaveBeenCalledWith(
            supabase,
            {
                name: "Regulators",
                slug: "regulators",
                description: "Regulator equipment",
                parent_id: null,
            }
        );
        expect(mocks.revalidatePath).toHaveBeenCalledWith(
            "/admin/categories"
        );
        expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
        expect(result).toEqual({ success: true });
    });

    it("rejects an unauthenticated user", async () => {
        createSupabaseMock({ userId: null });

        const result = await createCategoryAction(createFormData());

        expect(result).toEqual({
            success: false,
            error: "You must be signed in.",
        });
        expect(mocks.createCategory).not.toHaveBeenCalled();
    });

    it("rejects a user without administrator access", async () => {
        createSupabaseMock({ role: "member" });

        const result = await createCategoryAction(createFormData());

        expect(result).toEqual({
            success: false,
            error: "Administrator access required.",
        });
        expect(mocks.createCategory).not.toHaveBeenCalled();
    });

    it("rejects invalid category input", async () => {
        createSupabaseMock();

        const result = await createCategoryAction(createFormData("  "));

        expect(result).toEqual({
            success: false,
            error: "Category name is required.",
        });
        expect(mocks.createCategory).not.toHaveBeenCalled();
    });

    it("returns an error when category creation fails", async () => {
        createSupabaseMock();
        mocks.createCategory.mockRejectedValue(new Error("Database error"));

        const result = await createCategoryAction(createFormData());

        expect(result).toEqual({
            success: false,
            error: "Unable to create category. Please check the category details and try again.",
        });
    });

    it("updates a category successfully", async () => {
        const { supabase } = createSupabaseMock();

        const result = await updateCategoryAction(
            "category-1",
            createFormData("Dive Computers")
        );

        expect(mocks.updateCategory).toHaveBeenCalledWith(
            supabase,
            "category-1",
            {
                name: "Dive Computers",
                slug: "dive-computers",
                description: "Regulator equipment",
                parent_id: null,
            }
        );
        expect(result).toEqual({ success: true });
    });

    it("returns an error when category updating fails", async () => {
        createSupabaseMock();
        mocks.updateCategory.mockRejectedValue(new Error("Database error"));

        const result = await updateCategoryAction(
            "category-1",
            createFormData()
        );

        expect(result).toEqual({
            success: false,
            error: "Unable to update category. Please check the category details and try again.",
        });
    });

    it("updates category activation status", async () => {
        const { supabase } = createSupabaseMock();

        const result = await setCategoryActiveAction("category-1", false);

        expect(mocks.setCategoryActive).toHaveBeenCalledWith(
            supabase,
            "category-1",
            false
        );
        expect(result).toEqual({ success: true });
    });

    it("returns an error when category status updating fails", async () => {
        createSupabaseMock();
        mocks.setCategoryActive.mockRejectedValue(
            new Error("Database error")
        );

        const result = await setCategoryActiveAction("category-1", false);

        expect(result).toEqual({
            success: false,
            error: "Unable to update category status. Please try again.",
        });
    });
});