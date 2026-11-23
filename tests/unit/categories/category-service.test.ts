import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    createCategory,
    getCategories,
    getCategoryById,
    getParentCategories,
    setCategoryActive,
    updateCategory,
} from "@/features/categories/services/category-service";
import type { CategoryInput } from "@/features/categories/schemas/category";

function createSupabaseMock({
    data = [],
    error = null,
}: {
    data?: unknown;
    error?: unknown;
} = {}) {
    const result = { data, error };

    const query = {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        eq: vi.fn(),
        neq: vi.fn(),
        is: vi.fn(),
        order: vi.fn(),
        maybeSingle: vi.fn(),
        single: vi.fn(),
        then: vi.fn((resolve, reject) =>
            Promise.resolve(result).then(resolve, reject)
        ),
    };

    query.select.mockReturnValue(query);
    query.insert.mockReturnValue(query);
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.neq.mockReturnValue(query);
    query.is.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.maybeSingle.mockResolvedValue(result);
    query.single.mockResolvedValue(result);

    const supabase = {
        from: vi.fn().mockReturnValue(query),
    };

    return { supabase, query };
}

describe("category-service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("retrieves categories ordered by sort order and name", async () => {
        const categories = [{ id: "category-1", name: "Regulators" }];
        const { supabase, query } = createSupabaseMock({
            data: categories,
        });

        const result = await getCategories(supabase as never);

        expect(supabase.from).toHaveBeenCalledWith("categories");
        expect(query.order).toHaveBeenNthCalledWith(1, "sort_order", {
            ascending: true,
        });
        expect(query.order).toHaveBeenNthCalledWith(2, "name", {
            ascending: true,
        });
        expect(result).toEqual(categories);
    });

    it("retrieves top-level parent categories", async () => {
        const categories = [{ id: "category-1", name: "Equipment" }];
        const { supabase, query } = createSupabaseMock({
            data: categories,
        });

        const result = await getParentCategories(supabase as never);

        expect(supabase.from).toHaveBeenCalledWith("categories");
        expect(query.is).toHaveBeenCalledWith("parent_id", null);
        expect(query.order).toHaveBeenCalledWith("name", {
            ascending: true,
        });
        expect(result).toEqual(categories);
    });

    it("excludes the current category from parent categories", async () => {
        const { supabase, query } = createSupabaseMock();

        await getParentCategories(supabase as never, "category-1");

        expect(query.neq).toHaveBeenCalledWith("id", "category-1");
    });

    it("retrieves a category by ID", async () => {
        const category = { id: "category-1", name: "Regulators" };
        const { supabase, query } = createSupabaseMock({
            data: category,
        });

        const result = await getCategoryById(
            supabase as never,
            "category-1"
        );

        expect(supabase.from).toHaveBeenCalledWith("categories");
        expect(query.eq).toHaveBeenCalledWith("id", "category-1");
        expect(result).toEqual(category);
    });

    it("creates a category", async () => {
        const input: CategoryInput = {
            name: "Regulators",
            slug: "regulators",
            description: null,
            parent_id: null,
        };
        const category = { id: "category-1", ...input };
        const { supabase, query } = createSupabaseMock({
            data: category,
        });

        const result = await createCategory(supabase as never, input);

        expect(query.insert).toHaveBeenCalledWith(input);
        expect(result).toEqual(category);
    });

    it("updates a category", async () => {
        const input: CategoryInput = {
            name: "Dive Computers",
            slug: "dive-computers",
            description: null,
            parent_id: null,
        };
        const category = { id: "category-1", ...input };
        const { supabase, query } = createSupabaseMock({
            data: category,
        });

        const result = await updateCategory(
            supabase as never,
            "category-1",
            input
        );

        expect(query.update).toHaveBeenCalledWith(input);
        expect(query.eq).toHaveBeenCalledWith("id", "category-1");
        expect(result).toEqual(category);
    });

    it("updates category activation status", async () => {
        const category = {
            id: "category-1",
            is_active: false,
        };
        const { supabase, query } = createSupabaseMock({
            data: category,
        });

        const result = await setCategoryActive(
            supabase as never,
            "category-1",
            false
        );

        expect(query.update).toHaveBeenCalledWith({
            is_active: false,
        });
        expect(query.eq).toHaveBeenCalledWith("id", "category-1");
        expect(result).toEqual(category);
    });

    it("throws a safe error when category retrieval fails", async () => {
        const { supabase } = createSupabaseMock({
            error: { message: "Database error" },
        });

        await expect(getCategories(supabase as never)).rejects.toThrow(
            "Unable to load categories."
        );
    });

    it("throws a safe error when category creation fails", async () => {
        const input: CategoryInput = {
            name: "Regulators",
            slug: "regulators",
            description: null,
            parent_id: null,
        };
        const { supabase } = createSupabaseMock({
            error: { message: "Database error" },
        });

        await expect(
            createCategory(supabase as never, input)
        ).rejects.toThrow("Unable to create category.");
    });
});