import { describe, expect, it } from "vitest";
import {
    createCategorySlug,
    validateCategory,
} from "@/features/categories/schemas/category";

describe("createCategorySlug", () => {
    it("creates a URL-friendly slug", () => {
        expect(createCategorySlug("Dive Computers")).toBe("dive-computers");
    });

    it("removes punctuation and repeated separators", () => {
        expect(createCategorySlug("Masks & Snorkels!")).toBe("masks-snorkels");
    });

    it("normalizes accented characters", () => {
        expect(createCategorySlug("Équipement de plongée")).toBe(
            "equipement-de-plongee"
        );
    });
});

describe("validateCategory", () => {
    it("accepts a top-level category", () => {
        expect(
            validateCategory("Regulators", "Regulator equipment", null)
        ).toEqual({
            success: true,
            data: {
                name: "Regulators",
                slug: "regulators",
                description: "Regulator equipment",
                parent_id: null,
            },
        });
    });

    it("accepts a subcategory with a parent ID", () => {
        const parentId = "123e4567-e89b-12d3-a456-426614174000";

        expect(validateCategory("First Stage", null, parentId)).toEqual({
            success: true,
            data: {
                name: "First Stage",
                slug: "first-stage",
                description: null,
                parent_id: parentId,
            },
        });
    });

    it("rejects an empty category name", () => {
        expect(validateCategory("  ", null, null)).toEqual({
            success: false,
            error: "Category name is required.",
        });
    });

    it("rejects a name that cannot produce a slug", () => {
        expect(validateCategory("!!!", null, null)).toEqual({
            success: false,
            error: "Enter a valid category name.",
        });
    });

    it("converts an empty description to null", () => {
        const result = validateCategory("Masks", "   ", null);

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.description).toBeNull();
        }
    });

    it("rejects a non-string parent ID", () => {
        expect(validateCategory("Masks", null, 123)).toEqual({
            success: false,
            error: "Invalid parent category.",
        });
    });
});