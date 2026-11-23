import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminContent } from "@/app/admin/page";

const mocks = vi.hoisted(() => ({
    connection: vi.fn(),
    createClient: vi.fn(),
    redirect: vi.fn(),
}));

vi.mock("next/server", () => ({
    connection: mocks.connection,
}));

vi.mock("next/navigation", () => ({
    redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: mocks.createClient,
}));

vi.mock("@/components/auth/actions", () => ({
    signOutAction: vi.fn(),
}));

vi.mock("next/link", () => ({
    default: ({
        href,
        children,
        ...props
    }: {
        href: string;
        children: React.ReactNode;
        className?: string;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

describe("Admin dashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.connection.mockResolvedValue(undefined);

        mocks.createClient.mockResolvedValue({
            auth: {
                getClaims: vi.fn().mockResolvedValue({
                    data: {
                        claims: {
                            sub: "admin-user-id",
                        },
                    },
                    error: null,
                }),
            },
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        maybeSingle: vi.fn().mockResolvedValue({
                            data: { role: "admin" },
                            error: null,
                        }),
                    })),
                })),
            })),
        });
    });

    it("renders the administrator dashboard", async () => {
        const dashboard = await AdminContent();

        render(dashboard);

        expect(
            screen.getByRole("heading", { name: "Admin Dashboard" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", { name: "Administration" })
        ).toBeInTheDocument();
    });

    it("provides navigation to brand management", async () => {
        const dashboard = await AdminContent();

        render(dashboard);

        expect(
            screen.getByRole("link", { name: /manage brands/i })
        ).toHaveAttribute("href", "/admin/brands");
    });

    it("displays categories and provides navigation to product management", async () => {
        const dashboard = await AdminContent();

        render(dashboard);

        expect(
            screen.getByRole("heading", { name: "Categories" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("link", { name: /manage categories/i })
        ).toHaveAttribute("href", "/admin/categories");

        expect(
            screen.getByRole("heading", { name: "Products" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("link", { name: /manage products/i })
        ).toHaveAttribute("href", "/admin/products");
    });

    it("does not display specifications or images as separate management areas", async () => {
        const dashboard = await AdminContent();

        render(dashboard);

        expect(
            screen.queryByRole("heading", { name: "Specifications" })
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole("heading", { name: "Product Images" })
        ).not.toBeInTheDocument();
    });
});