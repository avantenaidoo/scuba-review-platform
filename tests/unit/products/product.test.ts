import { describe, expect, it } from "vitest";
import {
    createProductSlug,
    validateProduct,
} from "@/features/products/schemas/product";

describe("createProductSlug", () => {
    it("creates a URL-friendly slug", () => {
        expect(createProductSlug("MK25 EVO Regulator")).toBe(
            "mk25-evo-regulator"
        );
    });

    it("removes punctuation and repeated separators", () => {
        expect(createProductSlug("Ocean & Earth -- Wetsuit")).toBe(
            "ocean-earth-wetsuit"
        );
    });

    it("normalises accented characters", () => {
        expect(createProductSlug("Équipement de plongée")).toBe(
            "equipement-de-plongee"
        );
    });
});

describe("validateProduct", () => {
    it("accepts valid product details", () => {
        expect(
            validateProduct(
                "MK25 EVO Regulator",
                "brand-123",
                "category-123",
                "subcategory-123",
                "MK25 EVO",
                "High-performance first-stage regulator."
            )
        ).toEqual({
            success: true,
            data: {
                name: "MK25 EVO Regulator",
                slug: "mk25-evo-regulator",
                brand_id: "brand-123",
                category_id: "category-123",
                subcategory_id: "subcategory-123",
                model_number: "MK25 EVO",
                description: "High-performance first-stage regulator.",
            },
        });
    });

    it("rejects an empty product name", () => {
        expect(
            validateProduct("   ", "brand-123", "category-123", null, "", "")
        ).toEqual({
            success: false,
            error: "Product name is required.",
        });
    });

    it("rejects names that cannot produce a slug", () => {
        expect(
            validateProduct("!!!", "brand-123", "category-123", null, "", "")
        ).toEqual({
            success: false,
            error: "Enter a valid product name.",
        });
    });

    it("requires a brand", () => {
        expect(
            validateProduct("Regulator", " ", "category-123", null, "", "")
        ).toEqual({
            success: false,
            error: "Select a brand.",
        });
    });

    it("requires a main category", () => {
        expect(
            validateProduct("Regulator", "brand-123", " ", null, "", "")
        ).toEqual({
            success: false,
            error: "Select a main category.",
        });
    });

    it("converts empty optional fields to null", () => {
        const result = validateProduct(
            "Regulator",
            " brand-123 ",
            " category-123 ",
            " ",
            " ",
            " "
        );

        expect(result).toMatchObject({
            success: true,
            data: {
                brand_id: "brand-123",
                category_id: "category-123",
                subcategory_id: null,
                model_number: null,
                description: null,
            },
        });
    });

    it("rejects a non-string subcategory", () => {
        expect(
            validateProduct(
                "Regulator",
                "brand-123",
                "category-123",
                123,
                null,
                null
            )
        ).toEqual({
            success: false,
            error: "Invalid subcategory.",
        });
    });
});