"use client";

import { useId, useState } from "react";

export type ProductSpecificationDraft = {
    id?: string;
    name: string;
    value: string;
    sort_order: number;
};

export type InitialProductSpecification = {
    id: string;
    name: string;
    value: unknown;
    sort_order: number;
};

type SpecificationRow = ProductSpecificationDraft & {
    key: string;
};

type ProductSpecificationsEditorProps = {
    initialSpecifications?: InitialProductSpecification[];
    onChange: (specifications: ProductSpecificationDraft[]) => void;
    disabled?: boolean;
};

const inputClasses =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

const labelClasses =
    "mb-2 block text-sm font-medium text-gray-700";

function formatSpecificationValue(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }

    if (value === null || value === undefined) {
        return "";
    }

    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }

    return JSON.stringify(value);
}

export function ProductSpecificationsEditor({
    initialSpecifications = [],
    onChange,
    disabled = false,
}: ProductSpecificationsEditorProps) {
    const id = useId();
    const [nextKey, setNextKey] = useState(0);

    const [specifications, setSpecifications] = useState<SpecificationRow[]>(
        () =>
            initialSpecifications.map((specification, index) => ({
                key: `${id}-initial-${index}`,
                id: specification.id,
                name: specification.name,
                value: formatSpecificationValue(specification.value),
                sort_order: specification.sort_order,
            }))
    );

    function publishChanges(rows: SpecificationRow[]) {
        setSpecifications(rows);

        onChange(
            rows.map(({ id: specificationId, name, value, sort_order }) => ({
                ...(specificationId
                    ? { id: specificationId }
                    : {}),
                name,
                value,
                sort_order,
            }))
        );
    }

    function addSpecification() {
        const newSpecification: SpecificationRow = {
            key: `${id}-new-${nextKey}`,
            name: "",
            value: "",
            sort_order: specifications.length,
        };

        setNextKey((current) => current + 1);

        publishChanges([
            ...specifications,
            newSpecification,
        ]);
    }

    function updateSpecification(
        key: string,
        field: "name" | "value",
        value: string
    ) {
        const updated = specifications.map((specification) =>
            specification.key === key
                ? { ...specification, [field]: value }
                : specification
        );

        publishChanges(updated);
    }

    function removeSpecification(key: string) {
        const updated = specifications
            .filter((specification) => specification.key !== key)
            .map((specification, index) => ({
                ...specification,
                sort_order: index,
            }));

        publishChanges(updated);
    }

    return (
        <section
            aria-labelledby="specifications-heading"
            className="space-y-4"
        >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2
                        id="specifications-heading"
                        className="text-lg font-semibold text-gray-900"
                    >
                        Specifications
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        Add the specifications that describe this product.
                        You can use any names and values that are relevant
                        to the equipment.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={addSpecification}
                    disabled={disabled}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Add specification
                </button>
            </div>

            {specifications.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
                    <p className="text-sm text-gray-600">
                        No specifications added yet.
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        Add a specification to describe a product feature,
                        measurement or technical detail.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {specifications.map((specification, index) => (
                        <div
                            key={specification.key}
                            className="grid gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                        >
                            <div>
                                <label
                                    htmlFor={`${specification.key}-name`}
                                    className={labelClasses}
                                >
                                    Specification name
                                </label>

                                <input
                                    id={`${specification.key}-name`}
                                    type="text"
                                    value={specification.name}
                                    onChange={(event) =>
                                        updateSpecification(
                                            specification.key,
                                            "name",
                                            event.target.value
                                        )
                                    }
                                    maxLength={100}
                                    disabled={disabled}
                                    placeholder="e.g. First-stage type"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor={`${specification.key}-value`}
                                    className={labelClasses}
                                >
                                    Value
                                </label>

                                <input
                                    id={`${specification.key}-value`}
                                    type="text"
                                    value={specification.value}
                                    onChange={(event) =>
                                        updateSpecification(
                                            specification.key,
                                            "value",
                                            event.target.value
                                        )
                                    }
                                    maxLength={500}
                                    disabled={disabled}
                                    placeholder="e.g. Balanced diaphragm"
                                    className={inputClasses}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    removeSpecification(specification.key)
                                }
                                disabled={disabled}
                                aria-label={`Remove specification ${index + 1}`}
                                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}