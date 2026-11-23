import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { CategoryInput } from "../schemas/category";

const CATEGORY_COLUMNS =
    "id, parent_id, name, slug, description, sort_order, is_active, created_at, updated_at";

export type CategoryRecord =
    Database["public"]["Tables"]["categories"]["Row"];

type CategoryClient = SupabaseClient<Database>;

export async function getCategories(
    supabase: CategoryClient
): Promise<CategoryRecord[]> {
    const { data, error } = await supabase
        .from("categories")
        .select(CATEGORY_COLUMNS)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    if (error) {
        throw new Error("Unable to load categories.");
    }

    return data ?? [];
}

export async function getParentCategories(
    supabase: CategoryClient,
    excludeId?: string
): Promise<CategoryRecord[]> {
    let query = supabase
        .from("categories")
        .select(CATEGORY_COLUMNS)
        .is("parent_id", null)
        .order("name", { ascending: true });

    if (excludeId) {
        query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error("Unable to load parent categories.");
    }

    return data ?? [];
}

export async function getCategoryById(
    supabase: CategoryClient,
    id: string
): Promise<CategoryRecord | null> {
    const { data, error } = await supabase
        .from("categories")
        .select(CATEGORY_COLUMNS)
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw new Error("Unable to load category.");
    }

    return data;
}

export async function createCategory(
    supabase: CategoryClient,
    input: CategoryInput
): Promise<CategoryRecord> {
    const { data, error } = await supabase
        .from("categories")
        .insert(input)
        .select(CATEGORY_COLUMNS)
        .single();

    if (error) {
        throw new Error("Unable to create category.");
    }

    return data;
}

export async function updateCategory(
    supabase: CategoryClient,
    id: string,
    input: CategoryInput
): Promise<CategoryRecord> {
    const { data, error } = await supabase
        .from("categories")
        .update(input)
        .eq("id", id)
        .select(CATEGORY_COLUMNS)
        .single();

    if (error) {
        throw new Error("Unable to update category.");
    }

    return data;
}

export async function setCategoryActive(
    supabase: CategoryClient,
    id: string,
    isActive: boolean
): Promise<CategoryRecord> {
    const { data, error } = await supabase
        .from("categories")
        .update({ is_active: isActive })
        .eq("id", id)
        .select(CATEGORY_COLUMNS)
        .single();

    if (error) {
        throw new Error("Unable to update category status.");
    }

    return data;
}