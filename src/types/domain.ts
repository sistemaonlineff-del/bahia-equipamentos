export type DecisionStatus = "Aprovado" | "Recusado" | "Pendente";
export type UserRole = "admin" | "usuario";

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
  emailSolicitante?: string;
  contatoSolicitante: string;
  localDestino: string;
  justificativa: string;
  nomeAdmin?: string;
  decisaoAdmin: DecisionStatus;
  observacoes?: string;
  arquivoDecisao?: EquipmentAttachment;
  dataSolicitacao: string;
};

export type AppUser = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  cargo: string;
  role: UserRole;
  telefone?: string;
  ativo: boolean;
};

export type NotificationItem = {
  id: string;
  solicitationId: string;
  recipientName: string;
  recipientEmail?: string;
  title: string;
  message: string;
  createdAt: string;
  status: "Enviada" | "Nao lida";
};

export type OptionCatalog = {
  sistemasProdutivos: string[];
  condicoes: string[];
  programas: string[];
  municipios: string[];
  enderecosPorMunicipio: Record<string, string[]>;
};
