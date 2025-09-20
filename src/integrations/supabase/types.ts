export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "13.0.5";
    };
    public: {
        Tables: {
            data_uploads: {
                Row: {
                    error_details: Json | null;
                    filename: string;
                    id: string;
                    records_count: number;
                    records_errors: number;
                    records_processed: number;
                    status: string;
                    upload_date: string;
                    uploaded_by: string | null;
                };
                Insert: {
                    error_details?: Json | null;
                    filename: string;
                    id?: string;
                    records_count?: number;
                    records_errors?: number;
                    records_processed?: number;
                    status?: string;
                    upload_date?: string;
                    uploaded_by?: string | null;
                };
                Update: {
                    error_details?: Json | null;
                    filename?: string;
                    id?: string;
                    records_count?: number;
                    records_errors?: number;
                    records_processed?: number;
                    status?: string;
                    upload_date?: string;
                    uploaded_by?: string | null;
                };
                Relationships: [
                ];
            };
            fish_catches: {
                Row: {
                    catch_date: string;
                    created_at: string;
                    data_source: string | null;
                    depth_m: number | null;
                    fishing_method: string | null;
                    id: string;
                    is_anomaly: boolean | null;
                    latitude: number;
                    longitude: number;
                    notes: string | null;
                    quality_score: number | null;
                    quantity: number;
                    species_id: string;
                    updated_at: string;
                    vessel_name: string | null;
                    water_temperature: number | null;
                    weight_kg: number | null;
                };
                Insert: {
                    catch_date: string;
                    created_at?: string;
                    data_source?: string | null;
                    depth_m?: number | null;
                    fishing_method?: string | null;
                    id?: string;
                    is_anomaly?: boolean | null;
                    latitude: number;
                    longitude: number;
                    notes?: string | null;
                    quality_score?: number | null;
                    quantity: number;
                    species_id: string;
                    updated_at?: string;
                    vessel_name?: string | null;
                    water_temperature?: number | null;
                    weight_kg?: number | null;
                };
                Update: {
                    catch_date?: string;
                    created_at?: string;
                    data_source?: string | null;
                    depth_m?: number | null;
                    fishing_method?: string | null;
                    id?: string;
                    is_anomaly?: boolean | null;
                    latitude?: number;
                    longitude?: number;
                    notes?: string | null;
                    quality_score?: number | null;
                    quantity?: number;
                    species_id?: string;
                    updated_at?: string;
                    vessel_name?: string | null;
                    water_temperature?: number | null;
                    weight_kg?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "fish_catches_species_id_fkey";
                        columns: [
                            "species_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "species";
                        referencedColumns: [
                            "id"
                        ];
                    }
                ];
            };
            species: {
                Row: {
                    common_name: string | null;
                    created_at: string;
                    family: string | null;
                    id: string;
                    scientific_name: string;
                };
                Insert: {
                    common_name?: string | null;
                    created_at?: string;
                    family?: string | null;
                    id?: string;
                    scientific_name: string;
                };
                Update: {
                    common_name?: string | null;
                    created_at?: string;
                    family?: string | null;
                    id?: string;
                    scientific_name?: string;
                };
                Relationships: [
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];
export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
    Row: infer R;
} ? R : never : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
    Row: infer R;
} ? R : never : never;
export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
} ? I : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
} ? I : never : never;
export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
} ? U : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
} ? U : never : never;
export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | {
    schema: keyof DatabaseWithoutInternals;
}, EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never = never> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName] : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never;
export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | {
    schema: keyof DatabaseWithoutInternals;
}, CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never;
export const Constants = {
    public: {
        Enums: {},
    },
} as const;
