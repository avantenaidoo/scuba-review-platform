import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ProductForm } from "@/features/products/components/product-form";
import type {
    InitialProductSpecification,
} from "@/features/products/components/product-specifications-editor";

import type {
    ProductImageWithUrl,
} from "@/features/products/services/product-image-service";

import type { Database } from "@/lib/supabase/database.types";

const mocks = vi.hoisted(() => ({
    createProductAction: vi.fn(),
    updateProductAction: vi.fn(),
    saveProductSpecificationsAction: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mocks.push,
        refresh: mocks.refresh,
    }),
}));

vi.mock("@/features/products/actions/product-actions", () => ({
    createProductAction: mocks.createProductAction,
    updateProductAction: mocks.updateProductAction,
}));

vi.mock("@/features/products/actions/save-product-specifications-action", () => ({
    saveProductSpecificationsAction: mocks.saveProductSpecificationsAction,
}));

vi.mock("@/features/products/components/product-image-upload", () => ({
    ProductImageUpload: ({
        productId,
        mainImage,
        galleryImages,
    }: {
        productId: string;
        mainImage: { id: string } | null;
        galleryImages: { id: string }[];
    }) => (
        <div
            data-testid="product-image-upload"
            data-product-id={productId}
            data-main-image-id={mainImage?.id ?? ""}
            data-gallery-image-ids={galleryImages
                .map((image) => image.id)
                .join(",")}
        />
    ),
}));

type Product = Database["public"]["Tables"]["products"]["Row"];

type BrandOption = Pick<
    Database["public"]["Tables"]["brands"]["Row"],
    "id" | "name"
>;

type CategoryOption = Pick<
    Database["public"]["Tables"]["categories"]["Row"],
    "id" | "name" | "parent_id"
>;

const brands: BrandOption[] = [
    {
        id: "brand-1",
        name: "Aqua Lung",
    },
    {
        id: "brand-2",
        name: "Suunto",
    },
];

const categories: CategoryOption[] = [
    {
        id: "category-1",
        name: "Regulators",
        parent_id: null,
    },
    {
        id: "category-2",
        name: "Dive Computers",
        parent_id: null,
    },
    {
        id: "subcategory-1",
        name: "First Stages",
        parent_id: "category-1",
    },
    {
        id: "subcategory-2",
        name: "Second Stages",
        parent_id: "category-1",
    },
    {
        id: "subcategory-3",
        name: "Wrist Computers",
        parent_id: "category-2",
    },
];

const product: Product = {
    id: "product-1",
    brand_id: "brand-1",
    category_id: "category-1",
    subcategory_id: "subcategory-1",
    name: "Legend Regulator",
    slug: "legend-regulator",
    model_number: "LEGEND-001",
    description: "A scuba regulator.",
    is_active: true,
    is_published: false,
    published_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
};

const initialSpecifications: InitialProductSpecification[] = [
    {
        id: "spec-1",
        name: "First-stage type",
        value: "Diaphragm",
        sort_order: 0,
    },
    {
        id: "spec-2",
        name: "Number of ports",
        value: 4,
        sort_order: 1,
    },
];

const initialImages: ProductImageWithUrl[] = [
    {
        id: "image-main-1",
        product_id: "product-1",
        storage_path: "product-1/main.webp",
        alt_text: "Regulator front view",
        mime_type: "image/webp",
        file_size_bytes: 1024,
        width: 800,
        height: 600,
        image_type: "main",
        is_primary: true,
        sort_order: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        url: "https://example.com/main.webp",
    },
    {
        id: "image-gallery-1",
        product_id: "product-1",
        storage_path: "product-1/gallery.webp",
        alt_text: "Regulator side view",
        mime_type: "image/webp",
        file_size_bytes: 2048,
        width: 800,
        height: 600,
        image_type: "gallery",
        is_primary: false,
        sort_order: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        url: "https://example.com/gallery.webp",
    },
];

function renderProductForm(
    existingProduct?: Product,
    specifications: InitialProductSpecification[] = [],
    images: ProductImageWithUrl[] = []
) {
    return render(
        <ProductForm
            product={existingProduct}
            brands={brands}
            categories={categories}
            initialSpecifications={specifications}
            initialImages={images}
        />
    );
}

function fillRequiredFields() {
    fireEvent.change(screen.getByLabelText("Product name"), {
        target: { value: "Legend Regulator" },
    });

    fireEvent.change(screen.getByLabelText("Brand"), {
        target: { value: "brand-1" },
    });

    fireEvent.change(screen.getByLabelText("Main category"), {
        target: { value: "category-1" },
    });
}

