import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrandForm } from "@/features/brands/components/brand-form";

const mocks = vi.hoisted(() => ({
    createBrandAction: vi.fn(),
    updateBrandAction: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
}));

vi.mock("@/features/brands/actions/brand-actions", () => ({
    createBrandAction: mocks.createBrandAction,
    updateBrandAction: mocks.updateBrandAction,
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mocks.push,
        refresh: mocks.refresh,
    }),
}));

describe("BrandForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.createBrandAction.mockResolvedValue({ success: true });
        mocks.updateBrandAction.mockResolvedValue({ success: true });
    });

    it("renders the creation form", () => {
        render(<BrandForm />);

        expect(
            screen.getByRole("heading", { name: "Add brand" })
        ).toBeTruthy();

        expect(
            screen.getByRole("textbox", { name: /brand name/i })
        ).toBeTruthy();

        expect(
            screen.getByRole("button", { name: "Create brand" })
        ).toBeTruthy();
    });

    it("submits new brand details and redirects after success", async () => {
        render(<BrandForm />);

        fireEvent.change(
            screen.getByRole("textbox", { name: /brand name/i }),
            { target: { value: "Scubapro" } }
        );

        fireEvent.change(
            screen.getByRole("textbox", { name: /description/i }),
            { target: { value: "Scuba equipment manufacturer." } }
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Create brand" })
        );

        await waitFor(() => {
            expect(mocks.createBrandAction).toHaveBeenCalledTimes(1);
        });

        const formData = mocks.createBrandAction.mock.calls[0][0] as FormData;

        expect(formData.get("name")).toBe("Scubapro");
        expect(formData.get("description")).toBe(
            "Scuba equipment manufacturer."
        );

        expect(mocks.push).toHaveBeenCalledWith("/admin/brands");
        expect(mocks.refresh).toHaveBeenCalledTimes(1);
    });

    it("displays a server error when creation fails", async () => {
        mocks.createBrandAction.mockResolvedValue({
            success: false,
            error: "A brand with this name already exists.",
        });

        render(<BrandForm />);

        fireEvent.change(
            screen.getByRole("textbox", { name: /brand name/i }),
            { target: { value: "Scubapro" } }
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Create brand" })
        );

        expect(
            await screen.findByRole("alert")
        ).toHaveTextContent("A brand with this name already exists.");

        expect(mocks.push).not.toHaveBeenCalled();
    });

    it("prepopulates and submits existing brand details when editing", async () => {
        render(
            <BrandForm
                brand={{
                    id: "brand-123",
                    name: "Scubapro",
                    description: "Original description.",
                }}
            />
        );

        expect(
            screen.getByRole("heading", { name: "Edit brand" })
        ).toBeTruthy();

        expect(
            screen.getByRole("textbox", { name: /brand name/i })
        ).toHaveValue("Scubapro");

        fireEvent.change(
            screen.getByRole("textbox", { name: /description/i }),
            { target: { value: "Updated description." } }
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Save changes" })
        );

        await waitFor(() => {
            expect(mocks.updateBrandAction).toHaveBeenCalledTimes(1);
        });

        const [id, formData] = mocks.updateBrandAction.mock.calls[0] as [
            string,
            FormData,
        ];

        expect(id).toBe("brand-123");
        expect(formData.get("description")).toBe("Updated description.");
        expect(mocks.push).toHaveBeenCalledWith("/admin/brands");
    });
});