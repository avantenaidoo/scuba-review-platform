import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBrands } from "@/features/brands/services/brand-service";
import { BrandList } from "@/features/brands/components/brand-list";

async function BrandsContent() {
    await connection();

    const supabase = await createClient();

    // Verify the signed-in user.
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        redirect("/login");
    }

    // Verify administrator permissions on the server.
    const { data: roleRecord, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

    if (roleError || !roleRecord) {
        throw new Error("Unable to verify administrator permissions.");
    }

    if (roleRecord.role !== "admin") {
        redirect("/member");
    }

    // Retrieve brands only after authorization succeeds.
    let brands;

    try {
        brands = await getBrands(supabase);
    } catch {
        throw new Error("Unable to load brands. Please try again.");
    }

    return (
        <div className="mx-auto max-w-6xl">
            <div className="mb-8">
                <p className="text-sm text-gray-500">
                    <a
                        href="/admin"
                        className="underline underline-offset-4 hover:text-gray-900"
                    >
                        Admin dashboard
                    </a>
                    {" / "}Brands
                </p>
            </div>

            <BrandList brands={brands} />
        </div>
    );
}

export default function AdminBrandsPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12">
            <Suspense
                fallback={
                    <p className="text-center text-gray-600">
                        Loading brands...
                    </p>
                }
            >
                <BrandsContent />
            </Suspense>
        </main>
    );
}