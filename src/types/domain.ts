export type DecisionStatus = "Aprovado" | "Recusado" | "Pendente";

export type EquipmentAttachment = {
  name: string;
  url: string;
};

export type Equipment = {
  id: string;
  nome: string;
  sistemaProdutivo: string;
  convenioTermo: string;
  condicao: string;
  proprietario: string;
  valorEstimado: number;
  municipio: string;
  endereco: string;
  programa: string;
  descricao: string;
  anexos: EquipmentAttachment[];
  status: "Disponivel" | "Em analise" | "Solicitado";
};

export type Solicitation = {
  id: string;
  equipamentoId: string;
  equipamentoNome: string;
  nomeSolicitante: string;
  contatoSolicitante: string;
  localDestino: string;
  justificativa: string;
  nomeAdmin?: string;
  decisaoAdmin: DecisionStatus;
  observacoes?: string;
  dataSolicitacao: string;
};

export type OptionCatalog = {
  sistemasProdutivos: string[];
  condicoes: string[];
  programas: string[];
  municipios: string[];
  enderecosPorMunicipio: Record<string, string[]>;
};