describe("ProductForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.saveProductSpecificationsAction.mockResolvedValue({
            success: true,
        });
    });

    it("renders the create product form", () => {
        renderProductForm();

        expect(
            screen.getByRole("heading", { name: "Create product" })
        ).toBeTruthy();

        expect(screen.getByLabelText("Product name")).toBeTruthy();
        expect(screen.getByLabelText("Brand")).toBeTruthy();
        expect(screen.getByLabelText("Main category")).toBeTruthy();
        expect(screen.getByLabelText(/Subcategory/)).toBeTruthy();
        expect(screen.getByLabelText(/Model number/)).toBeTruthy();
        expect(screen.getByLabelText(/Description/)).toBeTruthy();

        expect(
            screen.getByRole("heading", { name: "Specifications" })
        ).toBeTruthy();

        expect(
            screen.getByRole("button", { name: "Create product" })
        ).toBeTruthy();
    });

    it("displays instructions to save a new product before uploading images", () => {
        renderProductForm();

        expect(
            screen.getByRole("heading", { name: "Product images" })
        ).toBeTruthy();

        expect(
            screen.getByText(
                "Save the product first. You can then upload its main image and gallery images."
            )
        ).toBeTruthy();

        expect(
            screen.queryByTestId("product-image-upload")
        ).toBeNull();
    });

    it("passes the existing main and gallery images to the image upload component", () => {
        renderProductForm(product, [], initialImages);

        const imageUpload = screen.getByTestId("product-image-upload");

        expect(imageUpload.getAttribute("data-product-id")).toBe("product-1");

        expect(imageUpload.getAttribute("data-main-image-id")).toBe(
            "image-main-1"
        );

        expect(imageUpload.getAttribute("data-gallery-image-ids")).toBe(
            "image-gallery-1"
        );
    });

    it("displays the available brands and main categories", () => {
        renderProductForm();

        expect(
            screen.getByRole("option", { name: "Aqua Lung" })
        ).toBeTruthy();

        expect(
            screen.getByRole("option", { name: "Suunto" })
        ).toBeTruthy();

        expect(
            screen.getByRole("option", { name: "Regulators" })
        ).toBeTruthy();

        expect(
            screen.getByRole("option", { name: "Dive Computers" })
        ).toBeTruthy();

        expect(
            screen.queryByRole("option", { name: "First Stages" })
        ).toBeNull();
    });

    it("displays only subcategories belonging to the selected main category", () => {
        renderProductForm();

        fireEvent.change(screen.getByLabelText("Main category"), {
            target: { value: "category-1" },
        });

        expect(
            screen.getByRole("option", { name: "First Stages" })
        ).toBeTruthy();

        expect(
            screen.getByRole("option", { name: "Second Stages" })
        ).toBeTruthy();

        expect(
            screen.queryByRole("option", { name: "Wrist Computers" })
        ).toBeNull();
    });

    it("clears the subcategory when the main category changes", async () => {
        mocks.createProductAction.mockResolvedValue({
            success: true,
            productId: "product-1",
        });

        renderProductForm();

        fillRequiredFields();

        fireEvent.change(screen.getByLabelText(/Subcategory/), {
            target: { value: "subcategory-1" },
        });

        fireEvent.change(screen.getByLabelText("Main category"), {
            target: { value: "category-2" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Create product" })
        );

        await waitFor(() => {
            expect(mocks.createProductAction).toHaveBeenCalledTimes(1);
        });

        const submittedFormData =
            mocks.createProductAction.mock.calls[0][0];

        expect(submittedFormData.get("category_id")).toBe("category-2");
        expect(submittedFormData.get("subcategory_id")).toBe("");
    });

    it("creates a product and navigates after success", async () => {
        mocks.createProductAction.mockResolvedValue({
            success: true,
            productId: "product-1",
        });

        renderProductForm();

        fillRequiredFields();

        fireEvent.change(screen.getByLabelText(/Subcategory/), {
            target: { value: "subcategory-1" },
        });

        fireEvent.change(screen.getByLabelText(/Model number/), {
            target: { value: "LEGEND-001" },
        });

        fireEvent.change(screen.getByLabelText(/Description/), {
            target: { value: "A scuba regulator." },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Create product" })
        );

        await waitFor(() => {
            expect(mocks.createProductAction).toHaveBeenCalledTimes(1);
        });

        const submittedFormData =
            mocks.createProductAction.mock.calls[0][0];

        expect(submittedFormData.get("name")).toBe("Legend Regulator");
        expect(submittedFormData.get("brand_id")).toBe("brand-1");
        expect(submittedFormData.get("category_id")).toBe("category-1");
        expect(submittedFormData.get("subcategory_id")).toBe("subcategory-1");
        expect(submittedFormData.get("model_number")).toBe("LEGEND-001");
        expect(submittedFormData.get("description")).toBe("A scuba regulator.");

        await waitFor(() => {
            expect(mocks.push).toHaveBeenCalledWith("/admin/products/product-1");
            expect(mocks.refresh).toHaveBeenCalledTimes(1);
        });

        expect(
            mocks.saveProductSpecificationsAction
        ).not.toHaveBeenCalled();
    });

    it("creates a product and saves its new specifications", async () => {
        mocks.createProductAction.mockResolvedValue({
            success: true,
            productId: "product-1",
        });

        renderProductForm();

        fillRequiredFields();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Add specification",
            })
        );

        fireEvent.change(
            screen.getByLabelText("Specification name"),
            {
                target: { value: "First-stage type" },
            }
        );

        fireEvent.change(
            screen.getByLabelText("Value"),
            {
                target: { value: "Balanced diaphragm" },
            }
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Create product" })
        );

        await waitFor(() => {
            expect(
                mocks.saveProductSpecificationsAction
            ).toHaveBeenCalledWith("product-1", [
                {
                    name: "First-stage type",
                    value: "Balanced diaphragm",
                    sort_order: 0,
                },
            ]);
        });

        await waitFor(() => {
            expect(mocks.push).toHaveBeenCalledWith("/admin/products/product-1");
        });
    });

    it("updates an existing product and navigates after success", async () => {
        mocks.updateProductAction.mockResolvedValue({
            success: true,
            productId: "product-1",
        });

        renderProductForm(product);

        expect(
            screen.getByRole("heading", { name: "Edit product" })
        ).toBeTruthy();

        fireEvent.click(
            screen.getByRole("button", { name: "Save changes" })
        );

        await waitFor(() => {
            expect(mocks.updateProductAction).toHaveBeenCalledTimes(1);
        });

        const [submittedId, submittedFormData] =
            mocks.updateProductAction.mock.calls[0];

        expect(submittedId).toBe("product-1");
        expect(submittedFormData.get("name")).toBe("Legend Regulator");
        expect(submittedFormData.get("brand_id")).toBe("brand-1");
        expect(submittedFormData.get("category_id")).toBe("category-1");
        expect(submittedFormData.get("subcategory_id")).toBe("subcategory-1");
        expect(submittedFormData.get("model_number")).toBe("LEGEND-001");
        expect(submittedFormData.get("description")).toBe("A scuba regulator.");

        await waitFor(() => {
            expect(mocks.push).not.toHaveBeenCalled();
            expect(mocks.refresh).toHaveBeenCalledTimes(1);
        });
    });

    it("loads existing specifications and saves their IDs when edited", async () => {
        mocks.updateProductAction.mockResolvedValue({
            success: true,
            productId: "product-1",
        });

        renderProductForm(product, initialSpecifications);

        expect(
            screen.getByDisplayValue("First-stage type")
        ).toBeTruthy();

        expect(
            screen.getByDisplayValue("Diaphragm")
        ).toBeTruthy();

        expect(
            screen.getByDisplayValue("Number of ports")
        ).toBeTruthy();

        expect(
            screen.getByDisplayValue("4")
        ).toBeTruthy();

        fireEvent.change(
            screen.getAllByLabelText("Value")[0],
            {
                target: {
                    value: "Balanced diaphragm",
                },
            }
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Save changes" })
        );

        await waitFor(() => {
            expect(
                mocks.saveProductSpecificationsAction
            ).toHaveBeenCalledWith("product-1", [
                {
                    id: "spec-1",
                    name: "First-stage type",
                    value: "Balanced diaphragm",
                    sort_order: 0,
                },
                {
                    id: "spec-2",
                    name: "Number of ports",
                    value: "4",
                    sort_order: 1,
                },
            ]);
        });

        await waitFor(() => {
            expect(mocks.push).not.toHaveBeenCalled();
            expect(mocks.refresh).toHaveBeenCalledTimes(1);
        });
    });

    it("displays an error when product creation fails", async () => {
        mocks.createProductAction.mockResolvedValue({
            success: false,
            error: "Unable to create the product.",
        });

        renderProductForm();

        fillRequiredFields();

        fireEvent.click(
            screen.getByRole("button", { name: "Create product" })
        );

        expect(
            await screen.findByRole("alert")
        ).toBeTruthy();

        expect(screen.getByRole("alert").textContent).toBe(
            "Unable to create the product."
        );

        expect(mocks.push).not.toHaveBeenCalled();
        expect(mocks.refresh).not.toHaveBeenCalled();
    });

    it("displays an error when saving specifications fails", async () => {
        mocks.createProductAction.mockResolvedValue({
            success: true,
            productId: "product-1",
        });

        mocks.saveProductSpecificationsAction.mockResolvedValue({
            success: false,
            error: "Unable to save product specifications.",
        });

        renderProductForm();

        fillRequiredFields();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Add specification",
            })
        );

        fireEvent.change(
            screen.getByLabelText("Specification name"),
            {
                target: { value: "First-stage type" },
            }
        );

        fireEvent.change(
            screen.getByLabelText("Value"),
            {
                target: { value: "Balanced diaphragm" },
            }
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Create product" })
        );

        expect(
            await screen.findByRole("alert")
        ).toBeTruthy();

        expect(screen.getByRole("alert").textContent).toBe(
            "Unable to save product specifications."
        );

        expect(mocks.push).not.toHaveBeenCalled();
        expect(mocks.refresh).not.toHaveBeenCalled();
    });

    it("returns to the products page when Cancel is clicked", () => {
        renderProductForm();

        fireEvent.click(
            screen.getByRole("button", { name: "Cancel" })
        );

        expect(mocks.push).toHaveBeenCalledWith("/admin/products");
        expect(mocks.refresh).not.toHaveBeenCalled();
    });
});
