import {
  Boxes,
  ClipboardList,
  FileText,
  PackagePlus,
  Search,
  Send,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import logo1 from "../assets/logo_1.jpeg";
import logo2 from "../assets/logo_2.jpeg";
import { api } from "./api";
import { mockEquipments, mockSolicitations, optionCatalog } from "./data/mock-data";
import "./styles.css";
import type { Equipment, Solicitation } from "./types/domain";

type Page = "dashboard" | "novo" | "equipamentos" | "solicitacoes";

type EquipmentFormState = {
  nome: string;
  sistemaProdutivo: string;
  convenioTermo: string;
  condicao: string;
  proprietario: string;
  valorEstimado: string;
  municipio: string;
  endereco: string;
  programa: string;
  descricao: string;
  anexos: string;
};

type SolicitationFormState = {
  nomeSolicitante: string;
  contatoSolicitante: string;
  localDestino: string;
  justificativa: string;
};

const initialEquipmentForm: EquipmentFormState = {
  nome: "",
  sistemaProdutivo: optionCatalog.sistemasProdutivos[0],
  convenioTermo: "",
  condicao: optionCatalog.condicoes[0],
  proprietario: "",
  valorEstimado: "",
  municipio: optionCatalog.municipios[0],
  endereco: optionCatalog.enderecosPorMunicipio[optionCatalog.municipios[0]][0],
  programa: optionCatalog.programas[0],
  descricao: "",
  anexos: "",
};

const initialSolicitationForm: SolicitationFormState = {
  nomeSolicitante: "",
  contatoSolicitante: "",
  localDestino: "",
  justificativa: "",
};

const pageLabels: Record<Page, string> = {
  dashboard: "Painel",
  novo: "Cadastrar",
  equipamentos: "Equipamentos",
  solicitacoes: "Solicitacoes",
};

const pageDescriptions: Record<Page, string> = {
  dashboard: "Visao operacional da base, disponibilidade e pendencias.",
  novo: "Cadastro padronizado de equipamentos e dados operacionais.",
  equipamentos: "Consulta da base com busca rapida e acao de solicitacao.",
  solicitacoes: "Acompanhamento administrativo dos pedidos registrados.",
};

function currencyFormatter(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function dateFormatter(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T00:00:00`));
}

function statusClass(status: string) {
  if (status === "Disponivel" || status === "Aprovado") return "status-positive";
  if (status === "Solicitado" || status === "Recusado") return "status-negative";
  return "status-warning";
}

function AppShell({
  page,
  setPage,
  connected,
  statusMessage,
  children,
}: {
  page: Page;
  setPage: (page: Page) => void;
  connected: boolean;
  statusMessage?: string;
  children: React.ReactNode;
}) {
  const navItems: { id: Page; icon: React.ReactNode; caption: string }[] = [
    { id: "dashboard", icon: <Boxes size={18} />, caption: "Resumo" },
    { id: "novo", icon: <PackagePlus size={18} />, caption: "Novo registro" },
    { id: "equipamentos", icon: <Warehouse size={18} />, caption: "Base cadastrada" },
    { id: "solicitacoes", icon: <ClipboardList size={18} />, caption: "Fila de pedidos" },
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-panel">
          <div className="brand-logos">
            <img src={logo1} alt="Logo CAR" />
            <img src={logo2} alt="Logo Governo da Bahia" />
          </div>
          <div className="brand-copy">
            <strong>Bahia Equipamentos</strong>
            <span>Controle operacional</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === item.id ? "nav-link active" : "nav-link"}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-copy">
                <strong>{pageLabels[item.id]}</strong>
                <small>{item.caption}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-badge">
            <ShieldCheck size={16} />
            <span>Ambiente homologado para migracao do PowerApps</span>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="topbar-kicker">Sistema interno</span>
            <h1>Gestao de Equipamentos</h1>
            <p>{pageDescriptions[page]}</p>
          </div>
          <div className="topbar-meta">
            <div>
              <span>Ambiente</span>
              <strong>{connected ? "Supabase conectado" : "Mock operacional"}</strong>
            </div>
            <div>
              <span>Atualizacao</span>
              <strong>04/08/2026</strong>
            </div>
          </div>
        </header>
        {statusMessage ? <div className="status-banner">{statusMessage}</div> : null}
        {children}
      </section>
    </div>
  );
}

function PageFrame({
  page,
  actions,
  children,
}: {
  page: Page;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="page-frame">
      <section className="page-header">
        <div>
          <span className="section-label">{pageLabels[page]}</span>
          <h2>{pageDescriptions[page]}</h2>
        </div>
        {actions}
      </section>
      {children}
    </main>
  );
}

function DashboardPage({
  equipments,
  solicitations,
  goTo,
}: {
  equipments: Equipment[];
  solicitations: Solicitation[];
  goTo: (page: Page) => void;
}) {
  const availableCount = equipments.filter((item) => item.status === "Disponivel").length;
  const requestedCount = equipments.filter((item) => item.status === "Solicitado").length;
  const maintenanceCount = equipments.filter((item) => item.status === "Em analise").length;
  const totalEstimatedValue = equipments.reduce(
    (total, item) => total + Number(item.valorEstimado || 0),
    0,
  );
  const pendingCount = solicitations.filter((item) => item.decisaoAdmin === "Pendente").length;

  return (
    <PageFrame page="dashboard">
      <section className="metric-grid">
        <article className="metric-card">
          <span>Total cadastrado</span>
          <strong>{equipments.length}</strong>
          <small>Equipamentos na base</small>
        </article>
        <article className="metric-card">
          <span>Disponiveis</span>
          <strong>{availableCount}</strong>
          <small>Prontos para solicitacao</small>
        </article>
        <article className="metric-card">
          <span>Solicitados</span>
          <strong>{requestedCount}</strong>
          <small>Reservados no momento</small>
        </article>
        <article className="metric-card">
          <span>Em analise</span>
          <strong>{maintenanceCount}</strong>
          <small>Dependem de avaliacao</small>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Resumo da operacao</span>
              <h3>Indicadores principais</h3>
            </div>
          </div>
          <div className="summary-list">
            <div className="summary-row">
              <span>Valor estimado total</span>
              <strong>{currencyFormatter(totalEstimatedValue)}</strong>
            </div>
            <div className="summary-row">
              <span>Solicitacoes pendentes</span>
              <strong>{pendingCount}</strong>
            </div>
            <div className="summary-row">
              <span>Municipios atendidos</span>
              <strong>{new Set(equipments.map((item) => item.municipio)).size}</strong>
            </div>
            <div className="summary-row">
              <span>Programas ativos</span>
              <strong>{new Set(equipments.map((item) => item.programa)).size}</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Atalhos</span>
              <h3>Acoes rapidas</h3>
            </div>
          </div>
          <div className="quick-actions">
            <button type="button" className="action-button primary" onClick={() => goTo("novo")}>
              <PackagePlus size={16} />
              Novo cadastro
            </button>
            <button type="button" className="action-button" onClick={() => goTo("equipamentos")}>
              <Search size={16} />
              Consultar base
            </button>
            <button type="button" className="action-button" onClick={() => goTo("solicitacoes")}>
              <FileText size={16} />
              Ver solicitacoes
            </button>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Equipamentos recentes</span>
              <h3>Base cadastrada</h3>
            </div>
          </div>
          <div className="list-table">
            {equipments.slice(0, 5).map((equipment) => (
              <div key={equipment.id} className="list-row">
                <div>
                  <strong>{equipment.nome}</strong>
                  <small>{equipment.programa}</small>
                </div>
                <div>
                  <span>{equipment.municipio}</span>
                  <small>{equipment.endereco}</small>
                </div>
                <div>
                  <span className={`status-pill ${statusClass(equipment.status)}`}>
                    {equipment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Ultimas solicitacoes</span>
              <h3>Fila administrativa</h3>
            </div>
          </div>
          <div className="list-table">
            {solicitations.slice(0, 5).map((item) => (
              <div key={item.id} className="list-row">
                <div>
                  <strong>{item.equipamentoNome}</strong>
                  <small>{item.nomeSolicitante}</small>
                </div>
                <div>
                  <span>{dateFormatter(item.dataSolicitacao)}</span>
                  <small>{item.localDestino}</small>
                </div>
                <div>
                  <span className={`status-pill ${statusClass(item.decisaoAdmin)}`}>
                    {item.decisaoAdmin}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </PageFrame>
  );
}

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [equipments, setEquipments] = useState<Equipment[]>(mockEquipments);
  const [solicitations, setSolicitations] = useState<Solicitation[]>(mockSolicitations);
  const [equipmentForm, setEquipmentForm] = useState<EquipmentFormState>(initialEquipmentForm);
  const [solicitationForm, setSolicitationForm] = useState<SolicitationFormState>(initialSolicitationForm);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [equipmentResponse, solicitationResponse] = await Promise.all([
          api.equipments(),
          api.solicitations(),
        ]);

        if (!active) {
          return;
        }

        setEquipments(equipmentResponse.items);
        setSolicitations(solicitationResponse.items);
        setStatusMessage(
          api.isConnected
            ? "Dados carregados do Supabase."
            : "Supabase nao configurado. Exibindo dados locais.",
        );
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(error);
        setStatusMessage("Nao foi possivel carregar o banco. Exibindo dados locais.");
        setEquipments(mockEquipments);
        setSolicitations(mockSolicitations);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const filteredEquipments = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return equipments;

    return equipments.filter((equipment) =>
      [
        equipment.nome,
        equipment.municipio,
        equipment.programa,
        equipment.proprietario,
        equipment.endereco,
        equipment.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [equipments, search]);

  const availableAddresses = useMemo(() => {
    return optionCatalog.enderecosPorMunicipio[equipmentForm.municipio] ?? [];
  }, [equipmentForm.municipio]);

  function updateEquipmentForm<K extends keyof EquipmentFormState>(
    field: K,
    value: EquipmentFormState[K],
  ) {
    setEquipmentForm((current) => {
      if (field === "municipio") {
        const nextMunicipio = value as string;
        return {
          ...current,
          municipio: nextMunicipio,
          endereco: optionCatalog.enderecosPorMunicipio[nextMunicipio][0] ?? "",
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  function updateSolicitationForm<K extends keyof SolicitationFormState>(
    field: K,
    value: SolicitationFormState[K],
  ) {
    setSolicitationForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleEquipmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newEquipment = {
      nome: equipmentForm.nome,
      sistemaProdutivo: equipmentForm.sistemaProdutivo,
      convenioTermo: equipmentForm.convenioTermo,
      condicao: equipmentForm.condicao,
      proprietario: equipmentForm.proprietario,
      valorEstimado: Number(equipmentForm.valorEstimado || 0),
      municipio: equipmentForm.municipio,
      endereco: equipmentForm.endereco,
      programa: equipmentForm.programa,
      descricao: equipmentForm.descricao,
      anexos: equipmentForm.anexos
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      status: "Disponivel" as const,
    };

    try {
      const response = await api.createEquipment(newEquipment);
      setEquipments((current) => [response.item, ...current]);
      setEquipmentForm(initialEquipmentForm);
      setStatusMessage(response.message);
      setPage("equipamentos");
    } catch (error) {
      console.error(error);
      setStatusMessage("Nao foi possivel salvar o equipamento no banco.");
    }
  }

  async function handleSolicitationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEquipment) {
      return;
    }

    const newSolicitation = {
      equipamentoId: selectedEquipment.id,
      equipamentoNome: selectedEquipment.nome,
      nomeSolicitante: solicitationForm.nomeSolicitante,
      contatoSolicitante: solicitationForm.contatoSolicitante,
      localDestino: solicitationForm.localDestino,
      justificativa: solicitationForm.justificativa,
      decisaoAdmin: "Pendente" as const,
      observacoes: "Aguardando avaliacao administrativa.",
      dataSolicitacao: "2026-08-04",
    };

    try {
      const response = await api.createSolicitation(newSolicitation);
      setSolicitations((current) => [response.item, ...current]);
      setEquipments((current) =>
        current.map((equipment) =>
          equipment.id === selectedEquipment.id
            ? { ...equipment, status: "Solicitado" }
            : equipment,
        ),
      );
      setSolicitationForm(initialSolicitationForm);
      setSelectedEquipment(null);
      setStatusMessage(response.message);
      setPage("solicitacoes");
    } catch (error) {
      console.error(error);
      setStatusMessage("Nao foi possivel registrar a solicitacao no banco.");
    }
  }

  return (
    <AppShell
      page={page}
      setPage={setPage}
      connected={api.isConnected}
      statusMessage={statusMessage}
    >
      {page === "dashboard" && (
        <DashboardPage
          equipments={equipments}
          solicitations={solicitations}
          goTo={setPage}
        />
      )}

      {page === "novo" && (
        <PageFrame page="novo">
          <section className="panel">
              <div className="panel-header">
                <div>
                  <span className="section-label">Formulario</span>
                  <h3>Novo equipamento</h3>
                </div>
              </div>

              <form className="form-grid" onSubmit={handleEquipmentSubmit}>
                <label>
                  Nome do equipamento
                  <input
                    required
                    value={equipmentForm.nome}
                    onChange={(event) => updateEquipmentForm("nome", event.target.value)}
                  />
                </label>
                <label>
                  Sistema produtivo
                  <select
                    value={equipmentForm.sistemaProdutivo}
                    onChange={(event) =>
                      updateEquipmentForm("sistemaProdutivo", event.target.value)
                    }
                  >
                    {optionCatalog.sistemasProdutivos.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Convenio ou termo
                  <input
                    required
                    value={equipmentForm.convenioTermo}
                    onChange={(event) =>
                      updateEquipmentForm("convenioTermo", event.target.value)
                    }
                  />
                </label>
                <label>
                  Condicao
                  <select
                    value={equipmentForm.condicao}
                    onChange={(event) => updateEquipmentForm("condicao", event.target.value)}
                  >
                    {optionCatalog.condicoes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Proprietario
                  <input
                    required
                    value={equipmentForm.proprietario}
                    onChange={(event) =>
                      updateEquipmentForm("proprietario", event.target.value)
                    }
                  />
                </label>
                <label>
                  Valor estimado
                  <input
                    required
                    inputMode="decimal"
                    value={equipmentForm.valorEstimado}
                    onChange={(event) =>
                      updateEquipmentForm("valorEstimado", event.target.value)
                    }
                  />
                </label>
                <label>
                  Municipio
                  <select
                    value={equipmentForm.municipio}
                    onChange={(event) => updateEquipmentForm("municipio", event.target.value)}
                  >
                    {optionCatalog.municipios.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Endereco
                  <select
                    value={equipmentForm.endereco}
                    onChange={(event) => updateEquipmentForm("endereco", event.target.value)}
                  >
                    {availableAddresses.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Programa
                  <select
                    value={equipmentForm.programa}
                    onChange={(event) => updateEquipmentForm("programa", event.target.value)}
                  >
                    {optionCatalog.programas.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Anexos
                  <input
                    placeholder="Ex.: foto1.png, termo.pdf"
                    value={equipmentForm.anexos}
                    onChange={(event) => updateEquipmentForm("anexos", event.target.value)}
                  />
                </label>
                <label className="span-2">
                  Descricao
                  <textarea
                    rows={4}
                    value={equipmentForm.descricao}
                    onChange={(event) => updateEquipmentForm("descricao", event.target.value)}
                  />
                </label>
                <div className="form-actions span-2">
                  <button type="submit" className="primary-button">
                    Salvar equipamento
                  </button>
                </div>
              </form>
          </section>
        </PageFrame>
      )}

      {page === "equipamentos" && (
        <PageFrame
          page="equipamentos"
          actions={
            <div className="toolbar-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, municipio, programa, endereco ou status"
              />
            </div>
          }
        >
          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="section-label">Consulta</span>
                <h3>Base de equipamentos</h3>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Equipamento</th>
                    <th>Programa</th>
                    <th>Municipio</th>
                    <th>Condicao</th>
                    <th>Status</th>
                    <th>Valor</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipments.map((equipment) => (
                    <tr key={equipment.id}>
                      <td>
                        <div className="cell-stack">
                          <strong>{equipment.nome}</strong>
                          <span>{equipment.proprietario}</span>
                        </div>
                      </td>
                      <td>{equipment.programa}</td>
                      <td>
                        <div className="cell-stack">
                          <strong>{equipment.municipio}</strong>
                          <span>{equipment.endereco}</span>
                        </div>
                      </td>
                      <td>{equipment.condicao}</td>
                      <td>
                        <span className={`status-pill ${statusClass(equipment.status)}`}>
                          {equipment.status}
                        </span>
                      </td>
                      <td>{currencyFormatter(equipment.valorEstimado)}</td>
                      <td className="cell-action">
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => setSelectedEquipment(equipment)}
                        >
                          <Send size={14} />
                          Solicitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </PageFrame>
      )}

      {page === "solicitacoes" && (
        <PageFrame page="solicitacoes">
          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="section-label">Acompanhamento</span>
                <h3>Solicitacoes registradas</h3>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Equipamento</th>
                    <th>Solicitante</th>
                    <th>Destino</th>
                    <th>Status</th>
                    <th>Administrador</th>
                    <th>Observacoes</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitations.map((item) => (
                    <tr key={item.id}>
                      <td>{dateFormatter(item.dataSolicitacao)}</td>
                      <td>{item.equipamentoNome}</td>
                      <td>
                        <div className="cell-stack">
                          <strong>{item.nomeSolicitante}</strong>
                          <span>{item.contatoSolicitante}</span>
                        </div>
                      </td>
                      <td>{item.localDestino}</td>
                      <td>
                        <span className={`status-pill ${statusClass(item.decisaoAdmin)}`}>
                          {item.decisaoAdmin}
                        </span>
                      </td>
                      <td>{item.nomeAdmin ?? "A definir"}</td>
                      <td>{item.observacoes ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </PageFrame>
      )}

      {selectedEquipment && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="section-label">Nova solicitacao</span>
                <h3>{selectedEquipment.nome}</h3>
                <p>Preencha os dados do solicitante para registrar o pedido.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedEquipment(null)}
              >
                Fechar
              </button>
            </div>

            <form className="form-grid" onSubmit={handleSolicitationSubmit}>
              <label>
                Nome do solicitante
                <input
                  required
                  value={solicitationForm.nomeSolicitante}
                  onChange={(event) =>
                    updateSolicitationForm("nomeSolicitante", event.target.value)
                  }
                />
              </label>
              <label>
                Contato
                <input
                  required
                  value={solicitationForm.contatoSolicitante}
                  onChange={(event) =>
                    updateSolicitationForm("contatoSolicitante", event.target.value)
                  }
                />
              </label>
              <label className="span-2">
                Local de destino
                <input
                  required
                  value={solicitationForm.localDestino}
                  onChange={(event) =>
                    updateSolicitationForm("localDestino", event.target.value)
                  }
                />
              </label>
              <label className="span-2">
                Justificativa
                <textarea
                  required
                  rows={4}
                  value={solicitationForm.justificativa}
                  onChange={(event) =>
                    updateSolicitationForm("justificativa", event.target.value)
                  }
                />
              </label>
              <div className="form-actions span-2">
                <button type="submit" className="primary-button">
                  Registrar solicitacao
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default App;
