export type CategoryInput = {
    name: string;
    slug: string;
    description: string | null;
    parent_id: string | null;
};

export type CategoryValidationResult =
    | { success: true; data: CategoryInput }
    | { success: false; error: string };

export function createCategorySlug(name: string): string {
    return name
        .trim()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export function validateCategory(
    name: unknown,
    description: unknown,
    parentId: unknown
): CategoryValidationResult {
    if (typeof name !== "string" || !name.trim()) {
        return { success: false, error: "Category name is required." };
    }

    const cleanName = name.trim();
    const slug = createCategorySlug(cleanName);

    if (!slug) {
        return { success: false, error: "Enter a valid category name." };
    }

    if (
        parentId !== null &&
        parentId !== undefined &&
        typeof parentId !== "string"
    ) {
        return { success: false, error: "Invalid parent category." };
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
            parent_id:
                typeof parentId === "string" && parentId.trim()
                    ? parentId.trim()
                    : null,
        },
    };
}