
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(),
}));

import { signInAction } from "@/components/auth/actions";
import { createClient } from "@/lib/supabase/server";

describe("signInAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects sign-in when email and password are missing", async () => {
        const formData = new FormData();

        const result = await signInAction(
            { error: null, success: null },
            formData
        );

        expect(result).toEqual({
            error: "Please enter your email and password.",
            success: null,
        });

        expect(createClient).not.toHaveBeenCalled();
    });

    it("rejects sign-in when the email is missing", async () => {
        const formData = new FormData();
        formData.set("password", "securepass123");

        const result = await signInAction(
            { error: null, success: null },
            formData
        );

        expect(result).toEqual({
            error: "Please enter your email and password.",
            success: null,
        });

        expect(createClient).not.toHaveBeenCalled();
    });

    it("rejects sign-in when the password is missing", async () => {
        const formData = new FormData();
        formData.set("email", "diver@example.com");

        const result = await signInAction(
            { error: null, success: null },
            formData
        );

        expect(result).toEqual({
            error: "Please enter your email and password.",
            success: null,
        });

        expect(createClient).not.toHaveBeenCalled();
    });

    it("normalizes the email address before signing in", async () => {
        const signInWithPassword = vi.fn().mockResolvedValue({
            error: { message: "Invalid login credentials" },
        });

        vi.mocked(createClient).mockResolvedValue({
            auth: { signInWithPassword },
        } as never);

        const formData = new FormData();
        formData.set("email", "  DIVER@EXAMPLE.COM  ");
        formData.set("password", "securepass123");

        await signInAction(
            { error: null, success: null },
            formData
        );

        expect(signInWithPassword).toHaveBeenCalledWith({
            email: "diver@example.com",
            password: "securepass123",
        });
    });


    it("redirects to the member dashboard after successful sign-in", async () => {
        const signInWithPassword = vi.fn().mockResolvedValue({
            data: { user: { id: "member-123" } },
            error: null,
        });

        const maybeSingle = vi.fn().mockResolvedValue({
            data: { role: "member" },
            error: null,
        });
        const eq = vi.fn().mockReturnValue({ maybeSingle });
        const select = vi.fn().mockReturnValue({ eq });
        const from = vi.fn().mockReturnValue({ select });

        vi.mocked(createClient).mockResolvedValue({
            auth: { signInWithPassword },
            from,
        } as never);

        const formData = new FormData();
        formData.set("email", "diver@example.com");
        formData.set("password", "securepass123");

        await expect(
            signInAction({ error: null, success: null }, formData)
        ).rejects.toMatchObject({
            digest: expect.stringContaining("NEXT_REDIRECT"),
        });

        expect(from).toHaveBeenCalledWith("user_roles");
        expect(signInWithPassword).toHaveBeenCalledWith({
            email: "diver@example.com",
            password: "securepass123",
        });
    });


    it("redirects an admin to the admin dashboard after successful sign-in", async () => {
        const signInWithPassword = vi.fn().mockResolvedValue({
            data: { user: { id: "admin-123" } },
            error: null,
        });

        const maybeSingle = vi.fn().mockResolvedValue({
            data: { role: "admin" },
            error: null,
        });
        const eq = vi.fn().mockReturnValue({ maybeSingle });
        const select = vi.fn().mockReturnValue({ eq });
        const from = vi.fn().mockReturnValue({ select });

        vi.mocked(createClient).mockResolvedValue({
            auth: { signInWithPassword },
            from,
        } as never);

        const formData = new FormData();
        formData.set("email", "admin@example.com");
        formData.set("password", "securepass123");

        await expect(
            signInAction({ error: null, success: null }, formData)
        ).rejects.toMatchObject({
            digest: expect.stringContaining("NEXT_REDIRECT"),
        });

        expect(from).toHaveBeenCalledWith("user_roles");
    });


    it("signs out and returns an error when role verification fails", async () => {
        const signInWithPassword = vi.fn().mockResolvedValue({
            data: { user: { id: "user-123" } },
            error: null,
        });
        const signOut = vi.fn();

        const maybeSingle = vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
        });
        const eq = vi.fn().mockReturnValue({ maybeSingle });
        const select = vi.fn().mockReturnValue({ eq });
        const from = vi.fn().mockReturnValue({ select });

        vi.mocked(createClient).mockResolvedValue({
            auth: { signInWithPassword, signOut },
            from,
        } as never);

        const formData = new FormData();
        formData.set("email", "diver@example.com");
        formData.set("password", "securepass123");

        const result = await signInAction(
            { error: null, success: null },
            formData
        );

        expect(result).toEqual({
            error: "Unable to verify your account permissions. Please try again.",
            success: null,
        });

        expect(signOut).toHaveBeenCalledOnce();
    });

    it("returns a generic error when authentication fails", async () => {
        const signInWithPassword = vi.fn().mockResolvedValue({
            error: { message: "Invalid login credentials" },
        });

        vi.mocked(createClient).mockResolvedValue({
            auth: { signInWithPassword },
        } as never);

        const formData = new FormData();
        formData.set("email", "diver@example.com");
        formData.set("password", "wrongpassword");

        const result = await signInAction(
            { error: null, success: null },
            formData
        );

        expect(result).toEqual({
            error: "Invalid email or password.",
            success: null,
        });
    });
});
