import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Settings = {
  km_faellig_tag: number;
  km_foto_pflicht: boolean;
  aussteuern_max_km: number;
  aussteuern_max_alter_monate: number;
  aussteuern_vorlauf_monate: number;
};

export const DEFAULT_SETTINGS: Settings = {
  km_faellig_tag: 10,
  km_foto_pflicht: false,
  aussteuern_max_km: 150000,
  aussteuern_max_alter_monate: 60,
  aussteuern_vorlauf_monate: 3,
};

export const getSettings = cache(async (): Promise<Settings> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select(Object.keys(DEFAULT_SETTINGS).join(", "))
    .eq("id", 1)
    .maybeSingle();
  return { ...DEFAULT_SETTINGS, ...((data as Partial<Settings> | null) ?? {}) };
});
