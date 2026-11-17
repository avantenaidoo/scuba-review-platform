
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(),
}));

import { signUpAction } from "@/components/auth/actions";
import { createClient } from "@/lib/supabase/server";

describe("signUpAction", () => {
    it("rejects registration when required fields are missing", async () => {
        const formData = new FormData();
        formData.set("email", "diver@example.com");

        const result = await signUpAction(
            { error: null, success: null },
            formData
        );

        expect(result).toEqual({
            error: "Please complete all fields.",
            success: null,
        });

        expect(createClient).not.toHaveBeenCalled();
    });

    it("rejects an invalid email address", async () => {
        const formData = new FormData();
        formData.set("display_name", "Test Diver");
        formData.set("email", "invalid-email");
        formData.set("password", "securepass123");
        formData.set("confirm_password", "securepass123");

        const result = await signUpAction(
            { error: null, success: null },
            formData
        );

        expect(result).toEqual({
            error: "Please enter a valid email address.",
            success: null,
        });

        expect(createClient).not.toHaveBeenCalled();
    });

    it("rejects a display name longer than 100 characters", async () => {
        const formData = new FormData();
        formData.set("display_name", "A".repeat(101));
        formData.set("email", "diver@example.com");
        formData.set("password", "securepass123");
        formData.set("confirm_password", "securepass123");

        const result = await signUpAction(
            { error: null, success: null },
            formData
        );

        expect(result).toEqual({
            error: "Your name must be 100 characters or fewer.",
            success: null,
        });

        expect(createClient).not.toHaveBeenCalled();
    });

    it("rejects passwords shorter than 8 characters", async () => {
        const formData = new FormData();
        formData.set("display_name", "Test Diver");
        formData.set("email", "diver@example.com");
        formData.set("password", "short");
        formData.set("confirm_password", "short");

        const result = await signUpAction(
            { error: null, success: null },
            formData
        );

        expect(result).toEqual({
            error: "Your password must contain at least 8 characters.",
            success: null,
        });

        expect(createClient).not.toHaveBeenCalled();
    });

    it("rejects passwords that do not match", async () => {
        const formData = new FormData();
        formData.set("display_name", "Test Diver");
        formData.set("email", "diver@example.com");
        formData.set("password", "securepass123");
        formData.set("confirm_password", "differentpass123");

        const result = await signUpAction(
            { error: null, success: null },
            formData
        );

        expect(result).toEqual({
            error: "Your passwords do not match.",
            success: null,
        });

        expect(createClient).not.toHaveBeenCalled();
    });

    it("successfully registers a user with normalized input", async () => {
        const signUp = vi.fn().mockResolvedValue({
            data: { session: null },
            error: null,
        });

        vi.mocked(createClient).mockResolvedValue({
            auth: { signUp },
        } as never);

        const formData = new FormData();
        formData.set("display_name", "  Test Diver  ");
        formData.set("email", "  DIVER@EXAMPLE.COM  ");
        formData.set("password", "securepass123");
        formData.set("confirm_password", "securepass123");

        const result = await signUpAction(
            { error: null, success: null },
            formData
        );

        expect(signUp).toHaveBeenCalledWith({
            email: "diver@example.com",
            password: "securepass123",
            options: {
                data: {
                    display_name: "Test Diver",
                },
            },
        });

        expect(result).toEqual({
            error: null,
            success: "Registration successful. Please check your email to confirm your account.",
        });
    });

    it("returns an error when Supabase registration fails", async () => {
        const signUp = vi.fn().mockResolvedValue({
            data: { session: null },
            error: { message: "Registration failed" },
        });

        vi.mocked(createClient).mockResolvedValue({
            auth: { signUp },
        } as never);

        const formData = new FormData();
        formData.set("display_name", "Test Diver");
        formData.set("email", "diver@example.com");
        formData.set("password", "securepass123");
        formData.set("confirm_password", "securepass123");

        const result = await signUpAction(
            { error: null, success: null },
            formData
        );

        expect(result).toEqual({
            error: "Registration failed",
            success: null,
        });
    });

    it("redirects to the member dashboard when registration creates a session", async () => {
        const signUp = vi.fn().mockResolvedValue({
            data: { session: { access_token: "test-token" } },
            error: null,
        });

        vi.mocked(createClient).mockResolvedValue({
            auth: { signUp },
        } as never);

        const formData = new FormData();
        formData.set("display_name", "Test Diver");
        formData.set("email", "diver@example.com");
        formData.set("password", "securepass123");
        formData.set("confirm_password", "securepass123");

        await expect(
            signUpAction(
                { error: null, success: null },
                formData
            )
        ).rejects.toMatchObject({
            digest: expect.stringContaining("NEXT_REDIRECT"),
        });
    });
});
