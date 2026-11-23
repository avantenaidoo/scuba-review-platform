"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import {
    removeProductImageAction,
    saveProductImageAction,
} from "@/features/products/actions/product-image-actions";

import type {
    ProductImageWithUrl,
} from "@/features/products/services/product-image-service";

type ProductImageUploadProps = {
    productId: string;
    mainImage: ProductImageWithUrl | null;
    galleryImages: ProductImageWithUrl[];
    disabled?: boolean;
};

type PendingGalleryImage = {
    id: string;
    file: File;
    altText: string;
};

type ProcessedImage = {
    blob: Blob;
    width: number;
    height: number;
};

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_DIMENSION = 1200;
const MAX_ALT_TEXT_LENGTH = 125;

const inputClasses =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

function validateImageFile(file: File): string | null {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
        return "Please select a JPEG, PNG, or WebP image.";
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
        return "The image must be larger than 0 bytes and no larger than 15 MiB.";
    }

    return null;
}

async function processProductImage(
    file: File
): Promise<ProcessedImage> {
    const validationError = validateImageFile(file);

    if (validationError) {
        throw new Error(validationError);
    }

    const bitmap = await createImageBitmap(file);

    try {
        const scale = Math.min(
            1,
            MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
        );

        const width = Math.max(
            1,
            Math.round(bitmap.width * scale)
        );

        const height = Math.max(
            1,
            Math.round(bitmap.height * scale)
        );

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Unable to process the selected image.");
        }

        context.drawImage(bitmap, 0, 0, width, height);

        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(
                            new Error("Unable to convert the image to WebP.")
                        );
                    }
                },
                "image/webp",
                0.85
            );
        });

        if (blob.type !== "image/webp") {
            throw new Error("The image could not be converted to WebP.");
        }

        if (blob.size <= 0 || blob.size > MAX_FILE_SIZE) {
            throw new Error(
                "The processed image must not exceed 15 MiB."
            );
        }

        return {
            blob,
            width,
            height,
        };
    } finally {
        bitmap.close();
    }
}

