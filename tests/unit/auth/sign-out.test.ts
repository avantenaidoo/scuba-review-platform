
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(),
}));

import { signOutAction } from "@/components/auth/actions";
import { createClient } from "@/lib/supabase/server";

describe("signOutAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("signs out the current user", async () => {
        const signOut = vi.fn().mockResolvedValue({
            error: null,
        });

        vi.mocked(createClient).mockResolvedValue({
            auth: { signOut },
        } as never);

        await expect(signOutAction()).rejects.toMatchObject({
            digest: expect.stringContaining("NEXT_REDIRECT"),
        });

        expect(signOut).toHaveBeenCalledOnce();
    });

    it("redirects to the login page after signing out", async () => {
        const signOut = vi.fn().mockResolvedValue({
            error: null,
        });

        vi.mocked(createClient).mockResolvedValue({
            auth: { signOut },
        } as never);

        try {
            await signOutAction();
            throw new Error("Expected signOutAction to redirect.");
        } catch (error) {
            expect(error).toMatchObject({
                digest: expect.stringContaining("NEXT_REDIRECT"),
            });

            expect((error as { digest: string }).digest).toContain("/login");
        }

        expect(signOut).toHaveBeenCalledOnce();
    });
});
