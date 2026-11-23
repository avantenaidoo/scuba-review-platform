import Link from "next/link";
import type { CategoryRecord } from "../services/category-service";
import { CategoryStatusControl } from "./category-status-control";

type CategoryListProps = {
    categories: CategoryRecord[];
};

export function CategoryList({ categories }: CategoryListProps) {
    const categoryNames = new Map(
        categories.map((category) => [category.id, category.name])
    );

    return (
        <section aria-labelledby="categories-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1
                        id="categories-heading"
                        className="text-2xl font-semibold text-gray-900"
                    >
                        Categories
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage equipment categories and subcategories.
                    </p>
                </div>

                <Link
                    href="/admin/categories/new"
                    className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                >
                    Add category
                </Link>
            </div>

            {categories.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                    <h2 className="text-base font-semibold text-gray-900">
                        No categories yet
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Add your first category to start organising the equipment catalogue.
                    </p>
                    <Link
                        href="/admin/categories/new"
                        className="mt-4 inline-flex text-sm font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600"
                    >
                        Add your first category
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
                                    Category
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                                >
                                    Main category
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
                            {categories.map((category) => (
                                <tr key={category.id}>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            {category.name}
                                        </div>
                                        <div className="mt-1 text-sm text-gray-500">
                                            {category.slug}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {category.parent_id
                                            ? categoryNames.get(
                                                category.parent_id
                                            ) ?? "Unknown"
                                            : "—"}
                                    </td>

                                    <td className="max-w-sm px-6 py-4 text-sm text-gray-600">
                                        {category.description || "—"}
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span
                                            className={
                                                category.is_active
                                                    ? "inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                                                    : "inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                                            }
                                        >
                                            {category.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </span>

                                        <CategoryStatusControl
                                            categoryId={category.id}
                                            isActive={category.is_active}
                                        />
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                        <Link
                                            href={`/admin/categories/${category.id}`}
                                            className="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600"
                                            aria-label={`Edit ${category.name}`}
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