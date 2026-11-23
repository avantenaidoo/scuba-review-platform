import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
    ProductList,
    type ProductListItem,
} from "@/features/products/components/product-list";

vi.mock("next/image", () => ({
    default: ({
        alt,
        src,
        ...props
    }: {
        alt: string;
        src: string;
        [key: string]: unknown;
    }) => (
        <div
            role="img"
            aria-label={alt || "Product image"}
            data-src={src}
            {...props}
        />
    ),
}));

const products: ProductListItem[] = [
    {
        id: "product-1",
        name: "Apeks XTX50",
        brandName: "Apeks",
        categoryName: "Regulators",
        modelNumber: "XTX50",
        isActive: true,
        isPublished: true,
        mainImageUrl: "https://example.com/xtx50.webp",
    },
    {
        id: "product-2",
        name: "Shearwater Peregrine",
        brandName: "Shearwater",
        categoryName: "Dive Computers",
        modelNumber: null,
        isActive: true,
        isPublished: false,
        mainImageUrl: null,
    },
];

describe("ProductList", () => {
    it("renders the products heading and description", () => {
        render(<ProductList products={products} />);

        expect(
            screen.getByRole("heading", { name: "Products" })
        ).toBeInTheDocument();

        expect(
            screen.getByText(/Add and manage scuba equipment products/i)
        ).toBeInTheDocument();
    });

    it("renders the Add product link", () => {
        render(<ProductList products={products} />);

        expect(
            screen.getByRole("link", { name: "Add product" })
        ).toHaveAttribute("href", "/admin/products/new");
    });

    it("renders product details", () => {
        render(<ProductList products={products} />);

        expect(screen.getByText("Apeks XTX50")).toBeInTheDocument();
        expect(screen.getByText("Shearwater Peregrine")).toBeInTheDocument();
        expect(screen.getByText("XTX50")).toBeInTheDocument();
        expect(screen.getByText("Apeks")).toBeInTheDocument();
        expect(screen.getByText("Shearwater")).toBeInTheDocument();
        expect(screen.getByText("Regulators")).toBeInTheDocument();
        expect(screen.getByText("Dive Computers")).toBeInTheDocument();
    });

    it("displays publication and active statuses", () => {
        render(<ProductList products={products} />);

        expect(screen.getByText("Published")).toBeInTheDocument();
        expect(screen.getByText("Draft")).toBeInTheDocument();
        expect(screen.getAllByText("Active")).toHaveLength(2);
    });

    it("renders an edit link for each product", () => {
        render(<ProductList products={products} />);

        expect(
            screen.getByRole("link", { name: "Edit Apeks XTX50" })
        ).toHaveAttribute("href", "/admin/products/product-1");

        expect(
            screen.getByRole("link", {
                name: "Edit Shearwater Peregrine",
            })
        ).toHaveAttribute("href", "/admin/products/product-2");
    });

    it("renders the main product image when available", () => {
        render(<ProductList products={products} />);

        const image = screen.getByRole("img", {
            name: "Product image",
        });

        expect(image).toHaveAttribute(
            "data-src",
            "https://example.com/xtx50.webp"
        );
    });

    it("displays an empty state when there are no products", () => {
        render(<ProductList products={[]} />);

        expect(
            screen.getByRole("heading", { name: "No products yet" })
        ).toBeInTheDocument();

        expect(
            screen.getByText(/Add your first product/i)
        ).toBeInTheDocument();

        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("displays the product count", () => {
        render(<ProductList products={products} />);

        expect(screen.getByText("2 products")).toBeInTheDocument();
    });

    it("uses singular product count for one product", () => {
        render(<ProductList products={[products[0]]} />);

        expect(screen.getByText("1 product")).toBeInTheDocument();
    });
});
