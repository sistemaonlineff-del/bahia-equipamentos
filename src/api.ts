import { createClient } from "@supabase/supabase-js";
import { mockEquipments, mockSolicitations, optionCatalog } from "./data/mock-data";
import type { Equipment, EquipmentAttachment, OptionCatalog, Solicitation } from "./types/domain";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

type LookupTable =
  | "municipios"
  | "sistemas_produtivos"
  | "condicoes"
  | "programas";

type EquipmentInsertPayload = Omit<Equipment, "id">;
type SolicitationInsertPayload = Omit<Solicitation, "id">;

async function ensureNamedRecord(table: LookupTable, nome: string) {
  if (!supabase) {
    throw new Error("Supabase nao configurado.");
  }

  const { data: existing, error: existingError } = await supabase
    .from(table)
    .select("id")
    .eq("nome", nome)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing.id as string;
  }

  const { data: inserted, error: insertError } = await supabase
    .from(table)
    .insert({ nome })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted.id as string;
}

async function ensureAddressRecord(municipioId: string, nome: string) {
  if (!supabase) {
    throw new Error("Supabase nao configurado.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("enderecos")
    .select("id")
    .eq("municipio_id", municipioId)
    .eq("nome", nome)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing.id as string;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("enderecos")
    .insert({ municipio_id: municipioId, nome })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted.id as string;
}

function mapEquipmentRecord(record: any): Equipment {
  return {
    id: String(record.id),
    nome: record.nome ?? "",
    sistemaProdutivo: record.sistemas_produtivos?.nome ?? "",
    convenioTermo: record.convenio_termo ?? "",
    condicao: record.condicoes?.nome ?? "",
    proprietario: record.proprietario ?? "",
    valorEstimado: Number(record.valor_estimado ?? 0),
    municipio: record.municipios?.nome ?? "",
    endereco: record.enderecos?.nome ?? "",
    programa: record.programas?.nome ?? "",
    descricao: record.descricao ?? "",
    anexos: Array.isArray(record.equipamento_anexos)
      ? record.equipamento_anexos.map(
          (item: any): EquipmentAttachment => ({
            name: item.nome_arquivo ?? "",
            url: item.caminho_storage ?? "",
          }),
        )
      : [],
    status: record.status ?? "Disponivel",
  };
}

function mapSolicitationRecord(record: any): Solicitation {
  return {
    id: String(record.id),
    equipamentoId: String(record.equipamento_id),
    equipamentoNome: record.equipamentos?.nome ?? "",
    nomeSolicitante: record.nome_solicitante ?? "",
    contatoSolicitante: record.contato_solicitante ?? "",
    localDestino: record.local_destino ?? "",
    justificativa: record.justificativa ?? "",
    nomeAdmin: record.nome_admin ?? undefined,
    decisaoAdmin: record.decisao_admin ?? "Pendente",
    observacoes: record.observacoes ?? undefined,
    dataSolicitacao: record.created_at?.slice(0, 10) ?? "2026-08-04",
  };
}

export const api = {
  isConnected: Boolean(supabase),

  async optionCatalog(): Promise<OptionCatalog> {
    return optionCatalog;
  },

  async equipments() {
    if (!supabase) {
      return { items: mockEquipments };
    }

    const { data, error } = await supabase
      .from("equipamentos")
      .select(`
        id,
        nome,
        convenio_termo,
        proprietario,
        valor_estimado,
        descricao,
        status,
        sistemas_produtivos(nome),
        condicoes(nome),
        municipios(nome),
        enderecos(nome),
        programas(nome),
        equipamento_anexos(nome_arquivo, caminho_storage)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { items: (data ?? []).map(mapEquipmentRecord) };
  },

  async solicitations() {
    if (!supabase) {
      return { items: mockSolicitations };
    }

    const { data, error } = await supabase
      .from("solicitacoes")
      .select(`
        id,
        equipamento_id,
        nome_solicitante,
        contato_solicitante,
        local_destino,
        justificativa,
        nome_admin,
        decisao_admin,
        observacoes,
        created_at,
        equipamentos(nome)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { items: (data ?? []).map(mapSolicitationRecord) };
  },

  async createEquipment(payload: EquipmentInsertPayload) {
    if (!supabase) {
      const localItem: Equipment = {
        ...payload,
        id: crypto.randomUUID(),
      };

      return {
        message: "Equipamento salvo localmente em modo mock.",
        item: localItem,
      };
    }

    const municipioId = await ensureNamedRecord("municipios", payload.municipio);
    const enderecoId = await ensureAddressRecord(municipioId, payload.endereco);
    const sistemaProdutivoId = await ensureNamedRecord(
      "sistemas_produtivos",
      payload.sistemaProdutivo,
    );
    const condicaoId = await ensureNamedRecord("condicoes", payload.condicao);
    const programaId = await ensureNamedRecord("programas", payload.programa);

    const { data: insertedEquipment, error: equipmentError } = await supabase
      .from("equipamentos")
      .insert({
        nome: payload.nome,
        sistema_produtivo_id: sistemaProdutivoId,
        convenio_termo: payload.convenioTermo,
        condicao_id: condicaoId,
        proprietario: payload.proprietario,
        valor_estimado: payload.valorEstimado,
        municipio_id: municipioId,
        endereco_id: enderecoId,
        programa_id: programaId,
        descricao: payload.descricao,
        status: payload.status,
      })
      .select(`
        id,
        nome,
        convenio_termo,
        proprietario,
        valor_estimado,
        descricao,
        status,
        sistemas_produtivos(nome),
        condicoes(nome),
        municipios(nome),
        enderecos(nome),
        programas(nome)
      `)
      .single();

    if (equipmentError) {
      throw equipmentError;
    }

    if (payload.anexos.length > 0) {
      const { error: attachmentError } = await supabase.from("equipamento_anexos").insert(
        payload.anexos.map((attachment) => ({
          equipamento_id: insertedEquipment.id,
          nome_arquivo: attachment.name,
          caminho_storage: attachment.url,
        })),
      );

      if (attachmentError) {
        throw attachmentError;
      }
    }

    return {
      message: "Equipamento salvo no Supabase.",
      item: {
        ...mapEquipmentRecord({
          ...insertedEquipment,
          equipamento_anexos: payload.anexos.map((attachment) => ({
            nome_arquivo: attachment.name,
            caminho_storage: attachment.url,
          })),
        }),
      },
    };
  },

  async createSolicitation(payload: SolicitationInsertPayload) {
    if (!supabase) {
      const localItem: Solicitation = {
        ...payload,
        id: crypto.randomUUID(),
      };

      return {
        message: "Solicitacao salva localmente em modo mock.",
        item: localItem,
      };
    }

    const { data: insertedSolicitation, error: solicitationError } = await supabase
      .from("solicitacoes")
      .insert({
        equipamento_id: payload.equipamentoId,
        nome_solicitante: payload.nomeSolicitante,
        contato_solicitante: payload.contatoSolicitante,
        local_destino: payload.localDestino,
        justificativa: payload.justificativa,
        nome_admin: payload.nomeAdmin ?? null,
        decisao_admin: payload.decisaoAdmin,
        observacoes: payload.observacoes ?? null,
      })
      .select(`
        id,
        equipamento_id,
        nome_solicitante,
        contato_solicitante,
        local_destino,
        justificativa,
        nome_admin,
        decisao_admin,
        observacoes,
        created_at,
        equipamentos(nome)
      `)
      .single();

    if (solicitationError) {
      throw solicitationError;
    }

    const { error: equipmentUpdateError } = await supabase
      .from("equipamentos")
      .update({ status: "Solicitado" })
      .eq("id", payload.equipamentoId);

    if (equipmentUpdateError) {
      throw equipmentUpdateError;
    }

    return {
      message: "Solicitacao salva no Supabase.",
      item: mapSolicitationRecord(insertedSolicitation),
    };
  },
};
