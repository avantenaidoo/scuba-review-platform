export type ProductInput = {
    name: string;
    slug: string;
    brand_id: string;
    category_id: string;
    subcategory_id: string | null;
    model_number: string | null;
    description: string | null;
};

export type ProductValidationResult =
    | { success: true; data: ProductInput }
    | { success: false; error: string };

export function createProductSlug(name: string): string {
    return name
        .trim()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export function validateProduct(
    name: unknown,
    brandId: unknown,
    categoryId: unknown,
    subcategoryId: unknown,
    modelNumber: unknown,
    description: unknown
): ProductValidationResult {
    if (typeof name !== "string" || !name.trim()) {
        return { success: false, error: "Product name is required." };
    }

    const cleanName = name.trim();
    const slug = createProductSlug(cleanName);

    if (!slug) {
        return { success: false, error: "Enter a valid product name." };
    }

    if (typeof brandId !== "string" || !brandId.trim()) {
        return { success: false, error: "Select a brand." };
    }

    if (typeof categoryId !== "string" || !categoryId.trim()) {
        return { success: false, error: "Select a main category." };
    }

    if (
        subcategoryId !== null &&
        subcategoryId !== undefined &&
        typeof subcategoryId !== "string"
    ) {
        return { success: false, error: "Invalid subcategory." };
    }

    if (
        modelNumber !== null &&
        modelNumber !== undefined &&
        typeof modelNumber !== "string"
    ) {
        return { success: false, error: "Invalid model number." };
    }

    if (
        description !== null &&
        description !== undefined &&
        typeof description !== "string"
    ) {
        return { success: false, error: "Invalid product description." };
    }

    return {
        success: true,
        data: {
            name: cleanName,
            slug,
            brand_id: brandId.trim(),
            category_id: categoryId.trim(),
            subcategory_id:
                typeof subcategoryId === "string" && subcategoryId.trim()
                    ? subcategoryId.trim()
                    : null,
            model_number:
                typeof modelNumber === "string" && modelNumber.trim()
                    ? modelNumber.trim()
                    : null,
            description:
                typeof description === "string" && description.trim()
                    ? description.trim()
                    : null,
        },
    };
}