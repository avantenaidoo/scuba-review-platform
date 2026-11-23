import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";

import { ProductImageUpload } from "@/features/products/components/product-image-upload";
import type { ProductImageWithUrl } from "@/features/products/services/product-image-service";

const mocks = vi.hoisted(() => ({
    refresh: vi.fn(),
    upload: vi.fn(),
    remove: vi.fn(),
    saveProductImageAction: vi.fn(),
    removeProductImageAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        refresh: mocks.refresh,
    }),
}));

vi.mock("next/image", () => ({
    default: ({
        src,
        alt,
    }: {
        src: string;
        alt: string;
    }) => (
        <div
            role="img"
            aria-label={alt}
            data-src={src}
        />
    ),
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

vi.mock("@/features/products/actions/product-image-actions", () => ({
    saveProductImageAction: mocks.saveProductImageAction,
    removeProductImageAction: mocks.removeProductImageAction,
}));

const productId = "product-123";

const mainImage = {
    id: "main-image-1",
    product_id: productId,
    storage_path: `${productId}/main.webp`,
    alt_text: "Scuba regulator front view",
    mime_type: "image/webp",
    file_size_bytes: 1024,
    width: 800,
    height: 800,
    image_type: "main",
    is_primary: true,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    url: "https://example.com/main.webp",
} as ProductImageWithUrl;

const galleryImage = {
    ...mainImage,
    id: "gallery-image-1",
    storage_path: `${productId}/gallery.webp`,
    alt_text: "Scuba regulator side view",
    image_type: "gallery",
    is_primary: false,
    sort_order: 1,
    url: "https://example.com/gallery.webp",
} as ProductImageWithUrl;

function renderComponent(
    props: Partial<ComponentProps<typeof ProductImageUpload>> = {}
) {
    return render(
        <ProductImageUpload
            productId={productId}
            mainImage={null}
            galleryImages={[]}
            {...props}
        />
    );
}

function createImageFile(
    name = "product.jpg",
    type = "image/jpeg"
) {
    return new File(["image-content"], name, { type });
}

function mockImageProcessing() {
    vi.stubGlobal(
        "createImageBitmap",
        vi.fn().mockResolvedValue({
            width: 800,
            height: 600,
            close: vi.fn(),
        })
    );

    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        configurable: true,
        value: vi.fn().mockReturnValue({
            drawImage: vi.fn(),
        }),
    });

    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
        configurable: true,
        value: vi.fn((callback: BlobCallback) => {
            callback(
                new Blob(["processed-image"], {
                    type: "image/webp",
                })
            );
        }),
    });
}

