"use client";

import { useState, useTransition } from "react";
import type { SyntheticEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    createCategoryAction,
    updateCategoryAction,
} from "../actions/category-actions";
import type { CategoryRecord } from "../services/category-service";

type CategoryFormProps = {
    category?: Pick<
        CategoryRecord,
        "id" | "name" | "description" | "parent_id"
    >;
    parentCategories: Pick<CategoryRecord, "id" | "name">[];
};

export function CategoryForm({
    category,
    parentCategories,
}: CategoryFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const isEditing = Boolean(category);

    const [isSubcategory, setIsSubcategory] = useState(
        Boolean(category?.parent_id)
    );

    const [selectedParentId, setSelectedParentId] = useState(
        category?.parent_id ?? ""
    );

    function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            const result = category
                ? await updateCategoryAction(category.id, formData)
                : await createCategoryAction(formData);

            if (!result.success) {
                setError(result.error);
                return;
            }

            router.push("/admin/categories");
            router.refresh();
        });
    }

    const cardClass = (selected: boolean) =>
        `relative flex w-full cursor-pointer flex-col rounded-xl border-2 p-5 text-left transition-colors ${selected
            ? "border-gray-900 bg-gray-50"
            : "border-gray-200 bg-white hover:border-gray-400"
        }`;

    return (
        <section aria-labelledby="category-form-heading">
            <div className="mb-6">
                <h1
                    id="category-form-heading"
                    className="text-2xl font-semibold text-gray-900"
                >
                    {isEditing ? "Edit category" : "Add category"}
                </h1>

                <p className="mt-1 text-sm text-gray-600">
                    {isEditing
                        ? "Update the category details."
                        : "Add a main category or subcategory to organise the equipment catalogue."}
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
                        Category name
                    </label>

                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        maxLength={100}
                        defaultValue={category?.name ?? ""}
                        disabled={isPending}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100"
                        placeholder="e.g. Masks"
                    />
                </div>

                <div>
                    <div className="mb-2 flex items-center gap-1">
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-900"
                        >
                            Description
                        </label>

                        <span className="text-sm font-normal text-gray-500">
                            (optional)
                        </span>
                    </div>

                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        defaultValue={category?.description ?? ""}
                        disabled={isPending}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100"
                        placeholder="Briefly describe this category..."
                    />
                </div>

                <fieldset className="space-y-3">
                    <legend className="mb-3 text-sm font-medium text-gray-900">
                        Category type
                    </legend>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className={cardClass(!isSubcategory)}>
                            <input
                                type="radio"
                                name="categoryType"
                                value="main"
                                checked={!isSubcategory}
                                onChange={() => {
                                    setIsSubcategory(false);
                                    setSelectedParentId("");
                                }}
                                disabled={isPending}
                                className="sr-only"
                            />

                            <span className="mb-4 flex items-center justify-between">
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        className="h-5 w-5 text-gray-700"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.75 6.75A1.5 1.5 0 0 1 5.25 5.25h5.1l2 2h6.4a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-13.5a1.5 1.5 0 0 1-1.5-1.5z"
                                        />
                                    </svg>
                                </span>

                                {isSubcategory ? (
                                    <span className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                ) : (
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="h-5 w-5 text-gray-900"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.78-9.22a.75.75 0 0 0-1.06-1.06L9 11.44 7.28 9.72a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.25-4.25Z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </span>

                            <span className="text-sm font-semibold text-gray-900">
                                Main category
                            </span>

                            <span className="mt-1 text-sm leading-5 text-gray-600">
                                Create a standalone category, such as Equipment or Exposure Protection.
                            </span>
                        </label>

                        <label className={cardClass(isSubcategory)}>
                            <input
                                type="radio"
                                name="categoryType"
                                value="subcategory"
                                checked={isSubcategory}
                                onChange={() => setIsSubcategory(true)}
                                disabled={isPending}
                                className="sr-only"
                            />

                            <span className="mb-4 flex items-center justify-between">
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        className="h-5 w-5 text-gray-700"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.75 6.75A1.5 1.5 0 0 1 5.25 5.25h5.1l2 2h6.4a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-13.5a1.5 1.5 0 0 1-1.5-1.5zM8 12h8m-4-4v8"
                                        />
                                    </svg>
                                </span>

                                {!isSubcategory ? (
                                    <span className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                ) : (
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="h-5 w-5 text-gray-900"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.78-9.22a.75.75 0 0 0-1.06-1.06L9 11.44 7.28 9.72a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.25-4.25Z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </span>

                            <span className="text-sm font-semibold text-gray-900">
                                Subcategory
                            </span>

                            <span className="mt-1 text-sm leading-5 text-gray-600">
                                Create a category under an existing main category.
                            </span>
                        </label>
                    </div>
                </fieldset>

                {isSubcategory && (
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-medium text-gray-900">
                            Select a main category
                        </legend>

                        {parentCategories.length === 0 ? (
                            <p className="text-sm text-gray-600">
                                No main categories are available yet. Create a main category first.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {parentCategories.map((parent) => (
                                    <label
                                        key={parent.id}
                                        className={cardClass(
                                            selectedParentId === parent.id
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="parentCategorySelection"
                                            value={parent.id}
                                            checked={
                                                selectedParentId === parent.id
                                            }
                                            onChange={() =>
                                                setSelectedParentId(parent.id)
                                            }
                                            disabled={isPending}
                                            required
                                            className="sr-only"
                                        />

                                        <span className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-medium text-gray-900">
                                                {parent.name}
                                            </span>

                                            {selectedParentId === parent.id ? (
                                                <svg
                                                    aria-hidden="true"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                    className="h-5 w-5 shrink-0 text-gray-900"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.78-9.22a.75.75 0 0 0-1.06-1.06L9 11.44 7.28 9.72a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.25-4.25Z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            ) : (
                                                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-300" />
                                            )}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </fieldset>
                )}

                <input
                    type="hidden"
                    name="parentId"
                    value={isSubcategory ? selectedParentId : ""}
                />

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                    <Link
                        href="/admin/categories"
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={
                            isPending ||
                            (isSubcategory &&
                                (!selectedParentId ||
                                    parentCategories.length === 0))
                        }
                        className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPending
                            ? "Saving..."
                            : isEditing
                                ? "Save changes"
                                : "Create category"}
                    </button>
                </div>
            </form>
        </section>
    );
}