import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    createClientMock,
    revalidatePathMock,
    listMock,
    updateMock,
    updateEqMock,
} = vi.hoisted(() => ({
    createClientMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    listMock: vi.fn(),
    updateMock: vi.fn(),
    updateEqMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: createClientMock,
}));

vi.mock("next/cache", () => ({
    revalidatePath: revalidatePathMock,
}));

import {
    saveBrandLogoAction,
    clearBrandLogoAction,
} from "@/features/brands/actions/brand-actions";

const validLogo = {
    name: "logo.webp",
    metadata: {
        mimetype: "image/webp",
        size: 1024,
    },
};

function mockAdminClient(role: string | null = "admin") {
    const supabase = {
        auth: {
            getClaims: vi.fn().mockResolvedValue({
                data: { claims: { sub: "user-123" } },
                error: null,
            }),
        },
        from: vi.fn((table: string) => {
            if (table === "user_roles") {
                return {
                    select: () => ({
                        eq: () => ({
                            maybeSingle: async () => ({
                                data: role ? { role } : null,
                                error: null,
                            }),
                        }),
                    }),
                };
            }

            return {
                select: () => ({
                    eq: () => ({
                        maybeSingle: async () => ({
                            data: { logo_path: "brand-123/old.webp" },
                            error: null,
                        }),
                    }),
                }),
                update: updateMock,
            };
        }),
        storage: {
            from: () => ({
                list: listMock,
            }),
        },
    };

    createClientMock.mockResolvedValue(supabase);
    return supabase;
}

describe("brand logo server actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        listMock.mockResolvedValue({
            data: [validLogo],
            error: null,
        });

        updateEqMock.mockResolvedValue({ error: null });
        updateMock.mockReturnValue({ eq: updateEqMock });
    });

    it("rejects unauthenticated users", async () => {
        createClientMock.mockResolvedValue({
            auth: {
                getClaims: vi.fn().mockResolvedValue({
                    data: { claims: null },
                    error: null,
                }),
            },
        });

        const result = await saveBrandLogoAction(
            "brand-123",
            "brand-123/logo.webp",
            "Aqua Lung logo",
            1024
        );

        expect(result.success).toBe(false);
        expect(listMock).not.toHaveBeenCalled();
    });

    it("rejects non-administrators", async () => {
        mockAdminClient("member");

        const result = await saveBrandLogoAction(
            "brand-123",
            "brand-123/logo.webp",
            "Aqua Lung logo",
            1024
        );

        expect(result).toEqual({
            success: false,
            error: "Administrator access required.",
        });
    });

    it("rejects invalid alternative text", async () => {
        mockAdminClient();

        const result = await saveBrandLogoAction(
            "brand-123",
            "brand-123/logo.webp",
            " ",
            1024
        );

        expect(result.success).toBe(false);
        expect(listMock).not.toHaveBeenCalled();
    });

    it("rejects invalid file sizes", async () => {
        mockAdminClient();

        const result = await saveBrandLogoAction(
            "brand-123",
            "brand-123/logo.webp",
            "Aqua Lung logo",
            0
        );

        expect(result.success).toBe(false);
        expect(listMock).not.toHaveBeenCalled();
    });

    it("rejects invalid storage paths", async () => {
        mockAdminClient();

        const result = await saveBrandLogoAction(
            "brand-123",
            "another-brand/logo.webp",
            "Aqua Lung logo",
            1024
        );

        expect(result.success).toBe(false);
        expect(listMock).not.toHaveBeenCalled();
    });

    it("rejects logos that do not exist in Storage", async () => {
        mockAdminClient();

        listMock.mockResolvedValue({
            data: [],
            error: null,
        });

        const result = await saveBrandLogoAction(
            "brand-123",
            "brand-123/logo.webp",
            "Aqua Lung logo",
            1024
        );

        expect(result).toEqual({
            success: false,
            error: "The uploaded logo could not be verified.",
        });

        expect(updateMock).not.toHaveBeenCalled();
    });

    it("rejects mismatched stored MIME types and sizes", async () => {
        mockAdminClient();

        listMock.mockResolvedValue({
            data: [{
                name: "logo.webp",
                metadata: {
                    mimetype: "image/png",
                    size: 2048,
                },
            }],
            error: null,
        });

        const result = await saveBrandLogoAction(
            "brand-123",
            "brand-123/logo.webp",
            "Aqua Lung logo",
            1024
        );

        expect(result.success).toBe(false);
        expect(updateMock).not.toHaveBeenCalled();
    });

    it("saves verified logo metadata for administrators", async () => {
        mockAdminClient();

        const result = await saveBrandLogoAction(
            "brand-123",
            "brand-123/logo.webp",
            " Aqua Lung logo ",
            1024
        );

        expect(result).toEqual({
            success: true,
            previousLogoPath: "brand-123/old.webp",
        });

        expect(updateMock).toHaveBeenCalledWith({
            logo_path: "brand-123/logo.webp",
            logo_alt_text: "Aqua Lung logo",
            logo_mime_type: "image/webp",
            logo_size_bytes: 1024,
        });

        expect(updateEqMock).toHaveBeenCalledWith("id", "brand-123");
        expect(revalidatePathMock).toHaveBeenCalledWith("/admin/brands");
    });

    it("clears logo metadata for administrators", async () => {
        mockAdminClient();

        const result = await clearBrandLogoAction("brand-123");

        expect(result).toEqual({
            success: true,
            previousLogoPath: "brand-123/old.webp",
        });

        expect(updateMock).toHaveBeenCalledWith({
            logo_path: null,
            logo_alt_text: null,
            logo_mime_type: null,
            logo_size_bytes: null,
        });
    });
});