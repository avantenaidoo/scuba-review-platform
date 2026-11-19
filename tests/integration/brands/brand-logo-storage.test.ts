// @vitest-environment node

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const adminEmail = process.env.SUPABASE_TEST_ADMIN_EMAIL;
const adminPassword = process.env.SUPABASE_TEST_ADMIN_PASSWORD;
const memberEmail = process.env.SUPABASE_TEST_MEMBER_EMAIL;
const memberPassword = process.env.SUPABASE_TEST_MEMBER_PASSWORD;

const requiredValues = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    SUPABASE_TEST_ADMIN_EMAIL: adminEmail,
    SUPABASE_TEST_ADMIN_PASSWORD: adminPassword,
    SUPABASE_TEST_MEMBER_EMAIL: memberEmail,
    SUPABASE_TEST_MEMBER_PASSWORD: memberPassword,
};

for (const [key, value] of Object.entries(requiredValues)) {
    if (!value) {
        throw new Error(`Missing ${key}. Check your .env.test.local file.`);
    }
}

const BUCKET = "brand-logos";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const image = () =>
    new Blob(["integration test image"], { type: "image/webp" });

describe("Brand logo storage integration", () => {
    const anonymousClient = createClient(supabaseUrl!, anonKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const adminClient = createClient(supabaseUrl!, anonKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const memberClient = createClient(supabaseUrl!, anonKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const storagePath = `integration-tests/${randomUUID()}.webp`;

    let uploaded = false;

    beforeAll(async () => {
        const [adminLogin, memberLogin] = await Promise.all([
            adminClient.auth.signInWithPassword({
                email: adminEmail!,
                password: adminPassword!,
            }),
            memberClient.auth.signInWithPassword({
                email: memberEmail!,
                password: memberPassword!,
            }),
        ]);

        if (adminLogin.error) {
            throw new Error(`Admin login failed: ${adminLogin.error.message}`);
        }

        if (memberLogin.error) {
            throw new Error(`Member login failed: ${memberLogin.error.message}`);
        }

        const { error } = await adminClient.storage
            .from(BUCKET)
            .upload(storagePath, image(), {
                contentType: "image/webp",
                upsert: false,
            });

        if (error) {
            throw new Error(`Admin logo upload failed: ${error.message}`);
        }

        uploaded = true;
    }, 20_000);

    afterAll(async () => {
        if (uploaded) {
            await adminClient.storage.from(BUCKET).remove([storagePath]);
        }

        await Promise.all([
            adminClient.auth.signOut(),
            memberClient.auth.signOut(),
        ]);
    }, 20_000);

    it("rejects anonymous uploads", async () => {
        const { error } = await anonymousClient.storage
            .from(BUCKET)
            .upload(`integration-tests/${randomUUID()}.webp`, image(), {
                contentType: "image/webp",
            });

        expect(error).not.toBeNull();
    });

    it("rejects member uploads", async () => {
        const { error } = await memberClient.storage
            .from(BUCKET)
            .upload(`integration-tests/${randomUUID()}.webp`, image(), {
                contentType: "image/webp",
            });

        expect(error).not.toBeNull();
    });

    it("rejects member updates and deletions", async () => {
        const updateResult = await memberClient.storage
            .from(BUCKET)
            .update(storagePath, image(), {
                contentType: "image/webp",
            });

        expect(updateResult.error).not.toBeNull();

        await memberClient.storage
            .from(BUCKET)
            .remove([storagePath]);

        // RLS may silently filter DELETE without returning an error.
        const verification = await adminClient.storage
            .from(BUCKET)
            .download(storagePath);

        expect(verification.error).toBeNull();
        expect(verification.data).not.toBeNull();
    });

    it("allows administrators to create signed logo URLs", async () => {
        const { data, error } = await adminClient.storage
            .from(BUCKET)
            .createSignedUrl(storagePath, 3600);

        expect(error).toBeNull();
        expect(data?.signedUrl).toBeTruthy();
    });

    it("allows administrators to replace and delete logos", async () => {
        const updateResult = await adminClient.storage
            .from(BUCKET)
            .update(storagePath, image(), {
                contentType: "image/webp",
            });

        expect(updateResult.error).toBeNull();

        const deleteResult = await adminClient.storage
            .from(BUCKET)
            .remove([storagePath]);

        expect(deleteResult.error).toBeNull();

        uploaded = false;
    });

    it("rejects unsupported image MIME types", async () => {
        const { error } = await adminClient.storage
            .from(BUCKET)
            .upload(
                `integration-tests/${randomUUID()}.gif`,
                new Blob(["not an allowed image"], { type: "image/gif" }),
                { contentType: "image/gif" }
            );

        expect(error).not.toBeNull();
    });

    it("rejects files exceeding 5 MiB", async () => {
        const oversizedImage = new Blob(
            [new Uint8Array(MAX_FILE_SIZE + 1)],
            { type: "image/webp" }
        );

        const { error } = await adminClient.storage
            .from(BUCKET)
            .upload(
                `integration-tests/${randomUUID()}.webp`,
                oversizedImage,
                { contentType: "image/webp" }
            );

        expect(error).not.toBeNull();
    });
});