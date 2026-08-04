import {
  ArrowRight,
  Building2,
  ClipboardList,
  PackagePlus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import React, { FormEvent, useMemo, useState } from "react";
import logo1 from "../assets/logo_1.jpeg";
import logo2 from "../assets/logo_2.jpeg";
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
  dashboard: "Dashboard",
  novo: "Novo Equipamento",
  equipamentos: "Consultar Equipamentos",
  solicitacoes: "Solicitacoes",
};

const pageDescriptions: Record<Page, string> = {
  dashboard:
    "Uma visao mais elegante da operacao, com foco em disponibilidade, cadastro e solicitacoes.",
  novo:
    "Cadastre novos equipamentos com uma interface mais limpa e pronta para evoluir com dados reais.",
  equipamentos:
    "Explore a galeria de equipamentos de forma mais visual, direta e agradavel.",
  solicitacoes:
    "Acompanhe as solicitacoes em uma tela mais leve, bonita e facil de ler.",
};

function currencyFormatter(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function statusClass(status: string) {
  if (status === "Disponivel" || status === "Aprovado") return "status-positive";
  if (status === "Solicitado" || status === "Recusado") return "status-negative";
  return "status-warning";
}

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function AppShell({
  page,
  setPage,
  children,
}: {
  page: Page;
  setPage: (page: Page) => void;
  children: React.ReactNode;
}) {
  const navItems: { id: Page; icon: React.ReactNode }[] = [
    { id: "dashboard", icon: <Building2 size={18} /> },
    { id: "novo", icon: <PackagePlus size={18} /> },
    { id: "equipamentos", icon: <Search size={18} /> },
    { id: "solicitacoes", icon: <ClipboardList size={18} /> },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={logo1} alt="Logo CAR" />
          <img src={logo2} alt="Logo Governo da Bahia" />
          <strong>Bahia Equipamentos</strong>
          <span>Gestao operacional de equipamentos e solicitacoes</span>
        </div>

        <div className="user-chip">
          <div className="avatar">B</div>
          <div>
            <strong>Equipe Bahia</strong>
            <span>Ambiente inicial de operacao</span>
          </div>
        </div>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === item.id ? "active" : ""}
              onClick={() => setPage(item.id)}
            >
              {item.icon}
              {pageLabels[item.id]}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <ShieldCheck size={18} />
          Base pronta para integrar com Supabase, GitHub e Vercel.
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <h1>Gestao de Equipamentos - Bahia</h1>
          <p>Um visual mais refinado, leve e dinamico para a operacao.</p>
        </header>
        {children}
      </section>
    </div>
  );
}

