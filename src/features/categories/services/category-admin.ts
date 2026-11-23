import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireCategoryAdmin() {
    const supabase = await createClient();

    const { data, error: claimsError } = await supabase.auth.getClaims();
    const claims = data?.claims;

    if (claimsError || !claims?.sub) {
        redirect("/login");
    }

    const { data: role, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", claims.sub)
        .maybeSingle();

    if (roleError) {
        throw new Error("Unable to verify administrator access.");
    }

    if (role?.role !== "admin") {
        redirect("/member");
    }

    return supabase;
}