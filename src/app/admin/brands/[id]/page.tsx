import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireBrandAdmin } from "@/features/brands/services/brand-admin";
import { getBrandById } from "@/features/brands/services/brand-service";
import { BrandForm } from "@/features/brands/components/brand-form";

type EditBrandPageProps = {
    params: Promise<{ id: string }>;
};

async function EditBrandContent({ params }: EditBrandPageProps) {
    await connection();

    const { id } = await params;
    const supabase = await requireBrandAdmin();

    const brand = await getBrandById(supabase, id);

    if (!brand) {
        notFound();
    }

    let logoUrl: string | null = null;

    if (brand.logo_path) {
        const { data: signedUrlData } = await supabase.storage
            .from("brand-logos")
            .createSignedUrl(brand.logo_path, 3600);

        logoUrl = signedUrlData?.signedUrl ?? null;
    }

    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8">
                    <p className="text-sm text-gray-500">
                        <Link
                            href="/admin"
                            className="underline underline-offset-4 hover:text-gray-900"
                        >
                            Admin dashboard
                        </Link>
                        {" / "}
                        <Link
                            href="/admin/brands"
                            className="underline underline-offset-4 hover:text-gray-900"
                        >
                            Brands
                        </Link>
                        {" / "}
                        Edit brand
                    </p>
                </div>

                <BrandForm
                    brand={{
                        id: brand.id,
                        name: brand.name,
                        description: brand.description,
                    }}
                    logoUrl={logoUrl}
                    logoAltText={brand.logo_alt_text}
                />
            </div>
        </main>
    );
}

export default function EditBrandPage({ params }: EditBrandPageProps) {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-gray-50 px-6 py-12">
                    <div className="mx-auto max-w-3xl">
                        Loading brand...
                    </div>
                </main>
            }
        >
            <EditBrandContent params={params} />
        </Suspense>
    );
}