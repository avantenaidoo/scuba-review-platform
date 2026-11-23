"use client";

import { useState, useTransition } from "react";
import type { SyntheticEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogoUpload } from "./brand-logo-upload";
import {
    createBrandAction,
    updateBrandAction,
} from "@/features/brands/actions/brand-actions";
import type { BrandRecord } from "../services/brand-service";

type BrandFormProps = {
    brand?: Pick<BrandRecord, "id" | "name" | "description">;
    logoUrl?: string | null;
    logoAltText?: string | null;
};

export function BrandForm({ brand , logoUrl = null, logoAltText = null }: BrandFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const isEditing = Boolean(brand);

    function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            if (brand) {
                const result = await updateBrandAction(brand.id, formData);

                if (!result.success) {
                    setError(result.error);
                    return;
                }

                router.push("/admin/brands");
                router.refresh();
                return;
            }

            const result = await createBrandAction(formData);

            if (!result.success) {
                setError(result.error);
                return;
            }

            router.push(`/admin/brands/${result.brandId}`);
            router.refresh();
        });
    }

    return (
        <section aria-labelledby="brand-form-heading">
            <div className="mb-6">
                <h1
                    id="brand-form-heading"
                    className="text-2xl font-semibold text-gray-900"
                >
                    {isEditing ? "Edit brand" : "Add brand"}
                </h1>

                <p className="mt-1 text-sm text-gray-600">
                    {isEditing
                        ? "Update the brand details."
                        : "Add a brand or manufacturer to the equipment catalogue."}
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
            >
                {error && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                <div>
                    <label
                        htmlFor="name"
                        className="mb-2 block text-sm font-medium text-gray-900"
                    >
                        Brand name
                    </label>

                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        defaultValue={brand?.name ?? ""}
                        disabled={isPending}
                        autoComplete="organization"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100"
                        placeholder="e.g. Scubapro"
                    />
                </div>

                <div>
                    <label
                        htmlFor="description"
                        className="mb-2 block text-sm font-medium text-gray-900"
                    >
                        Description
                        <span className="ml-1 font-normal text-gray-500">
                            (optional)
                        </span>
                    </label>

                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        defaultValue={brand?.description ?? ""}
                        disabled={isPending}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100"
                        placeholder="Brief description of the brand..."
                    />
                </div>

                {brand && (
                    <BrandLogoUpload
                        brandId={brand.id}
                        logoUrl={logoUrl}
                        initialAltText={logoAltText}
                    />
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                    <Link
                        href="/admin/brands"
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPending
                            ? "Saving..."
                            : isEditing
                                ? "Save changes"
                                : "Create brand"}
                    </button>
                </div>
            </form>
        </section>
    );
}