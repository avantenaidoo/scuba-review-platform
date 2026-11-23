import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CategoryForm } from "@/features/categories/components/category-form";
import {
    createCategoryAction,
    updateCategoryAction,
} from "@/features/categories/actions/category-actions";

const mocks = vi.hoisted(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
    createCategoryAction: vi.fn(),
    updateCategoryAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mocks.push,
        refresh: mocks.refresh,
    }),
}));

vi.mock("@/features/categories/actions/category-actions", () => ({
    createCategoryAction: mocks.createCategoryAction,
    updateCategoryAction: mocks.updateCategoryAction,
}));

const parentCategories = [
    { id: "parent-1", name: "Equipment" },
    { id: "parent-2", name: "Exposure Protection" },
];

describe("CategoryForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.createCategoryAction.mockResolvedValue({ success: true });
        mocks.updateCategoryAction.mockResolvedValue({ success: true });
    });

    it("renders the create category form", () => {
        render(<CategoryForm parentCategories={parentCategories} />);

        expect(screen.getByLabelText("Category name")).toBeInTheDocument();
        expect(screen.getByLabelText("Description")).toBeInTheDocument();

        expect(
            screen.getByRole("radio", { name: /Main category/ })
        ).toBeChecked();

        expect(
            screen.getByRole("radio", { name: /Subcategory/ })
        ).not.toBeChecked();

        expect(
            screen.getByRole("button", { name: "Create category" })
        ).toBeInTheDocument();
    });

    it("offers main category and subcategory options", () => {
        render(<CategoryForm parentCategories={parentCategories} />);

        expect(
            screen.getByRole("radio", { name: /Main category/ })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("radio", { name: /Subcategory/ })
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("radio", { name: "Equipment" })
        ).not.toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("radio", { name: /Subcategory/ })
        );

        expect(
            screen.getByRole("radio", { name: "Equipment" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("radio", { name: "Exposure Protection" })
        ).toBeInTheDocument();
    });

    it("creates a main category", async () => {
        render(<CategoryForm parentCategories={parentCategories} />);

        fireEvent.change(screen.getByLabelText("Category name"), {
            target: { value: "Regulators" },
        });

        fireEvent.change(screen.getByLabelText("Description"), {
            target: { value: "Regulator equipment" },
        });

        fireEvent.submit(
            screen.getByRole("button", {
                name: "Create category",
            }).closest("form")!
        );

        await waitFor(() => {
            expect(createCategoryAction).toHaveBeenCalled();
        });

        const formData = mocks.createCategoryAction.mock.calls[0][0] as FormData;

        expect(formData.get("name")).toBe("Regulators");
        expect(formData.get("description")).toBe("Regulator equipment");
        expect(formData.get("parentId")).toBe("");

        expect(mocks.push).toHaveBeenCalledWith("/admin/categories");
        expect(mocks.refresh).toHaveBeenCalled();
    });

    it("creates a subcategory with its selected main category", async () => {
        render(<CategoryForm parentCategories={parentCategories} />);

        fireEvent.change(screen.getByLabelText("Category name"), {
            target: { value: "First Stage" },
        });

        fireEvent.click(
            screen.getByRole("radio", { name: /Subcategory/ })
        );

        fireEvent.click(
            screen.getByRole("radio", { name: "Equipment" })
        );

        expect(
            screen.getByRole("radio", { name: "Equipment" })
        ).toBeChecked();

        fireEvent.submit(
            screen.getByRole("button", {
                name: "Create category",
            }).closest("form")!
        );

        await waitFor(() => {
            expect(createCategoryAction).toHaveBeenCalled();
        });

        const formData = mocks.createCategoryAction.mock.calls[0][0] as FormData;

        expect(formData.get("name")).toBe("First Stage");
        expect(formData.get("parentId")).toBe("parent-1");
    });

    it("renders existing category values when editing", () => {
        render(
            <CategoryForm
                category={{
                    id: "category-1",
                    name: "First Stage",
                    description: "Regulator first stages",
                    parent_id: "parent-1",
                }}
                parentCategories={parentCategories}
            />
        );

        expect(screen.getByLabelText("Category name")).toHaveValue(
            "First Stage"
        );

        expect(screen.getByLabelText("Description")).toHaveValue(
            "Regulator first stages"
        );

        expect(
            screen.getByRole("radio", { name: /Subcategory/ })
        ).toBeChecked();

        expect(
            screen.getByRole("radio", { name: "Equipment" })
        ).toBeChecked();

        expect(
            screen.getByRole("button", { name: "Save changes" })
        ).toBeInTheDocument();
    });

    it("updates an existing category", async () => {
        render(
            <CategoryForm
                category={{
                    id: "category-1",
                    name: "First Stage",
                    description: null,
                    parent_id: "parent-1",
                }}
                parentCategories={parentCategories}
            />
        );

        fireEvent.change(screen.getByLabelText("Category name"), {
            target: { value: "Second Stage" },
        });

        fireEvent.submit(
            screen.getByRole("button", {
                name: "Save changes",
            }).closest("form")!
        );

        await waitFor(() => {
            expect(updateCategoryAction).toHaveBeenCalled();
        });

        expect(mocks.updateCategoryAction).toHaveBeenCalledWith(
            "category-1",
            expect.any(FormData)
        );

        const formData = mocks.updateCategoryAction.mock.calls[0][1] as FormData;

        expect(formData.get("name")).toBe("Second Stage");
        expect(formData.get("parentId")).toBe("parent-1");

        expect(mocks.push).toHaveBeenCalledWith("/admin/categories");
        expect(mocks.refresh).toHaveBeenCalled();
    });

    it("displays an error when category creation fails", async () => {
        mocks.createCategoryAction.mockResolvedValue({
            success: false,
            error: "Unable to create category.",
        });

        render(<CategoryForm parentCategories={parentCategories} />);

        fireEvent.change(screen.getByLabelText("Category name"), {
            target: { value: "Regulators" },
        });

        fireEvent.submit(
            screen.getByRole("button", {
                name: "Create category",
            }).closest("form")!
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Unable to create category."
        );

        expect(mocks.push).not.toHaveBeenCalled();
    });
});