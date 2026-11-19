"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    saveBrandLogoAction,
    clearBrandLogoAction,
} from "@/features/brands/actions/brand-actions";

type BrandLogoUploadProps = {
    brandId: string;
    logoUrl: string | null;
    initialAltText: string | null;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 1200;

async function processLogo(file: File): Promise<Blob> {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
        throw new Error("Choose a JPEG, PNG or WebP image.");
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
        throw new Error("The original image must not exceed 5 MiB.");
    }

    let bitmap: ImageBitmap;

    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new Error("The selected file is not a valid image.");
    }

    try {
        const scale = Math.min(
            1,
            MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
        );

        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));

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
                    if (!result) {
                        reject(new Error("Unable to convert the image."));
                        return;
                    }

                    resolve(result);
                },
                "image/webp",
                0.85
            );
        });

        if (blob.type !== "image/webp") {
            throw new Error("Your browser could not process the image as WebP.");
        }

        if (blob.size <= 0 || blob.size > MAX_FILE_SIZE) {
            throw new Error("The processed logo must not exceed 5 MiB.");
        }

        return blob;
    } finally {
        bitmap.close();
    }
}

export function BrandLogoUpload({
    brandId,
    logoUrl,
    initialAltText,
}: BrandLogoUploadProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [altText, setAltText] = useState(initialAltText ?? "");
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    function handleUpload() {
        if (!file) {
            setError("Choose a logo image first.");
            return;
        }

        if (!altText.trim() || altText.trim().length > 125) {
            setError("Enter logo alt text between 1 and 125 characters.");
            return;
        }

        setError(null);
        setMessage(null);

        startTransition(async () => {
            const supabase = createClient();
            let uploadedPath: string | null = null;

            try {
                const processedImage = await processLogo(file);

                const storagePath = `${brandId}/${crypto.randomUUID()}.webp`;
                uploadedPath = storagePath;

                const { error: uploadError } = await supabase.storage
                    .from("brand-logos")
                    .upload(storagePath, processedImage, {
                        contentType: "image/webp",
                        cacheControl: "3600",
                        upsert: false,
                    });

                if (uploadError) {
                    throw new Error("Unable to upload the logo.");
                }

                const result = await saveBrandLogoAction(
                    brandId,
                    storagePath,
                    altText.trim(),
                    processedImage.size
                );

                if (!result.success) {
                    await supabase.storage
                        .from("brand-logos")
                        .remove([storagePath]);

                    uploadedPath = null;
                    throw new Error(result.error);
                }

                uploadedPath = null;

                if (result.previousLogoPath) {
                    const { error: cleanupError } = await supabase.storage
                        .from("brand-logos")
                        .remove([result.previousLogoPath]);

                    if (cleanupError) {
                        setMessage(
                            "Logo updated, but the previous image could not be deleted."
                        );
                    }
                }

                setFile(null);
                router.refresh();
            } catch (caughtError) {
                if (uploadedPath) {
                    await supabase.storage
                        .from("brand-logos")
                        .remove([uploadedPath]);
                }

                setError(
                    caughtError instanceof Error
                        ? caughtError.message
                        : "Unable to upload the brand logo."
                );
            }
        });
    }

    function handleRemove() {
        setError(null);
        setMessage(null);

        startTransition(async () => {
            const supabase = createClient();
            const result = await clearBrandLogoAction(brandId);

            if (!result.success) {
                setError(result.error);
                return;
            }

            if (result.previousLogoPath) {
                const { error: removeError } = await supabase.storage
                    .from("brand-logos")
                    .remove([result.previousLogoPath]);

                if (removeError) {
                    setMessage(
                        "The logo was removed from the brand, but its storage file could not be deleted."
                    );
                }
            }

            setAltText("");
            router.refresh();
        });
    }

    return (
        <section
            aria-labelledby="brand-logo-heading"
            className="space-y-4 border-t border-gray-200 pt-6"
        >
            <div>
                <h2
                    id="brand-logo-heading"
                    className="text-lg font-semibold text-gray-900"
                >
                    Brand logo
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Upload a JPEG, PNG or WebP logo. Images are processed into
                    WebP, with a maximum dimension of 1200 pixels.
                </p>
            </div>

            {logoUrl && (
                <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-gray-200 bg-white p-2">
                    <Image
                        src={logoUrl}
                        alt={altText || "Current brand logo"}
                        fill
                        unoptimized
                        className="object-contain"
                        sizes="112px"
                    />
                </div>
            )}

            <div>
                <label
                    htmlFor="logo-file"
                    className="mb-2 block text-sm font-medium text-gray-900"
                >
                    {logoUrl ? "Replace logo" : "Choose logo"}
                </label>

                <input
                    id="logo-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isPending}
                    onChange={(event) => {
                        setFile(event.target.files?.[0] ?? null);
                        setError(null);
                    }}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                />
            </div>

            <div>
                <label
                    htmlFor="logo-alt-text"
                    className="mb-2 block text-sm font-medium text-gray-900"
                >
                    Logo alternative text
                </label>

                <input
                    id="logo-alt-text"
                    type="text"
                    maxLength={125}
                    value={altText}
                    onChange={(event) => setAltText(event.target.value)}
                    disabled={isPending}
                    placeholder="e.g. Aqua Lung logo"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100"
                />
            </div>

            {error && (
                <p role="alert" className="text-sm text-red-600">
                    {error}
                </p>
            )}

            {message && (
                <p role="status" className="text-sm text-amber-700">
                    {message}
                </p>
            )}

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isPending || !file}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPending ? "Processing..." : "Upload logo"}
                </button>

                {logoUrl && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isPending}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Remove logo
                    </button>
                )}
            </div>
        </section>
    );
}