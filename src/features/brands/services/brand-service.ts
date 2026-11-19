import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { BrandInput } from "@/features/brands/schemas/brand";

const BRAND_COLUMNS =
    "id, name, slug, description, logo_path, logo_alt_text, logo_mime_type, logo_size_bytes, is_active, created_at, updated_at";

export type BrandRecord =
    Database["public"]["Tables"]["brands"]["Row"];

type BrandClient = SupabaseClient<Database>;

export async function getBrands(
    supabase: BrandClient
): Promise<BrandRecord[]> {
    const { data, error } = await supabase
        .from("brands")
        .select(BRAND_COLUMNS)
        .order("name", { ascending: true });

    if (error) {
        throw new Error("Unable to retrieve brands.");
    }

    return data ?? [];
}

export async function getBrandById(
    supabase: BrandClient,
    id: string
): Promise<BrandRecord | null> {
    const { data, error } = await supabase
        .from("brands")
        .select(BRAND_COLUMNS)
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw new Error("Unable to retrieve brand.");
    }

    return data;
}

export async function createBrand(
    supabase: BrandClient,
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

    return data;
}

export async function updateBrand(
    supabase: BrandClient,
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

    return data;
}

export async function setBrandActive(
    supabase: BrandClient,
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

    return data;
}