export function ProductImageUpload({
    productId,
    mainImage,
    galleryImages,
    disabled = false,
}: ProductImageUploadProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [mainFile, setMainFile] = useState<File | null>(null);
    const [mainAltText, setMainAltText] = useState(
        mainImage?.alt_text ?? ""
    );

    const [galleryFiles, setGalleryFiles] = useState<
        PendingGalleryImage[]
    >([]);

    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isUploadingMain, setIsUploadingMain] = useState(false);
    const [isUploadingGallery, setIsUploadingGallery] = useState(false);
    const [removingImageId, setRemovingImageId] = useState<string | null>(
        null
    );

    const isDisabled =
        disabled ||
        isPending ||
        isUploadingMain ||
        isUploadingGallery ||
        removingImageId !== null;

    function handleMainFileChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0] ?? null;

        setError(null);
        setMessage(null);

        if (!file) {
            setMainFile(null);
            return;
        }

        const validationError = validateImageFile(file);

        if (validationError) {
            setError(validationError);
            setMainFile(null);
            event.target.value = "";
            return;
        }

        setMainFile(file);
    }

    function handleGalleryFileChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const selectedFiles = Array.from(event.target.files ?? []);

        setError(null);
        setMessage(null);

        const validFiles: PendingGalleryImage[] = [];

        for (const file of selectedFiles) {
            const validationError = validateImageFile(file);

            if (validationError) {
                setError(`${file.name}: ${validationError}`);
                continue;
            }

            validFiles.push({
                id: crypto.randomUUID(),
                file,
                altText: "",
            });
        }

        setGalleryFiles((current) => [...current, ...validFiles]);
        event.target.value = "";
    }

    function updateGalleryAltText(id: string, altText: string) {
        setGalleryFiles((current) =>
            current.map((image) =>
                image.id === id
                    ? { ...image, altText }
                    : image
            )
        );
    }

    function removePendingGalleryImage(id: string) {
        setGalleryFiles((current) =>
            current.filter((image) => image.id !== id)
        );
    }

    async function uploadProcessedImage(
        file: File,
        altText: string,
        imageType: "main" | "gallery"
    ): Promise<{ success: true } | { success: false; error: string }> {
        let uploadedPath: string | null = null;

        try {
            const processedImage = await processProductImage(file);
            const storagePath = `${productId}/${crypto.randomUUID()}.webp`;

            const supabase = createClient();

            const { error: uploadError } = await supabase.storage
                .from("product-images")
                .upload(storagePath, processedImage.blob, {
                    contentType: "image/webp",
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) {
                throw new Error("Unable to upload the product image.");
            }

            uploadedPath = storagePath;

            const result = await saveProductImageAction(
                productId,
                storagePath,
                altText.trim(),
                processedImage.blob.size,
                imageType,
                processedImage.width,
                processedImage.height
            );

            if (!result.success) {
                await supabase.storage
                    .from("product-images")
                    .remove([storagePath]);

                uploadedPath = null;

                return {
                    success: false,
                    error: result.error,
                };
            }

            if (result.previousImagePath) {
                const { error: cleanupError } = await supabase.storage
                    .from("product-images")
                    .remove([result.previousImagePath]);

                if (cleanupError) {
                    setMessage(
                        "The image was saved, but the previous image could not be removed from storage."
                    );
                }
            }

            uploadedPath = null;

            return { success: true };
        } catch (uploadError) {
            if (uploadedPath) {
                const supabase = createClient();

                await supabase.storage
                    .from("product-images")
                    .remove([uploadedPath]);
            }

            return {
                success: false,
                error:
                    uploadError instanceof Error
                        ? uploadError.message
                        : "An unexpected error occurred while uploading the image.",
            };
        }
    }

    function handleMainUpload() {
        setError(null);
        setMessage(null);

        if (!mainFile) {
            setError("Please select a main image.");
            return;
        }

        const cleanAltText = mainAltText.trim();

        if (
            !cleanAltText ||
            cleanAltText.length > MAX_ALT_TEXT_LENGTH
        ) {
            setError(
                "Main image alt text must be between 1 and 125 characters."
            );
            return;
        }

        setIsUploadingMain(true);

        startTransition(async () => {
            const result = await uploadProcessedImage(
                mainFile,
                cleanAltText,
                "main"
            );

            if (!result.success) {
                setError(result.error);
                setIsUploadingMain(false);
                return;
            }

            setMainFile(null);
            setIsUploadingMain(false);
            setMessage((current) =>
                current ??
                "Main image saved successfully."
            );

            router.refresh();
        });
    }

    function handleGalleryUpload() {
        setError(null);
        setMessage(null);

        if (galleryFiles.length === 0) {
            setError("Please select at least one gallery image.");
            return;
        }

        const invalidImage = galleryFiles.find((image) => {
            const altText = image.altText.trim();

            return (
                !altText ||
                altText.length > MAX_ALT_TEXT_LENGTH
            );
        });

        if (invalidImage) {
            setError(
                `Please enter alt text between 1 and 125 characters for ${invalidImage.file.name}.`
            );
            return;
        }

        setIsUploadingGallery(true);

        startTransition(async () => {
            let uploadedCount = 0;

            for (const image of galleryFiles) {
                const result = await uploadProcessedImage(
                    image.file,
                    image.altText.trim(),
                    "gallery"
                );

                if (!result.success) {
                    setError(
                        `${image.file.name}: ${result.error}`
                    );
                    break;
                }

                uploadedCount += 1;

                setGalleryFiles((current) =>
                    current.filter(
                        (pendingImage) =>
                            pendingImage.id !== image.id
                    )
                );
            }

            setIsUploadingGallery(false);

            if (uploadedCount > 0) {
                setMessage(
                    `${uploadedCount} gallery image${uploadedCount === 1 ? "" : "s"} saved successfully.`
                );

                router.refresh();
            }
        });
    }

    function handleRemoveImage(imageId: string) {
        setError(null);
        setMessage(null);
        setRemovingImageId(imageId);

        startTransition(async () => {
            const result = await removeProductImageAction(
                productId,
                imageId
            );

            if (!result.success) {
                setError(result.error);
                setRemovingImageId(null);
                return;
            }

            const supabase = createClient();

            const { error: storageError } = await supabase.storage
                .from("product-images")
                .remove([result.previousImagePath]);

            if (storageError) {
                setMessage(
                    "The image record was removed, but its storage file could not be deleted."
                );
            } else {
                setMessage("Product image removed successfully.");
            }

            setRemovingImageId(null);
            router.refresh();
        });
    }

    return (
        <section className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-900">
                    Product images
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Upload a main image and additional gallery images.
                    Images are resized and converted to WebP before upload.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {message && (
                <div
                    role="status"
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
                >
                    {message}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                        Main image
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                        This image represents the product in the catalogue.
                    </p>
                </div>

                {mainImage && (
                    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center">
                        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            <Image
                                src={mainImage.url}
                                alt={mainImage.alt_text}
                                fill
                                unoptimized
                                sizes="112px"
                                className="object-contain"
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                                Current main image
                            </p>

                            <p className="mt-1 text-sm text-gray-600">
                                {mainImage.alt_text}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                handleRemoveImage(mainImage.id)
                            }
                            disabled={isDisabled}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {removingImageId === mainImage.id
                                ? "Removing..."
                                : "Remove"}
                        </button>
                    </div>
                )}

                <div className="space-y-3">
                    <div>
                        <label
                            htmlFor="main-product-image"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            {mainImage
                                ? "Choose a replacement image"
                                : "Choose a main image"}
                        </label>

                        <input
                            id="main-product-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleMainFileChange}
                            disabled={isDisabled}
                            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="main-product-image-alt"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Main image alt text
                        </label>

                        <input
                            id="main-product-image-alt"
                            type="text"
                            value={mainAltText}
                            onChange={(event) =>
                                setMainAltText(event.target.value)
                            }
                            maxLength={MAX_ALT_TEXT_LENGTH}
                            disabled={isDisabled}
                            placeholder="Describe the product image"
                            className={inputClasses}
                        />
                    </div>

                    {mainFile && (
                        <p className="text-sm text-gray-600">
                            Selected: {mainFile.name}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleMainUpload}
                        disabled={isDisabled || !mainFile}
                        className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isUploadingMain
                            ? "Uploading..."
                            : mainImage
                                ? "Replace main image"
                                : "Upload main image"}
                    </button>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                            Gallery images
                        </h3>

                        <p className="mt-1 text-sm text-gray-600">
                            Add additional views or details of the product.
                        </p>
                    </div>

                    {galleryImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {galleryImages.map((image) => (
                                <div
                                    key={image.id}
                                    className="space-y-2 rounded-lg border border-gray-200 p-3"
                                >
                                    <div className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
                                        <Image
                                            src={image.url}
                                            alt={image.alt_text}
                                            fill
                                            unoptimized
                                            sizes="(max-width: 640px) 50vw, 25vw"
                                            className="object-contain"
                                        />
                                    </div>

                                    <p className="line-clamp-2 text-xs text-gray-600">
                                        {image.alt_text}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemoveImage(image.id)
                                        }
                                        disabled={isDisabled}
                                        className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {removingImageId === image.id
                                            ? "Removing..."
                                            : "Remove"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-3">
                        <div>
                            <label
                                htmlFor="gallery-product-images"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Choose gallery images
                            </label>

                            <input
                                id="gallery-product-images"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={handleGalleryFileChange}
                                disabled={isDisabled}
                                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {galleryFiles.length > 0 && (
                            <div className="space-y-4">
                                {galleryFiles.map((image) => (
                                    <div
                                        key={image.id}
                                        className="space-y-2 rounded-lg border border-gray-200 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="break-all text-sm font-medium text-gray-900">
                                                {image.file.name}
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removePendingGalleryImage(
                                                        image.id
                                                    )
                                                }
                                                disabled={isDisabled}
                                                className="shrink-0 text-sm font-medium text-red-700 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <label
                                            htmlFor={`gallery-alt-${image.id}`}
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Image alt text
                                        </label>

                                        <input
                                            id={`gallery-alt-${image.id}`}
                                            type="text"
                                            value={image.altText}
                                            onChange={(event) =>
                                                updateGalleryAltText(
                                                    image.id,
                                                    event.target.value
                                                )
                                            }
                                            maxLength={MAX_ALT_TEXT_LENGTH}
                                            disabled={isDisabled}
                                            placeholder="Describe this image"
                                            className={inputClasses}
                                        />
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={handleGalleryUpload}
                                    disabled={isDisabled}
                                    className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isUploadingGallery
                                        ? "Uploading..."
                                        : `Upload ${galleryFiles.length} gallery image${galleryFiles.length === 1 ? "" : "s"}`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