describe("ProductImageUpload", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.upload.mockResolvedValue({
            data: {
                path: `${productId}/uploaded.webp`,
            },
            error: null,
        });

        mocks.remove.mockResolvedValue({
            data: [],
            error: null,
        });

        mocks.saveProductImageAction.mockResolvedValue({
            success: true,
            imageId: "saved-image-1",
            previousImagePath: null,
        });

        mocks.removeProductImageAction.mockResolvedValue({
            success: true,
            previousImagePath: `${productId}/gallery.webp`,
        });

        mockImageProcessing();
    });

    afterEach(() => {
        cleanup();

        Reflect.deleteProperty(
            HTMLCanvasElement.prototype,
            "getContext"
        );

        Reflect.deleteProperty(
            HTMLCanvasElement.prototype,
            "toBlob"
        );

        vi.unstubAllGlobals();
    });

    it("renders the main image and gallery upload sections", () => {
        renderComponent();

        expect(
            screen.getByRole("heading", {
                name: "Product images",
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", {
                name: "Main image",
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", {
                name: "Gallery images",
            })
        ).toBeInTheDocument();
    });

    it("displays existing main and gallery images", () => {
        renderComponent({
            mainImage,
            galleryImages: [galleryImage],
        });

        expect(
            screen.getByRole("img", {
                name: "Scuba regulator front view",
            })
        ).toHaveAttribute("data-src", mainImage.url);

        expect(
            screen.getByRole("img", {
                name: "Scuba regulator side view",
            })
        ).toHaveAttribute("data-src", galleryImage.url);
    });

    it("rejects an unsupported main image file", () => {
        renderComponent();

        fireEvent.change(
            screen.getByLabelText("Choose a main image"),
            {
                target: {
                    files: [
                        createImageFile("product.gif", "image/gif"),
                    ],
                },
            }
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Please select a JPEG, PNG, or WebP image."
        );

        expect(mocks.upload).not.toHaveBeenCalled();
    });

    it("requires alt text before uploading the main image", () => {
        renderComponent();

        fireEvent.change(
            screen.getByLabelText("Choose a main image"),
            {
                target: {
                    files: [createImageFile()],
                },
            }
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Upload main image",
            })
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Main image alt text must be between 1 and 125 characters."
        );

        expect(mocks.upload).not.toHaveBeenCalled();
    });

    it("processes and uploads the main image before saving its metadata", async () => {
        renderComponent();

        fireEvent.change(
            screen.getByLabelText("Choose a main image"),
            {
                target: {
                    files: [createImageFile()],
                },
            }
        );

        fireEvent.change(
            screen.getByLabelText("Main image alt text"),
            {
                target: {
                    value: "Scuba regulator front view",
                },
            }
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Upload main image",
            })
        );

        await waitFor(() => {
            expect(mocks.saveProductImageAction).toHaveBeenCalledWith(
                productId,
                expect.stringMatching(
                    new RegExp(`^${productId}/.+\\.webp$`)
                ),
                "Scuba regulator front view",
                expect.any(Number),
                "main",
                800,
                600
            );
        });

        expect(mocks.upload).toHaveBeenCalledWith(
            expect.stringMatching(
                new RegExp(`^${productId}/.+\\.webp$`)
            ),
            expect.any(Blob),
            {
                contentType: "image/webp",
                cacheControl: "3600",
                upsert: false,
            }
        );

        expect(mocks.refresh).toHaveBeenCalled();
    });

    it("removes the newly uploaded file when saving image metadata fails", async () => {
        mocks.saveProductImageAction.mockResolvedValue({
            success: false,
            error: "Unable to save the product image.",
        });

        renderComponent();

        fireEvent.change(
            screen.getByLabelText("Choose a main image"),
            {
                target: {
                    files: [createImageFile()],
                },
            }
        );

        fireEvent.change(
            screen.getByLabelText("Main image alt text"),
            {
                target: {
                    value: "Scuba regulator front view",
                },
            }
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Upload main image",
            })
        );

        await waitFor(() => {
            expect(mocks.remove).toHaveBeenCalledWith([
                expect.stringMatching(
                    new RegExp(`^${productId}/.+\\.webp$`)
                ),
            ]);
        });

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Unable to save the product image."
        );

        expect(mocks.refresh).not.toHaveBeenCalled();
    });

    it("removes the previous main image after a successful replacement", async () => {
        mocks.saveProductImageAction.mockResolvedValue({
            success: true,
            imageId: "replacement-image",
            previousImagePath: mainImage.storage_path,
        });

        renderComponent({
            mainImage,
        });

        fireEvent.change(
            screen.getByLabelText("Choose a replacement image"),
            {
                target: {
                    files: [createImageFile("replacement.jpg")],
                },
            }
        );

        fireEvent.change(
            screen.getByLabelText("Main image alt text"),
            {
                target: {
                    value: "Updated regulator image",
                },
            }
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Replace main image",
            })
        );

        await waitFor(() => {
            expect(mocks.remove).toHaveBeenCalledWith([
                mainImage.storage_path,
            ]);
        });

        expect(mocks.refresh).toHaveBeenCalled();
    });

    it("uploads a gallery image with its alt text", async () => {
        renderComponent();

        fireEvent.change(
            screen.getByLabelText("Choose gallery images"),
            {
                target: {
                    files: [
                        createImageFile("regulator-detail.jpg"),
                    ],
                },
            }
        );

        const altTextInput = await screen.findByLabelText(
            "Image alt text"
        );

        fireEvent.change(altTextInput, {
            target: {
                value: "Regulator hose connection",
            },
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Upload 1 gallery image",
            })
        );

        await waitFor(() => {
            expect(mocks.saveProductImageAction).toHaveBeenCalledWith(
                productId,
                expect.stringMatching(
                    new RegExp(`^${productId}/.+\\.webp$`)
                ),
                "Regulator hose connection",
                expect.any(Number),
                "gallery",
                800,
                600
            );
        });

        expect(mocks.refresh).toHaveBeenCalled();
    });

    it("does not upload gallery images without alt text", async () => {
        renderComponent();

        fireEvent.change(
            screen.getByLabelText("Choose gallery images"),
            {
                target: {
                    files: [
                        createImageFile("regulator-detail.jpg"),
                    ],
                },
            }
        );

        fireEvent.click(
            await screen.findByRole("button", {
                name: "Upload 1 gallery image",
            })
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Please enter alt text"
        );

        expect(mocks.upload).not.toHaveBeenCalled();
    });

    it("removes an existing image record and its storage file", async () => {
        renderComponent({
            mainImage,
            galleryImages: [galleryImage],
        });

        const removeButtons = screen.getAllByRole("button", {
            name: "Remove",
        });

        fireEvent.click(removeButtons[1]);

        await waitFor(() => {
            expect(
                mocks.removeProductImageAction
            ).toHaveBeenCalledWith(
                productId,
                galleryImage.id
            );
        });

        expect(mocks.remove).toHaveBeenCalledWith([
            `${productId}/gallery.webp`,
        ]);

        expect(mocks.refresh).toHaveBeenCalled();
    });

    it("does not delete a storage file when image-record removal fails", async () => {
        mocks.removeProductImageAction.mockResolvedValue({
            success: false,
            error: "Unable to remove the product image.",
        });

        renderComponent({
            mainImage,
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Remove",
            })
        );

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent(
                "Unable to remove the product image."
            );
        });

        expect(mocks.remove).not.toHaveBeenCalled();
    });
});
