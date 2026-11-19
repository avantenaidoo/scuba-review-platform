import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireBrandAdmin } from "@/features/brands/services/brand-admin";
import { BrandForm } from "@/features/brands/components/brand-form";

async function NewBrandContent() {
    await connection();
    await requireBrandAdmin();

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
                        {" / Add brand"}
                    </p>
                </div>

                <BrandForm />
            </div>
        </main>
    );
}

export default function NewBrandPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-gray-50 px-6 py-12">
                    <div className="mx-auto max-w-3xl">
                        Loading...
                    </div>
                </main>
            }
        >
            <NewBrandContent />
        </Suspense>
    );
}