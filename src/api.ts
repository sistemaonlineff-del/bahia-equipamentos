import { createClient } from "@supabase/supabase-js";
import { mockEquipments, mockSolicitations, optionCatalog } from "./data/mock-data";
import type { Equipment, Solicitation } from "./types/domain";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const api = {
  async optionCatalog() {
    return optionCatalog;
  },
  async equipments() {
    return { items: mockEquipments };
  },
  async solicitations() {
    return { items: mockSolicitations };
  },
  async createEquipment(payload: Equipment) {
    return {
      message: "Equipamento preparado para persistencia no Supabase.",
      item: payload,
    };
  },
  async createSolicitation(payload: Solicitation) {
    return {
      message: "Solicitacao preparada para persistencia no Supabase.",
      item: payload,
    };
  },
};
