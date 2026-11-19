import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    for (const key of [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_TEST_ADMIN_EMAIL",
        "SUPABASE_TEST_ADMIN_PASSWORD",
        "SUPABASE_TEST_MEMBER_EMAIL",
        "SUPABASE_TEST_MEMBER_PASSWORD",
    ]) {
        if (env[key]) {
            process.env[key] = env[key];
        }
    }

    return {
        plugins: [react()],
        resolve: {
            alias: {
                "@": path.resolve(import.meta.dirname, "./src"),
            },
        },
        test: {
            environment: "jsdom",
            globals: true,
            setupFiles: ["./tests/setup.ts"],
            include: [
                "tests/unit/**/*.test.{ts,tsx}",
                "tests/components/**/*.test.{ts,tsx}",
                "tests/integration/**/*.test.{ts,tsx}",
            ],
            coverage: {
                provider: "v8",
                reporter: ["text", "html"],
            },
        },
    };
});