import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    fireEvent,
    render,
    screen,
} from "@testing-library/react";

import {
    ProductSpecificationsEditor,
    type InitialProductSpecification,
} from "@/features/products/components/product-specifications-editor";

describe("ProductSpecificationsEditor", () => {
    it("shows an empty state when no specifications exist", () => {
        render(
            <ProductSpecificationsEditor onChange={vi.fn()} />
        );

        expect(
            screen.getByText("No specifications added yet.")
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Add specification",
            })
        ).toBeInTheDocument();
    });

    it("adds a specification row without an ID", () => {
        const onChange = vi.fn();

        render(
            <ProductSpecificationsEditor onChange={onChange} />
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Add specification",
            })
        );

        expect(
            screen.getByLabelText("Specification name")
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText("Value")
        ).toBeInTheDocument();

        expect(onChange).toHaveBeenLastCalledWith([
            {
                name: "",
                value: "",
                sort_order: 0,
            },
        ]);
    });

    it("updates the specification name while preserving its ID", () => {
        const onChange = vi.fn();

        const initialSpecifications: InitialProductSpecification[] = [
            {
                id: "spec-1",
                name: "First-stage type",
                value: "Diaphragm",
                sort_order: 0,
            },
        ];

        render(
            <ProductSpecificationsEditor
                initialSpecifications={initialSpecifications}
                onChange={onChange}
            />
        );

        fireEvent.change(
            screen.getByLabelText("Specification name"),
            {
                target: {
                    value: "First stage",
                },
            }
        );

        expect(onChange).toHaveBeenLastCalledWith([
            {
                id: "spec-1",
                name: "First stage",
                value: "Diaphragm",
                sort_order: 0,
            },
        ]);
    });

    it("updates the specification value while preserving its ID", () => {
        const onChange = vi.fn();

        const initialSpecifications: InitialProductSpecification[] = [
            {
                id: "spec-1",
                name: "First-stage type",
                value: "Diaphragm",
                sort_order: 0,
            },
        ];

        render(
            <ProductSpecificationsEditor
                initialSpecifications={initialSpecifications}
                onChange={onChange}
            />
        );

        fireEvent.change(
            screen.getByLabelText("Value"),
            {
                target: {
                    value: "Balanced diaphragm",
                },
            }
        );

        expect(onChange).toHaveBeenLastCalledWith([
            {
                id: "spec-1",
                name: "First-stage type",
                value: "Balanced diaphragm",
                sort_order: 0,
            },
        ]);
    });

    it("loads existing specifications and preserves their IDs", () => {
        const initialSpecifications: InitialProductSpecification[] = [
            {
                id: "spec-1",
                name: "First-stage type",
                value: "Diaphragm",
                sort_order: 0,
            },
            {
                id: "spec-2",
                name: "Number of ports",
                value: 4,
                sort_order: 1,
            },
        ];

        const onChange = vi.fn();

        render(
            <ProductSpecificationsEditor
                initialSpecifications={initialSpecifications}
                onChange={onChange}
            />
        );

        expect(
            screen.getByDisplayValue("First-stage type")
        ).toBeInTheDocument();

        expect(
            screen.getByDisplayValue("Diaphragm")
        ).toBeInTheDocument();

        expect(
            screen.getByDisplayValue("Number of ports")
        ).toBeInTheDocument();

        expect(
            screen.getByDisplayValue("4")
        ).toBeInTheDocument();

        fireEvent.change(
            screen.getAllByLabelText("Value")[0],
            {
                target: {
                    value: "Balanced diaphragm",
                },
            }
        );

        expect(onChange).toHaveBeenLastCalledWith([
            {
                id: "spec-1",
                name: "First-stage type",
                value: "Balanced diaphragm",
                sort_order: 0,
            },
            {
                id: "spec-2",
                name: "Number of ports",
                value: "4",
                sort_order: 1,
            },
        ]);
    });

    it("removes a specification and preserves remaining IDs and order", () => {
        const onChange = vi.fn();

        const initialSpecifications: InitialProductSpecification[] = [
            {
                id: "spec-1",
                name: "First-stage type",
                value: "Diaphragm",
                sort_order: 0,
            },
            {
                id: "spec-2",
                name: "Number of ports",
                value: "4",
                sort_order: 1,
            },
        ];

        render(
            <ProductSpecificationsEditor
                initialSpecifications={initialSpecifications}
                onChange={onChange}
            />
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Remove specification 1",
            })
        );

        expect(
            screen.queryByDisplayValue("First-stage type")
        ).not.toBeInTheDocument();

        expect(
            screen.getByDisplayValue("Number of ports")
        ).toBeInTheDocument();

        expect(onChange).toHaveBeenLastCalledWith([
            {
                id: "spec-2",
                name: "Number of ports",
                value: "4",
                sort_order: 0,
            },
        ]);
    });

    it("keeps new specifications without IDs when existing specifications are edited", () => {
        const onChange = vi.fn();

        render(
            <ProductSpecificationsEditor
                initialSpecifications={[
                    {
                        id: "spec-1",
                        name: "First-stage type",
                        value: "Diaphragm",
                        sort_order: 0,
                    },
                ]}
                onChange={onChange}
            />
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Add specification",
            })
        );

        expect(onChange).toHaveBeenLastCalledWith([
            {
                id: "spec-1",
                name: "First-stage type",
                value: "Diaphragm",
                sort_order: 0,
            },
            {
                name: "",
                value: "",
                sort_order: 1,
            },
        ]);
    });

    it("disables the editor controls when disabled", () => {
        render(
            <ProductSpecificationsEditor
                initialSpecifications={[
                    {
                        id: "spec-1",
                        name: "First-stage type",
                        value: "Diaphragm",
                        sort_order: 0,
                    },
                ]}
                onChange={vi.fn()}
                disabled
            />
        );

        expect(
            screen.getByRole("button", {
                name: "Add specification",
            })
        ).toBeDisabled();

        expect(
            screen.getByLabelText("Specification name")
        ).toBeDisabled();

        expect(
            screen.getByLabelText("Value")
        ).toBeDisabled();

        expect(
            screen.getByRole("button", {
                name: "Remove specification 1",
            })
        ).toBeDisabled();
    });
});