import Image from "next/image";
import Link from "next/link";

export type ProductListItem = {
    id: string;
    name: string;
    brandName: string;
    categoryName: string;
    modelNumber: string | null;
    isActive: boolean;
    isPublished: boolean;
    mainImageUrl: string | null;
};

type ProductListProps = {
    products: ProductListItem[];
};

export function ProductList({ products }: ProductListProps) {
    return (
        <section>
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Products
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Add and manage scuba equipment products, specifications
                        and images.
                    </p>
                </div>

                <Link
                    href="/admin/products/new"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                    Add product
                </Link>
            </header>

            <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
                {products.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <h2 className="font-medium text-gray-900">
                            No products yet
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Add your first product to start building the
                            equipment catalogue.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th scope="col" className="px-6 py-4">
                                        Product
                                    </th>
                                    <th scope="col" className="px-6 py-4">
                                        Brand
                                    </th>
                                    <th scope="col" className="px-6 py-4">
                                        Category
                                    </th>
                                    <th scope="col" className="px-6 py-4">
                                        Publication
                                    </th>
                                    <th scope="col" className="px-6 py-4">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-4">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {product.mainImageUrl ? (
                                                    <Image
                                                        src={product.mainImageUrl}
                                                        alt=""
                                                        width={48}
                                                        height={48}
                                                        className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div
                                                        aria-hidden="true"
                                                        className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400"
                                                    >
                                                        No image
                                                    </div>
                                                )}

                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {product.name}
                                                    </p>
                                                    {product.modelNumber && (
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {product.modelNumber}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-gray-700">
                                            {product.brandName}
                                        </td>

                                        <td className="px-6 py-4 text-gray-700">
                                            {product.categoryName}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={
                                                    product.isPublished
                                                        ? "text-green-700"
                                                        : "text-gray-500"
                                                }
                                            >
                                                {product.isPublished
                                                    ? "Published"
                                                    : "Draft"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={
                                                    product.isActive
                                                        ? "text-green-700"
                                                        : "text-gray-500"
                                                }
                                            >
                                                {product.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/products/${product.id}`}
                                                aria-label={`Edit ${product.name}`}
                                                className="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600"
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
            </div>

            <p className="mt-4 text-sm text-gray-500">
                {products.length}{" "}
                {products.length === 1 ? "product" : "products"}
            </p>
        </section>
    );
}