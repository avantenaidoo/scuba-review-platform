"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBrandActiveAction } from "@/features/brands/actions/brand-actions";

type BrandStatusControlProps = {
    id: string;
    name: string;
    isActive: boolean;
};

export function BrandStatusControl({
    id,
    name,
    isActive,
}: BrandStatusControlProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function handleToggle() {
        setError(null);

        startTransition(async () => {
            const result = await setBrandActiveAction(id, !isActive);

            if (!result.success) {
                setError(result.error);
                return;
            }

            router.refresh();
        });
    }

    return (
        <div className="mt-2">
            <button
                type="button"
                onClick={handleToggle}
                disabled={isPending}
                aria-label={`${isActive ? "Deactivate" : "Activate"} ${name}`}
                className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isPending
                    ? "Updating..."
                    : isActive
                        ? "Deactivate"
                        : "Activate"}
            </button>

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}