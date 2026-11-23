import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryList } from "@/features/categories/components/category-list";
import type { Database } from "@/lib/supabase/database.types";

type CategoryRecord = Database["public"]["Tables"]["categories"]["Row"];

vi.mock("@/features/categories/components/category-status-control", () => ({
    CategoryStatusControl: ({
        categoryId,
        isActive,
    }: {
        categoryId: string;
        isActive: boolean;
    }) => (
        <div data-testid={`category-status-${categoryId}`}>
            {isActive ? "Active" : "Inactive"}
        </div>
    ),
}));

const categories: CategoryRecord[] = [
    {
        id: "category-1",
        parent_id: null,
        name: "Masks",
        slug: "masks",
        description: "Scuba diving masks.",
        sort_order: 0,
        is_active: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
    },
    {
        id: "category-2",
        parent_id: "category-1",
        name: "Full Face Masks",
        slug: "full-face-masks",
        description: "Full face diving masks.",
        sort_order: 0,
        is_active: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
    },
];

describe("CategoryList", () => {
    it("renders the page heading and Add category link", () => {
        render(<CategoryList categories={categories} />);

        expect(
            screen.getByRole("heading", { name: "Categories" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("link", { name: /add category/i })
        ).toHaveAttribute("href", "/admin/categories/new");
    });

    it("renders category names and descriptions", () => {
        render(<CategoryList categories={categories} />);

        expect(screen.getAllByText("Masks")).toHaveLength(2);
        expect(screen.getByText("Full Face Masks")).toBeInTheDocument();
        expect(screen.getByText("Scuba diving masks.")).toBeInTheDocument();
        expect(
            screen.getByText("Full face diving masks.")
        ).toBeInTheDocument();
    });

    it("displays the parent category for a subcategory", () => {
        render(<CategoryList categories={categories} />);

        const row = screen.getByText("Full Face Masks").closest("tr");

        expect(row).toHaveTextContent("Masks");
    });

    it("renders the category status controls", () => {
        render(<CategoryList categories={categories} />);

        expect(
            screen.getByTestId("category-status-category-1")
        ).toHaveTextContent("Active");

        expect(
            screen.getByTestId("category-status-category-2")
        ).toHaveTextContent("Inactive");
    });

    it("renders edit links for each category", () => {
        render(<CategoryList categories={categories} />);

        const editLinks = screen.getAllByRole("link", {
            name: /^edit /i,
        });

        expect(editLinks).toHaveLength(2);
        expect(editLinks[0]).toHaveAttribute(
            "href",
            "/admin/categories/category-1"
        );
        expect(editLinks[1]).toHaveAttribute(
            "href",
            "/admin/categories/category-2"
        );
    });

    it("renders an empty state when there are no categories", () => {
        render(<CategoryList categories={[]} />);

        expect(
            screen.getByRole("heading", { name: "No categories yet" })
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Add your first category to start organising the equipment catalogue."
            )
        ).toBeInTheDocument();
    });
});