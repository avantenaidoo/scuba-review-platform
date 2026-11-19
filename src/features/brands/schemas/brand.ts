export type BrandInput = {
    name: string;
    slug: string;
    description: string | null;
};

export type BrandValidationResult =
    | { success: true; data: BrandInput }
    | { success: false; error: string };

export function createSlug(name: string): string {
    return name
        .trim()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export function validateBrand(
    name: unknown,
    description: unknown
): BrandValidationResult {
    if (typeof name !== "string" || !name.trim()) {
        return { success: false, error: "Brand name is required." };
    }

    const cleanName = name.trim();
    const slug = createSlug(cleanName);

    if (!slug) {
        return { success: false, error: "Enter a valid brand name." };
    }

    return {
        success: true,
        data: {
            name: cleanName,
            slug,
            description:
                typeof description === "string" && description.trim()
                    ? description.trim()
                    : null,
        },
    };
}