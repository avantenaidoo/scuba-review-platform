import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrandStatusControl } from "@/features/brands/components/brand-status-control";

const mocks = vi.hoisted(() => ({
    setBrandActiveAction: vi.fn(),
    refresh: vi.fn(),
}));

vi.mock("@/features/brands/actions/brand-actions", () => ({
    setBrandActiveAction: mocks.setBrandActiveAction,
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        refresh: mocks.refresh,
    }),
}));

describe("BrandStatusControl", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.setBrandActiveAction.mockResolvedValue({ success: true });
    });

    it("offers to deactivate an active brand", () => {
        render(
            <BrandStatusControl
                id="brand-123"
                name="Scubapro"
                isActive
            />
        );

        expect(
            screen.getByRole("button", { name: "Deactivate Scubapro" })
        ).toBeTruthy();
    });

    it("offers to activate an inactive brand", () => {
        render(
            <BrandStatusControl
                id="brand-123"
                name="Scubapro"
                isActive={false}
            />
        );

        expect(
            screen.getByRole("button", { name: "Activate Scubapro" })
        ).toBeTruthy();
    });

    it("deactivates an active brand and refreshes the page", async () => {
        render(
            <BrandStatusControl
                id="brand-123"
                name="Scubapro"
                isActive
            />
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Deactivate Scubapro" })
        );

        await waitFor(() => {
            expect(mocks.setBrandActiveAction).toHaveBeenCalledWith(
                "brand-123",
                false
            );
        });

        expect(mocks.refresh).toHaveBeenCalledTimes(1);
    });

    it("activates an inactive brand and refreshes the page", async () => {
        render(
            <BrandStatusControl
                id="brand-123"
                name="Scubapro"
                isActive={false}
            />
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Activate Scubapro" })
        );

        await waitFor(() => {
            expect(mocks.setBrandActiveAction).toHaveBeenCalledWith(
                "brand-123",
                true
            );
        });

        expect(mocks.refresh).toHaveBeenCalledTimes(1);
    });

    it("displays an error when the status update fails", async () => {
        mocks.setBrandActiveAction.mockResolvedValue({
            success: false,
            error: "Unable to update brand status.",
        });

        render(
            <BrandStatusControl
                id="brand-123"
                name="Scubapro"
                isActive
            />
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Deactivate Scubapro" })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Unable to update brand status."
        );

        expect(mocks.refresh).not.toHaveBeenCalled();
    });
});