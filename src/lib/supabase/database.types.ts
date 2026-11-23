
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_logs": {
                  Row: {
                    "action": string,"actor_user_id": string | null,"created_at": string,"details": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_user_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"id"?: string
                  }
                  Update: {
                    "action"?: string,"actor_user_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"brands": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"is_active": boolean,"logo_alt_text": string | null,"logo_mime_type": string | null,"logo_path": string | null,"logo_size_bytes": number | null,"name": string,"slug": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"logo_alt_text"?: string | null,"logo_mime_type"?: string | null,"logo_path"?: string | null,"logo_size_bytes"?: number | null,"name": string,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"logo_alt_text"?: string | null,"logo_mime_type"?: string | null,"logo_path"?: string | null,"logo_size_bytes"?: number | null,"name"?: string,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"is_active": boolean,"name": string,"parent_id": string | null,"slug": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"parent_id"?: string | null,"slug": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"parent_id"?: string | null,"slug"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"membership_plans": {
                  Row: {
                    "code": string,"created_at": string,"currency": string,"description": string | null,"duration_months": number,"id": string,"is_active": boolean,"name": string,"price_minor_units": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"currency"?: string,"description"?: string | null,"duration_months"?: number,"id"?: string,"is_active"?: boolean,"name": string,"price_minor_units": number,"updated_at"?: string
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"currency"?: string,"description"?: string | null,"duration_months"?: number,"id"?: string,"is_active"?: boolean,"name"?: string,"price_minor_units"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"memberships": {
                  Row: {
                    "created_at": string,"expires_at": string | null,"id": string,"plan_id": string,"starts_at": string | null,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at"?: string | null,"id"?: string,"plan_id": string,"starts_at"?: string | null,"status"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string | null,"id"?: string,"plan_id"?: string,"starts_at"?: string | null,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "membership_plans"
      referencedColumns: ["id"]
    }
                  ]
                },"product_images": {
                  Row: {
                    "alt_text": string,"created_at": string,"file_size_bytes": number,"height": number | null,"id": string,"image_type": string,"is_primary": boolean,"mime_type": string,"product_id": string,"sort_order": number,"storage_path": string,"updated_at": string,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text": string,"created_at"?: string,"file_size_bytes": number,"height"?: number | null,"id"?: string,"image_type"?: string,"is_primary"?: boolean,"mime_type": string,"product_id": string,"sort_order"?: number,"storage_path": string,"updated_at"?: string,"width"?: number | null
                  }
                  Update: {
                    "alt_text"?: string,"created_at"?: string,"file_size_bytes"?: number,"height"?: number | null,"id"?: string,"image_type"?: string,"is_primary"?: boolean,"mime_type"?: string,"product_id"?: string,"sort_order"?: number,"storage_path"?: string,"updated_at"?: string,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_images_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"product_specifications": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"product_id": string,"sort_order": number,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"product_id": string,"sort_order"?: number,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"product_id"?: string,"sort_order"?: number,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_specifications_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "brand_id": string,"category_id": string,"created_at": string,"description": string | null,"id": string,"is_active": boolean,"is_published": boolean,"model_number": string | null,"name": string,"published_at": string | null,"slug": string,"subcategory_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand_id": string,"category_id": string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"is_published"?: boolean,"model_number"?: string | null,"name": string,"published_at"?: string | null,"slug": string,"subcategory_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "brand_id"?: string,"category_id"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"is_published"?: boolean,"model_number"?: string | null,"name"?: string,"published_at"?: string | null,"slug"?: string,"subcategory_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_brand_id_fkey"
      columns: ["brand_id"]
isOneToOne: false
      referencedRelation: "brands"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_subcategory_parent_fk"
      columns: ["subcategory_id","category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id","parent_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_path": string | null,"created_at": string,"display_name": string | null,"id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_path"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"updated_at"?: string
                  }
                  Update: {
                    "avatar_path"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"role"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "has_active_membership":
{ Args: { "checked_user_id": string }; Returns: boolean
                           },
"has_role":
{ Args: { "checked_role": string,"checked_user_id": string }; Returns: boolean
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
