"use client";

import {
    useState,
    useTransition,
    type SyntheticEvent,
} from "react";
import { useRouter } from "next/navigation";

import {
    createProductAction,
    updateProductAction,
} from "@/features/products/actions/product-actions";

import {
    saveProductSpecificationsAction,
} from "@/features/products/actions/save-product-specifications-action";

import {
    ProductSpecificationsEditor,
    type InitialProductSpecification,
    type ProductSpecificationDraft,
} from "@/features/products/components/product-specifications-editor";

import { ProductImageUpload } from "@/features/products/components/product-image-upload";

import type {
    ProductImageWithUrl,
} from "@/features/products/services/product-image-service";

import type { Database } from "@/lib/supabase/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"];

type BrandOption = Pick<
    Database["public"]["Tables"]["brands"]["Row"],
    "id" | "name"
>;

type CategoryOption = Pick<
    Database["public"]["Tables"]["categories"]["Row"],
    "id" | "name" | "parent_id"
>;

type ProductFormProps = {
    product?: Product | null;
    brands: BrandOption[];
    categories: CategoryOption[];
    initialSpecifications?: InitialProductSpecification[];
    initialImages?: ProductImageWithUrl[];
};

const inputClasses =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

const labelClasses =
    "mb-2 block text-sm font-medium text-gray-700";

export function ProductForm({
    product,
    brands,
    categories,
    initialSpecifications = [],
    initialImages = [],
}: ProductFormProps) {
    const router = useRouter();

    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [categoryId, setCategoryId] = useState(
        product?.category_id ?? ""
    );

    const [subcategoryId, setSubcategoryId] = useState(
        product?.subcategory_id ?? ""
    );

    const [currentProductId, setCurrentProductId] = useState<string | null>(
        product?.id ?? null
    );

    const [specifications, setSpecifications] = useState<
        ProductSpecificationDraft[]
    >([]);

    const [specificationsChanged, setSpecificationsChanged] =
        useState(false);

    const mainCategories = categories.filter(
        (category) => category.parent_id === null
    );

    const subcategories = categories.filter(
        (category) => category.parent_id === categoryId
    );

    function handleCategoryChange(value: string) {
        setCategoryId(value);
        setSubcategoryId("");
    }

    function handleSubmit(
        event: SyntheticEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            const result = currentProductId
                ? await updateProductAction(currentProductId, formData)
                : await createProductAction(formData);

            if (!result.success) {
                setError(result.error);
                return;
            }

            const productId = result.productId ?? currentProductId;

            if (!productId) {
                setError(
                    "The product was saved, but its ID could not be retrieved."
                );
                return;
            }

            setCurrentProductId(productId);

            if (specificationsChanged) {
                const specificationsResult =
                    await saveProductSpecificationsAction(
                        productId,
                        specifications
                    );

                if (!specificationsResult.success) {
                    setError(specificationsResult.error);
                    return;
                }

                setSpecificationsChanged(false);
            }

            if (!currentProductId) {
                router.push(`/admin/products/${productId}`);
            }

            router.refresh();
        });
    }

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                    {product ? "Edit product" : "Create product"}
                </h1>

                <p className="mt-1 text-sm text-gray-600">
                    {product
                        ? "Update the product details and specifications."
                        : "Add a product and its specifications to the equipment catalogue."}
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                {error && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                <section className="space-y-5">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Product details
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                            Enter the product&apos;s basic information.
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="name"
                            className={labelClasses}
                        >
                            Product name
                        </label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            maxLength={150}
                            defaultValue={product?.name ?? ""}
                            disabled={isPending}
                            placeholder="Enter product name"
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="brand_id"
                            className={labelClasses}
                        >
                            Brand
                        </label>

                        <select
                            id="brand_id"
                            name="brand_id"
                            required
                            defaultValue={product?.brand_id ?? ""}
                            disabled={isPending}
                            className={inputClasses}
                        >
                            <option value="" disabled>
                                Select a brand
                            </option>

                            {brands.map((brand) => (
                                <option
                                    key={brand.id}
                                    value={brand.id}
                                >
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="category_id"
                            className={labelClasses}
                        >
                            Main category
                        </label>

                        <select
                            id="category_id"
                            name="category_id"
                            required
                            value={categoryId}
                            onChange={(event) =>
                                handleCategoryChange(event.target.value)
                            }
                            disabled={isPending}
                            className={inputClasses}
                        >
                            <option value="" disabled>
                                Select a main category
                            </option>

                            {mainCategories.map((category) => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="subcategory_id"
                            className={labelClasses}
                        >
                            Subcategory
                            <span className="ml-1 font-normal text-gray-500">
                                (optional)
                            </span>
                        </label>

                        <select
                            id="subcategory_id"
                            name="subcategory_id"
                            value={subcategoryId}
                            onChange={(event) =>
                                setSubcategoryId(event.target.value)
                            }
                            disabled={
                                isPending ||
                                !categoryId ||
                                subcategories.length === 0
                            }
                            className={inputClasses}
                        >
                            <option value="">
                                No subcategory
                            </option>

                            {subcategories.map((subcategory) => (
                                <option
                                    key={subcategory.id}
                                    value={subcategory.id}
                                >
                                    {subcategory.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="model_number"
                            className={labelClasses}
                        >
                            Model number
                            <span className="ml-1 font-normal text-gray-500">
                                (optional)
                            </span>
                        </label>

                        <input
                            id="model_number"
                            name="model_number"
                            type="text"
                            maxLength={100}
                            defaultValue={product?.model_number ?? ""}
                            disabled={isPending}
                            placeholder="Enter model number"
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className={labelClasses}
                        >
                            Description
                            <span className="ml-1 font-normal text-gray-500">
                                (optional)
                            </span>
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            rows={5}
                            maxLength={5000}
                            defaultValue={product?.description ?? ""}
                            disabled={isPending}
                            placeholder="Enter product description"
                            className={`${inputClasses} resize-y`}
                        />
                    </div>
                </section>

                <div className="border-t border-gray-200 pt-6">
                    <ProductSpecificationsEditor
                        initialSpecifications={initialSpecifications}
                        onChange={(updatedSpecifications) => {
                            setSpecifications(updatedSpecifications);
                            setSpecificationsChanged(true);
                        }}
                        disabled={isPending}
                    />
                </div>

                <div className="border-t border-gray-200 pt-6">
                    {currentProductId ? (
                        <ProductImageUpload
                            productId={currentProductId}
                            mainImage={
                                initialImages.find((image) => image.is_primary) ?? null
                            }
                            galleryImages={initialImages.filter(
                                (image) => !image.is_primary
                            )}
                            disabled={isPending}
                        />
                    ) : (
                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Product images
                            </h2>

                            <p className="text-sm text-gray-600">
                                Save the product first. You can then upload its main image
                                and gallery images.
                            </p>
                        </section>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => router.push("/admin/products")}
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isPending
                            ? "Saving..."
                            : product
                                ? "Save changes"
                                : "Create product"}
                    </button>
                </div>
            </form>
        </section>
    );
}