import type { SupabaseClient } from "@supabase/supabase-js";
import type { BrandInput } from "@/features/brands/schemas/brand";

const BRAND_COLUMNS = [
    "id",
    "name",
    "slug",
    "description",
    "logo_path",
    "logo_alt_text",
    "logo_mime_type",
    "logo_size_bytes",
    "is_active",
    "created_at",
    "updated_at",
].join(", ");

export type BrandRecord = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_path: string | null;
    logo_alt_text: string | null;
    logo_mime_type: string | null;
    logo_size_bytes: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export async function getBrands(
    supabase: SupabaseClient
): Promise<BrandRecord[]> {
    const { data, error } = await supabase
        .from("brands")
        .select(BRAND_COLUMNS)
        .order("name", { ascending: true });

    if (error) {
        throw new Error("Unable to retrieve brands.");
    }

    return (data ?? []) as BrandRecord[];
}

export async function createBrand(
    supabase: SupabaseClient,
    input: BrandInput
): Promise<BrandRecord> {
    const { data, error } = await supabase
        .from("brands")
        .insert(input)
        .select(BRAND_COLUMNS)
        .single();

    if (error || !data) {
        throw new Error("Unable to create brand.");
    }

    return data as BrandRecord;
}

export async function updateBrand(
    supabase: SupabaseClient,
    id: string,
    input: BrandInput
): Promise<BrandRecord> {
    const { data, error } = await supabase
        .from("brands")
        .update(input)
        .eq("id", id)
        .select(BRAND_COLUMNS)
        .single();

    if (error || !data) {
        throw new Error("Unable to update brand.");
    }

    return data as BrandRecord;
}

export async function setBrandActive(
    supabase: SupabaseClient,
    id: string,
    isActive: boolean
): Promise<BrandRecord> {
    const { data, error } = await supabase
        .from("brands")
        .update({ is_active: isActive })
        .eq("id", id)
        .select(BRAND_COLUMNS)
        .single();

    if (error || !data) {
        throw new Error("Unable to update brand status.");
    }

    return data as BrandRecord;
}