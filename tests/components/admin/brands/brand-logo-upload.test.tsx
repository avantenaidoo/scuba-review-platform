import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrandLogoUpload } from "@/features/brands/components/brand-logo-upload";

const mocks = vi.hoisted(() => ({
    saveBrandLogoAction: vi.fn(),
    clearBrandLogoAction: vi.fn(),
    upload: vi.fn(),
    remove: vi.fn(),
    refresh: vi.fn(),
}));

vi.mock("next/image", () => ({
    default: ({ alt }: { alt?: string }) => (
        <div
            role="img"
            aria-label={alt}
            data-testid="brand-logo-preview"
        />
    ),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        refresh: mocks.refresh,
    }),
}));

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        storage: {
            from: () => ({
                upload: mocks.upload,
                remove: mocks.remove,
            }),
        },
    }),
}));

vi.mock("@/features/brands/actions/brand-actions", () => ({
    saveBrandLogoAction: mocks.saveBrandLogoAction,
    clearBrandLogoAction: mocks.clearBrandLogoAction,
}));

describe("BrandLogoUpload", () => {
    const drawImage = vi.fn();
    const closeBitmap = vi.fn();

    function selectLogo() {
        const file = new File(["image content"], "logo.png", {
            type: "image/png",
        });

        fireEvent.change(
            screen.getByLabelText(/Choose logo|Replace logo/),
            {
                target: { files: [file] },
            }
        );

        fireEvent.change(screen.getByLabelText("Logo alternative text"), {
            target: { value: "Aqua Lung logo" },
        });
    }

    beforeEach(() => {
        vi.clearAllMocks();

        mocks.upload.mockResolvedValue({ error: null });
        mocks.remove.mockResolvedValue({ error: null });

        mocks.saveBrandLogoAction.mockResolvedValue({
            success: true,
            previousLogoPath: null,
        });

        mocks.clearBrandLogoAction.mockResolvedValue({
            success: true,
            previousLogoPath: "brand-1/old-logo.webp",
        });

        vi.stubGlobal("crypto", {
            randomUUID: () => "new-logo-id",
        });

        vi.stubGlobal(
            "createImageBitmap",
            vi.fn().mockResolvedValue({
                width: 800,
                height: 600,
                close: closeBitmap,
            })
        );

        vi.spyOn(
            HTMLCanvasElement.prototype,
            "getContext"
        ).mockReturnValue({
            drawImage,
        } as unknown as CanvasRenderingContext2D);

        vi.spyOn(
            HTMLCanvasElement.prototype,
            "toBlob"
        ).mockImplementation((callback) => {
            callback(new Blob(["processed image"], { type: "image/webp" }));
        });
    });

    it("renders the logo upload controls", () => {
        render(
            <BrandLogoUpload
                brandId="brand-1"
                logoUrl={null}
                initialAltText={null}
            />
        );

        expect(screen.getByText("Brand logo")).toBeInTheDocument();
        expect(screen.getByLabelText("Choose logo")).toBeInTheDocument();
        expect(
            screen.getByLabelText("Logo alternative text")
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Upload logo" })
        ).toBeDisabled();
    });

    it("requires alternative text before uploading a logo", async () => {
        render(
            <BrandLogoUpload
                brandId="brand-1"
                logoUrl={null}
                initialAltText={null}
            />
        );

        const file = new File(["image content"], "logo.png", {
            type: "image/png",
        });

        fireEvent.change(screen.getByLabelText("Choose logo"), {
            target: { files: [file] },
        });

        fireEvent.click(screen.getByRole("button", { name: "Upload logo" }));

        expect(
            await screen.findByText(
                "Enter logo alt text between 1 and 125 characters."
            )
        ).toBeInTheDocument();

        expect(mocks.upload).not.toHaveBeenCalled();
        expect(mocks.saveBrandLogoAction).not.toHaveBeenCalled();
    });

    it("rejects unsupported image types", async () => {
        render(
            <BrandLogoUpload
                brandId="brand-1"
                logoUrl={null}
                initialAltText="Aqua Lung logo"
            />
        );

        const file = new File(["image content"], "logo.gif", {
            type: "image/gif",
        });

        fireEvent.change(screen.getByLabelText("Choose logo"), {
            target: { files: [file] },
        });

        fireEvent.click(screen.getByRole("button", { name: "Upload logo" }));

        expect(
            await screen.findByText("Choose a JPEG, PNG or WebP image.")
        ).toBeInTheDocument();

        expect(mocks.upload).not.toHaveBeenCalled();
        expect(mocks.saveBrandLogoAction).not.toHaveBeenCalled();
    });

    it("processes and uploads a logo before saving its metadata", async () => {
        render(
            <BrandLogoUpload
                brandId="brand-1"
                logoUrl={null}
                initialAltText={null}
            />
        );

        selectLogo();

        fireEvent.click(screen.getByRole("button", { name: "Upload logo" }));

        await waitFor(() => {
            expect(mocks.saveBrandLogoAction).toHaveBeenCalledWith(
                "brand-1",
                "brand-1/new-logo-id.webp",
                "Aqua Lung logo",
                expect.any(Number)
            );
        });

        expect(mocks.upload).toHaveBeenCalledWith(
            "brand-1/new-logo-id.webp",
            expect.objectContaining({ type: "image/webp" }),
            {
                contentType: "image/webp",
                cacheControl: "3600",
                upsert: false,
            }
        );

        expect(drawImage).toHaveBeenCalled();
        expect(closeBitmap).toHaveBeenCalled();
        expect(mocks.refresh).toHaveBeenCalled();
    });

    it("cleans up the uploaded file when saving logo metadata fails", async () => {
        mocks.saveBrandLogoAction.mockResolvedValue({
            success: false,
            error: "Unable to save logo details.",
        });

        render(
            <BrandLogoUpload
                brandId="brand-1"
                logoUrl={null}
                initialAltText={null}
            />
        );

        selectLogo();

        fireEvent.click(screen.getByRole("button", { name: "Upload logo" }));

        expect(
            await screen.findByText("Unable to save logo details.")
        ).toBeInTheDocument();

        expect(mocks.remove).toHaveBeenCalledWith([
            "brand-1/new-logo-id.webp",
        ]);
    });

    it("deletes the previous logo after a successful replacement", async () => {
        mocks.saveBrandLogoAction.mockResolvedValue({
            success: true,
            previousLogoPath: "brand-1/old-logo.webp",
        });

        render(
            <BrandLogoUpload
                brandId="brand-1"
                logoUrl="https://example.com/current-logo"
                initialAltText="Existing logo"
            />
        );

        expect(screen.getByTestId("brand-logo-preview")).toHaveAttribute(
            "aria-label",
            "Existing logo"
        );

        selectLogo();

        fireEvent.click(screen.getByRole("button", { name: "Upload logo" }));

        await waitFor(() => {
            expect(mocks.remove).toHaveBeenCalledWith([
                "brand-1/old-logo.webp",
            ]);
        });

        expect(mocks.saveBrandLogoAction).toHaveBeenCalledTimes(1);
        expect(mocks.refresh).toHaveBeenCalled();
    });

    it("clears the logo metadata and deletes the stored file when removing a logo", async () => {
        render(
            <BrandLogoUpload
                brandId="brand-1"
                logoUrl="https://example.com/current-logo"
                initialAltText="Aqua Lung logo"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Remove logo" }));

        await waitFor(() => {
            expect(mocks.clearBrandLogoAction).toHaveBeenCalledWith("brand-1");
        });

        expect(mocks.remove).toHaveBeenCalledWith([
            "brand-1/old-logo.webp",
        ]);

        expect(mocks.refresh).toHaveBeenCalled();
    });

    it("does not delete the stored file when clearing logo metadata fails", async () => {
        mocks.clearBrandLogoAction.mockResolvedValue({
            success: false,
            error: "Unable to remove logo.",
        });

        render(
            <BrandLogoUpload
                brandId="brand-1"
                logoUrl="https://example.com/current-logo"
                initialAltText="Aqua Lung logo"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Remove logo" }));

        expect(
            await screen.findByText("Unable to remove logo.")
        ).toBeInTheDocument();

        expect(mocks.remove).not.toHaveBeenCalled();
    });
});