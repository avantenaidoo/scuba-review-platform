import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryStatusControl } from "@/features/categories/components/category-status-control";
import { setCategoryActiveAction } from "@/features/categories/actions/category-actions";

const { mockRefresh } = vi.hoisted(() => ({
    mockRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        refresh: mockRefresh,
    }),
}));

vi.mock("@/features/categories/actions/category-actions", () => ({
    setCategoryActiveAction: vi.fn(),
}));

const mockSetCategoryActiveAction = vi.mocked(setCategoryActiveAction);

describe("CategoryStatusControl", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("displays the Deactivate button for an active category", () => {
        render(
            <CategoryStatusControl
                categoryId="category-1"
                isActive={true}
            />
        );

        expect(
            screen.getByRole("button", { name: "Deactivate category" })
        ).toBeInTheDocument();
    });

    it("displays the Activate button for an inactive category", () => {
        render(
            <CategoryStatusControl
                categoryId="category-1"
                isActive={false}
            />
        );

        expect(
            screen.getByRole("button", { name: "Activate category" })
        ).toBeInTheDocument();
    });

    it("deactivates an active category and refreshes the page", async () => {
        mockSetCategoryActiveAction.mockResolvedValue({ success: true });

        render(
            <CategoryStatusControl
                categoryId="category-1"
                isActive={true}
            />
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Deactivate category" })
        );

        await waitFor(() => {
            expect(mockSetCategoryActiveAction).toHaveBeenCalledWith(
                "category-1",
                false
            );
            expect(mockRefresh).toHaveBeenCalled();
        });
    });

    it("activates an inactive category and refreshes the page", async () => {
        mockSetCategoryActiveAction.mockResolvedValue({ success: true });

        render(
            <CategoryStatusControl
                categoryId="category-1"
                isActive={false}
            />
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Activate category" })
        );

        await waitFor(() => {
            expect(mockSetCategoryActiveAction).toHaveBeenCalledWith(
                "category-1",
                true
            );
            expect(mockRefresh).toHaveBeenCalled();
        });
    });

    it("displays an error when the status update fails", async () => {
        mockSetCategoryActiveAction.mockResolvedValue({
            success: false,
            error: "Administrator access required.",
        });

        render(
            <CategoryStatusControl
                categoryId="category-1"
                isActive={true}
            />
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Deactivate category" })
        );

        expect(
            await screen.findByRole("alert")
        ).toHaveTextContent("Administrator access required.");

        expect(mockRefresh).not.toHaveBeenCalled();
    });
});