function PageBlock({
  page,
  actions,
  children,
}: {
  page: Page;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Sistema Bahia</span>
          <h2 className="page-title">{pageLabels[page]}</h2>
          <p className="page-subtitle">{pageDescriptions[page]}</p>
        </div>
        {actions}
      </div>
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
  const pendingCount = solicitations.filter((item) => item.decisaoAdmin === "Pendente").length;
  const totalEstimatedValue = equipments.reduce((total, item) => total + Number(item.valorEstimado || 0), 0);
  const coverageLabel = equipments.length
    ? `${availableCount} de ${equipments.length} itens prontos para uso`
    : "Sem equipamentos cadastrados";

  return (
    <PageBlock page="dashboard">
      <section className="hero-spotlight hero-spotlight-clean">
        <div className="hero-spotlight-copy">
          <span className="hero-chip">
            <Sparkles size={14} />
            Experiencia mais refinada
          </span>
          <h3>Uma vitrine institucional, clara e mais sofisticada para a operacao.</h3>
          <p>
            O sistema agora assume uma presenca mais executiva: visual limpo, ritmo melhor
            de leitura e uma interface que transmite mais valor logo no primeiro contato.
          </p>
          <div className="hero-actions">
            <button type="button" className="hero-primary" onClick={() => goTo("novo")}>
              Novo equipamento
              <ArrowRight size={16} />
            </button>
            <button type="button" className="hero-secondary" onClick={() => goTo("equipamentos")}>
              Ver galeria
            </button>
          </div>
        </div>

        <div className="hero-spotlight-panel hero-panel-minimal">
          <div className="hero-panel-kicker">Panorama atual</div>
          <div className="hero-panel-top">
            <strong>Disponibilidade</strong>
            <span>{percentage(availableCount, equipments.length)}%</span>
          </div>
          <div className="progress-rail">
            <span style={{ width: `${percentage(availableCount, equipments.length)}%` }} />
          </div>
          <p className="hero-panel-caption">{coverageLabel}</p>
        </div>
      </section>

      <section className="cards-grid cards-grid-clean">
        <div className="metric metric-featured">
          <span>Equipamentos</span>
          <strong>{equipments.length}</strong>
          <small>base registrada</small>
        </div>
        <div className="metric">
          <span>Disponiveis</span>
          <strong>{availableCount}</strong>
          <small>para novas demandas</small>
        </div>
        <div className="metric">
          <span>Solicitacoes</span>
          <strong>{pendingCount}</strong>
          <small>aguardando retorno</small>
        </div>
        <div className="metric">
          <span>Valor total</span>
          <strong>{currencyFormatter(totalEstimatedValue)}</strong>
          <small>estimativa atual</small>
        </div>
      </section>

      <section className="dashboard-grid-two dashboard-grid-clean">
        <div className="panel panel-flow">
          <div className="panel-heading">
            <h3>Fluxos principais</h3>
            <p>Acessos diretos com mais elegancia visual e menos ruído.</p>
          </div>
          <div className="journey-grid journey-grid-clean">
            <button type="button" className="journey-card" onClick={() => goTo("novo")}>
              <PackagePlus size={22} />
              <strong>Novo equipamento</strong>
              <span>Cadastro inicial</span>
            </button>
            <button type="button" className="journey-card" onClick={() => goTo("equipamentos")}>
              <Search size={22} />
              <strong>Consultar</strong>
              <span>Galeria e busca</span>
            </button>
            <button type="button" className="journey-card" onClick={() => goTo("solicitacoes")}>
              <ClipboardList size={22} />
              <strong>Solicitacoes</strong>
              <span>Fila administrativa</span>
            </button>
          </div>
        </div>

        <div className="panel panel-highlight-simple">
          <div className="panel-heading">
            <h3>Leitura executiva</h3>
            <p>Resumo visual mais discreto, profissional e institucional.</p>
          </div>
          <div className="summary-band">
            <div className="summary-item">
              <div className="summary-dot" />
              <div>
                <strong>{availableCount} disponiveis</strong>
                <span>prontos para uso</span>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-dot" />
              <div>
                <strong>{pendingCount} pendentes</strong>
                <span>aguardando decisao</span>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-dot" />
              <div>
                <strong>{currencyFormatter(totalEstimatedValue)}</strong>
                <span>valor estimado</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageBlock>
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

  function handleEquipmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newEquipment: Equipment = {
      id: equipments.length + 1,
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
      status: "Disponivel",
    };

    setEquipments((current) => [newEquipment, ...current]);
    setEquipmentForm(initialEquipmentForm);
    setPage("equipamentos");
  }

  function handleSolicitationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEquipment) {
      return;
    }

    const newSolicitation: Solicitation = {
      id: solicitations.length + 1,
      equipamentoId: selectedEquipment.id,
      equipamentoNome: selectedEquipment.nome,
      nomeSolicitante: solicitationForm.nomeSolicitante,
      contatoSolicitante: solicitationForm.contatoSolicitante,
      localDestino: solicitationForm.localDestino,
      justificativa: solicitationForm.justificativa,
      decisaoAdmin: "Pendente",
      observacoes: "Aguardando avaliacao administrativa.",
      dataSolicitacao: "2026-08-01",
    };

    setSolicitations((current) => [newSolicitation, ...current]);
    setEquipments((current) =>
      current.map((equipment) =>
        equipment.id === selectedEquipment.id
          ? { ...equipment, status: "Solicitado" }
          : equipment,
      ),
    );
    setSolicitationForm(initialSolicitationForm);
    setSelectedEquipment(null);
    setPage("solicitacoes");
  }

  return (
    <AppShell page={page} setPage={setPage}>
      {page === "dashboard" && (
        <DashboardPage
          equipments={equipments}
          solicitations={solicitations}
          goTo={setPage}
        />
      )}

      {page === "novo" && (
        <PageBlock page="novo">
          <section className="panel">
            <div className="panel-heading">
              <h3>Cadastro principal</h3>
              <p>Formulario base da tela do PowerApps, com acabamento mais limpo e bonito.</p>
            </div>
            <form className="form-grid" onSubmit={handleEquipmentSubmit}>
              <label>
                Nome
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
                Convenio termo
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
              <label className="span-2">
                Descricao
                <textarea
                  rows={4}
                  value={equipmentForm.descricao}
                  onChange={(event) => updateEquipmentForm("descricao", event.target.value)}
                />
              </label>
              <label className="span-2">
                Anexos
                <input
                  placeholder="Ex.: foto1.png, termo.pdf"
                  value={equipmentForm.anexos}
                  onChange={(event) => updateEquipmentForm("anexos", event.target.value)}
                />
              </label>
              <div className="form-actions span-2">
                <button type="submit">Salvar equipamento</button>
              </div>
            </form>
          </section>
        </PageBlock>
      )}

      {page === "equipamentos" && (
        <PageBlock
          page="equipamentos"
          actions={
            <div className="page-actions">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, municipio, endereco ou programa"
              />
            </div>
          }
        >
          <section className="equipment-grid">
            {filteredEquipments.map((equipment) => (
              <article key={equipment.id} className="equipment-card">
                <div className="equipment-card-top">
                  <span className={`status-pill ${statusClass(equipment.status)}`}>
                    {equipment.status}
                  </span>
                  <span className="equipment-tag">{equipment.programa}</span>
                </div>
                <h3>{equipment.nome}</h3>
                <p>{equipment.descricao}</p>
                <div className="equipment-meta-grid">
                  <div>
                    <span>Municipio</span>
                    <strong>{equipment.municipio}</strong>
                  </div>
                  <div>
                    <span>Endereco</span>
                    <strong>{equipment.endereco}</strong>
                  </div>
                  <div>
                    <span>Proprietario</span>
                    <strong>{equipment.proprietario}</strong>
                  </div>
                  <div>
                    <span>Valor</span>
                    <strong>{currencyFormatter(equipment.valorEstimado)}</strong>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedEquipment(equipment)}>
                  <Send size={16} />
                  Solicitar
                </button>
              </article>
            ))}
          </section>
        </PageBlock>
      )}

      {page === "solicitacoes" && (
        <PageBlock page="solicitacoes">
          <section className="panel">
            <div className="panel-heading">
              <h3>Galeria administrativa</h3>
              <p>Leitura mais limpa do retorno do admin e das observacoes do fluxo.</p>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Equipamento</th>
                    <th>Solicitante</th>
                    <th>Contato</th>
                    <th>Destino</th>
                    <th>Decisao</th>
                    <th>Admin</th>
                    <th>Observacoes</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitations.map((item) => (
                    <tr key={item.id}>
                      <td>{item.equipamentoNome}</td>
                      <td>{item.nomeSolicitante}</td>
                      <td>{item.contatoSolicitante}</td>
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
        </PageBlock>
      )}

      {selectedEquipment && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="page-eyebrow">Solicitacao</span>
                <h3>{selectedEquipment.nome}</h3>
                <p>Preencha os dados para registrar a solicitacao do equipamento.</p>
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
                Contato do solicitante
                <input
                  required
                  value={solicitationForm.contatoSolicitante}
                  onChange={(event) =>
                    updateSolicitationForm("contatoSolicitante", event.target.value)
                  }
                />
              </label>
              <label className="span-2">
                Local destino
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
                <button type="submit">Enviar solicitacao</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default App;
