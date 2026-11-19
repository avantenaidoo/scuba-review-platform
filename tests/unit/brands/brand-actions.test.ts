import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    createClientMock,
    createBrandMock,
    updateBrandMock,
    setBrandActiveMock,
    revalidatePathMock,
} = vi.hoisted(() => ({
    createClientMock: vi.fn(),
    createBrandMock: vi.fn(),
    updateBrandMock: vi.fn(),
    setBrandActiveMock: vi.fn(),
    revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: createClientMock,
}));

vi.mock("next/cache", () => ({
    revalidatePath: revalidatePathMock,
}));

vi.mock("@/features/brands/services/brand-service", () => ({
    createBrand: createBrandMock,
    updateBrand: updateBrandMock,
    setBrandActive: setBrandActiveMock,
}));

import {
    createBrandAction,
    updateBrandAction,
    setBrandActiveAction,
} from "@/features/brands/actions/brand-actions";

function createFormData(name = "Aqua Lung", description = "Dive equipment") {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    return formData;
}

function mockAdminClient(role: string | null = "admin") {
    const supabase = {
        auth: {
            getClaims: vi.fn().mockResolvedValue({
                data: { claims: { sub: "user-123" } },
                error: null,
            }),
        },
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                        data: role ? { role } : null,
                        error: null,
                    }),
                }),
            }),
        }),
    };

    createClientMock.mockResolvedValue(supabase);
    return supabase;
}

describe("brand server actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createBrandMock.mockResolvedValue({});
        updateBrandMock.mockResolvedValue({});
        setBrandActiveMock.mockResolvedValue({});
    });

    it("rejects users who are not signed in", async () => {
        createClientMock.mockResolvedValue({
            auth: {
                getClaims: vi.fn().mockResolvedValue({
                    data: { claims: null },
                    error: null,
                }),
            },
        });

        const result = await createBrandAction(createFormData());

        expect(result).toEqual({
            success: false,
            error: "You must be signed in.",
        });
        expect(createBrandMock).not.toHaveBeenCalled();
    });

    it("rejects users who are not administrators", async () => {
        mockAdminClient("member");

        const result = await createBrandAction(createFormData());

        expect(result).toEqual({
            success: false,
            error: "Administrator access required.",
        });
        expect(createBrandMock).not.toHaveBeenCalled();
    });

    it("rejects invalid brand input", async () => {
        mockAdminClient();

        const result = await createBrandAction(createFormData("   "));

        expect(result).toEqual({
            success: false,
            error: "Brand name is required.",
        });
        expect(createBrandMock).not.toHaveBeenCalled();
    });

    it("creates a brand for an administrator", async () => {
        const supabase = mockAdminClient();

        const result = await createBrandAction(createFormData());

        expect(result).toEqual({ success: true });
        expect(createBrandMock).toHaveBeenCalledWith(supabase, {
            name: "Aqua Lung",
            slug: "aqua-lung",
            description: "Dive equipment",
        });
        expect(revalidatePathMock).toHaveBeenCalledWith("/admin/brands");
        expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    });

    it("updates a brand for an administrator", async () => {
        const supabase = mockAdminClient();

        const result = await updateBrandAction(
            "brand-123",
            createFormData("Scubapro", "Scuba equipment")
        );

        expect(result).toEqual({ success: true });
        expect(updateBrandMock).toHaveBeenCalledWith(supabase, "brand-123", {
            name: "Scubapro",
            slug: "scubapro",
            description: "Scuba equipment",
        });
    });

    it("changes brand activation for an administrator", async () => {
        const supabase = mockAdminClient();

        const result = await setBrandActiveAction("brand-123", false);

        expect(result).toEqual({ success: true });
        expect(setBrandActiveMock).toHaveBeenCalledWith(
            supabase,
            "brand-123",
            false
        );
    });

    it("does not expose database errors when creation fails", async () => {
        mockAdminClient();
        createBrandMock.mockRejectedValue(
            new Error("Database connection details")
        );

        const result = await createBrandAction(createFormData());

        expect(result).toEqual({
            success: false,
            error: "Unable to create the brand. Check that its name is not already in use.",
        });
    });
});
