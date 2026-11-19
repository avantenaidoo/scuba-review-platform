import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BrandList } from "@/features/brands/components/brand-list";
import type { BrandRecord } from "@/features/brands/services/brand-service";

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        refresh: vi.fn(),
    }),
}));

const brands: BrandRecord[] = [
    {
        id: "brand-1",
        name: "Aqua Lung",
        slug: "aqua-lung",
        description: "Diving equipment manufacturer",
        logo_path: null,
        logo_alt_text: null,
        logo_mime_type: null,
        logo_size_bytes: null,
        is_active: true,
        created_at: "2026-11-19T10:00:00.000Z",
        updated_at: "2026-11-19T10:00:00.000Z",
    },
    {
        id: "brand-2",
        name: "Scubapro",
        slug: "scubapro",
        description: null,
        logo_path: null,
        logo_alt_text: null,
        logo_mime_type: null,
        logo_size_bytes: null,
        is_active: false,
        created_at: "2026-11-19T10:00:00.000Z",
        updated_at: "2026-11-19T10:00:00.000Z",
    },
];

describe("BrandList", () => {
    it("renders the empty state when there are no brands", () => {
        render(<BrandList brands={[]} />);

        expect(
            screen.getByRole("heading", { name: "Brands" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", { name: "No brands yet" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("link", { name: "Add your first brand" })
        ).toHaveAttribute("href", "/admin/brands/new");
    });

    it("renders each brand and its status", () => {
        render(<BrandList brands={brands} />);

        expect(screen.getByText("Aqua Lung")).toBeInTheDocument();
        expect(screen.getByText("Scubapro")).toBeInTheDocument();
        expect(screen.getByText("Diving equipment manufacturer")).toBeInTheDocument();

        const table = screen.getByRole("table");
        expect(within(table).getAllByText("Active")).toHaveLength(1);
        expect(within(table).getAllByText("Inactive")).toHaveLength(1);
    });

    it("shows a dash when a brand has no description", () => {
        render(<BrandList brands={brands} />);

        const table = screen.getByRole("table");
        expect(within(table).getByText("—")).toBeInTheDocument();
    });

    it("links each brand to its edit route", () => {
        render(<BrandList brands={brands} />);

        expect(
            screen.getByRole("link", { name: "Edit Aqua Lung" })
        ).toHaveAttribute("href", "/admin/brands/brand-1");

        expect(
            screen.getByRole("link", { name: "Edit Scubapro" })
        ).toHaveAttribute("href", "/admin/brands/brand-2");
    });
});