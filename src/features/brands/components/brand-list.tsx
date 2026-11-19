import Link from "next/link";
import type { BrandRecord } from "../services/brand-service";
import { BrandStatusControl } from "./brand-status-control";

type BrandListProps = {
    brands: BrandRecord[];
};

export function BrandList({ brands }: BrandListProps) {
    return (
        <section aria-labelledby="brands-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1
                        id="brands-heading"
                        className="text-2xl font-semibold text-gray-900"
                    >
                        Brands
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage equipment brands and manufacturers.
                    </p>
                </div>

                <Link
                    href="/admin/brands/new"
                    className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                >
                    Add brand
                </Link>
            </div>

            {brands.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                    <h2 className="text-base font-semibold text-gray-900">
                        No brands yet
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Add your first brand to start building the equipment catalogue.
                    </p>
                    <Link
                        href="/admin/brands/new"
                        className="mt-4 inline-flex text-sm font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600"
                    >
                        Add your first brand
                    </Link>
                </div>
            ) : (
                <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                                >
                                    Brand
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                                >
                                    Description
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                                >
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200">
                            {brands.map((brand) => (
                                <tr key={brand.id}>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            {brand.name}
                                        </div>
                                        <div className="mt-1 text-sm text-gray-500">
                                            {brand.slug}
                                        </div>
                                    </td>

                                    <td className="max-w-sm px-6 py-4 text-sm text-gray-600">
                                        {brand.description || "—"}
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span
                                            className={
                                                brand.is_active
                                                    ? "inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                                                    : "inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                                            }
                                        >
                                            {brand.is_active ? "Active" : "Inactive"}
                                        </span>

                                        <BrandStatusControl
                                            id={brand.id}
                                            name={brand.name}
                                            isActive={brand.is_active}
                                        />
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                        <Link
                                            href={`/admin/brands/${brand.id}`}
                                            className="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600"
                                            aria-label={`Edit ${brand.name}`}
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}