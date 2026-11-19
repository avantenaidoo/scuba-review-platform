import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    createBrand,
    getBrands,
    setBrandActive,
    updateBrand,
    type BrandRecord,
} from "@/features/brands/services/brand-service";

const brand: BrandRecord = {
    id: "brand-1",
    name: "Scubapro",
    slug: "scubapro",
    description: "Diving equipment",
    logo_path: null,
    logo_alt_text: null,
    logo_mime_type: null,
    logo_size_bytes: null,
    is_active: true,
    created_at: "2026-11-19T00:00:00Z",
    updated_at: "2026-11-19T00:00:00Z",
};

const input = {
    name: "Scubapro",
    slug: "scubapro",
    description: "Diving equipment",
};

function createSupabaseMock(result: {
    data: unknown;
    error: unknown;
}) {
    const query: Record<string, ReturnType<typeof vi.fn>> = {};

    for (const method of ["select", "insert", "update", "eq", "order"]) {
        query[method] = vi.fn(() => query);
    }

    query.single = vi.fn().mockResolvedValue(result);

    query.order = vi.fn().mockResolvedValue(result);

    const supabase = {
        from: vi.fn(() => query),
    };

    return { supabase, query };
}

describe("brand-service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("retrieves brands ordered by name", async () => {
        const { supabase, query } = createSupabaseMock({
            data: [brand],
            error: null,
        });

        const result = await getBrands(supabase as never);

        expect(result).toEqual([brand]);
        expect(supabase.from).toHaveBeenCalledWith("brands");
        expect(query.order).toHaveBeenCalledWith("name", {
            ascending: true,
        });
    });

    it("creates a brand", async () => {
        const { supabase, query } = createSupabaseMock({
            data: brand,
            error: null,
        });

        const result = await createBrand(supabase as never, input);

        expect(result).toEqual(brand);
        expect(query.insert).toHaveBeenCalledWith(input);
    });

    it("updates a brand", async () => {
        const { supabase, query } = createSupabaseMock({
            data: brand,
            error: null,
        });

        const result = await updateBrand(
            supabase as never,
            "brand-1",
            input
        );

        expect(result).toEqual(brand);
        expect(query.update).toHaveBeenCalledWith(input);
        expect(query.eq).toHaveBeenCalledWith("id", "brand-1");
    });

    it("changes a brand's active status", async () => {
        const inactiveBrand = { ...brand, is_active: false };
        const { supabase, query } = createSupabaseMock({
            data: inactiveBrand,
            error: null,
        });

        const result = await setBrandActive(
            supabase as never,
            "brand-1",
            false
        );

        expect(result).toEqual(inactiveBrand);
        expect(query.update).toHaveBeenCalledWith({
            is_active: false,
        });
        expect(query.eq).toHaveBeenCalledWith("id", "brand-1");
    });

    it("throws a safe error when retrieval fails", async () => {
        const { supabase } = createSupabaseMock({
            data: null,
            error: new Error("Database details"),
        });

        await expect(getBrands(supabase as never)).rejects.toThrow(
            "Unable to retrieve brands."
        );
    });

    it("throws a safe error when creation fails", async () => {
        const { supabase } = createSupabaseMock({
            data: null,
            error: new Error("Database details"),
        });

        await expect(
            createBrand(supabase as never, input)
        ).rejects.toThrow("Unable to create brand.");
    });
});