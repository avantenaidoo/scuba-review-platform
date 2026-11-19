export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    display_name: string | null;
                    avatar_path: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    display_name?: string | null;
                    avatar_path?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    display_name?: string | null;
                    avatar_path?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            user_roles: {
                Row: {
                    user_id: string;
                    role: "member" | "admin";
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    role?: "member" | "admin";
                    created_at?: string;
                };
                Update: {
                    user_id?: string;
                    role?: "member" | "admin";
                    created_at?: string;
                };
                Relationships: [];
            };
            brands: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    description: string | null;
                    logo_path: string | null;
                    logo_alt_text: string | null;
                    logo_mime_type: string | null;
                    logo_size_bytes: number | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    description?: string | null;
                    logo_path?: string | null;
                    logo_alt_text?: string | null;
                    logo_mime_type?: string | null;
                    logo_size_bytes?: number | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    description?: string | null;
                    logo_path?: string | null;
                    logo_alt_text?: string | null;
                    logo_mime_type?: string | null;
                    logo_size_bytes?: number | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
        };
        Views: Record<never, never>;
        Functions: Record<never, never>;
        Enums: Record<never, never>;
        CompositeTypes: Record<never, never>;
    };
};