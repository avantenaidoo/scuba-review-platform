import { describe, expect, it } from "vitest";
import {
    createSlug,
    validateBrand,
} from "@/features/brands/schemas/brand";

describe("createSlug", () => {
    it("creates a URL-friendly slug", () => {
        expect(createSlug("Aqua Lung")).toBe("aqua-lung");
    });

    it("removes punctuation and repeated separators", () => {
        expect(createSlug("Ocean & Earth -- Diving")).toBe(
            "ocean-earth-diving"
        );
    });

    it("normalises accented characters", () => {
        expect(createSlug("Équipement")).toBe("equipement");
    });
});

describe("validateBrand", () => {
    it("accepts valid brand details", () => {
        expect(validateBrand("Scubapro", "Diving equipment")).toEqual({
            success: true,
            data: {
                name: "Scubapro",
                slug: "scubapro",
                description: "Diving equipment",
            },
        });
    });

    it("rejects an empty brand name", () => {
        expect(validateBrand("   ", "")).toEqual({
            success: false,
            error: "Brand name is required.",
        });
    });

    it("rejects names that cannot produce a slug", () => {
        expect(validateBrand("!!!", "")).toEqual({
            success: false,
            error: "Enter a valid brand name.",
        });
    });

    it("converts an empty description to null", () => {
        const result = validateBrand("Scubapro", "  ");

        expect(result).toMatchObject({
            success: true,
            data: { description: null },
        });
    });
});