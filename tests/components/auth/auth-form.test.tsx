
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthForm } from "@/components/auth/auth-form";
import type { AuthState } from "@/components/auth/actions";

const mockAction = vi.fn(async (): Promise<AuthState> => ({
    error: null,
    success: null,
}));

describe("AuthForm", () => {
    describe("login mode", () => {
        it("displays the login heading and description", () => {
            render(<AuthForm mode="login" action={mockAction} />);

            expect(
                screen.getByRole("heading", { name: "Welcome back" })
            ).toBeInTheDocument();

            expect(
                screen.getByText("Sign in to access your account.")
            ).toBeInTheDocument();
        });

        it("displays the email and password fields", () => {
            render(<AuthForm mode="login" action={mockAction} />);

            expect(
                screen.getByLabelText("Email address")
            ).toHaveAttribute("type", "email");

            expect(
                screen.getByLabelText("Password")
            ).toHaveAttribute("type", "password");
        });

        it("does not display registration-only fields", () => {
            render(<AuthForm mode="login" action={mockAction} />);

            expect(
                screen.queryByLabelText("Full name")
            ).not.toBeInTheDocument();

            expect(
                screen.queryByLabelText("Confirm password")
            ).not.toBeInTheDocument();
        });

        it("displays the sign-in button and registration link", () => {
            render(<AuthForm mode="login" action={mockAction} />);

            expect(
                screen.getByRole("button", { name: "Sign in" })
            ).toBeInTheDocument();

            expect(
                screen.getByRole("link", { name: "Register" })
            ).toHaveAttribute("href", "/register");
        });
    });

    describe("register mode", () => {
        it("displays the registration heading and description", () => {
            render(<AuthForm mode="register" action={mockAction} />);

            expect(
                screen.getByRole("heading", {
                    name: "Create your account",
                })
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    "Register to join the scuba equipment review community."
                )
            ).toBeInTheDocument();
        });

        it("displays all required registration fields", () => {
            render(<AuthForm mode="register" action={mockAction} />);

            expect(
                screen.getByLabelText("Full name")
            ).toBeInTheDocument();

            expect(
                screen.getByLabelText("Email address")
            ).toBeInTheDocument();

            expect(
                screen.getByLabelText("Password")
            ).toBeInTheDocument();

            expect(
                screen.getByLabelText("Confirm password")
            ).toBeInTheDocument();
        });

        it("displays the create-account button and login link", () => {
            render(<AuthForm mode="register" action={mockAction} />);

            expect(
                screen.getByRole("button", { name: "Create account" })
            ).toBeInTheDocument();

            expect(
                screen.getByRole("link", { name: "Sign in" })
            ).toHaveAttribute("href", "/login");
        });

        it("applies the registration input constraints", () => {
            render(<AuthForm mode="register" action={mockAction} />);

            expect(screen.getByLabelText("Full name")).toHaveAttribute(
                "maxLength",
                "100"
            );

            expect(screen.getByLabelText("Password")).toHaveAttribute(
                "minLength",
                "8"
            );

            expect(
                screen.getByLabelText("Confirm password")
            ).toHaveAttribute("minLength", "8");
        });
    });
});
