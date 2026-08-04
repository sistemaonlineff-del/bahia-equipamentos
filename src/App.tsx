import {
  ArrowRight,
  Building2,
  ChevronRight,
  ClipboardList,
  Compass,
  LayoutGrid,
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
  dashboard: "Overview",
  novo: "Novo Equipamento",
  equipamentos: "Galeria",
  solicitacoes: "Solicitacoes",
};

const pageDescriptions: Record<Page, string> = {
  dashboard:
    "Uma leitura mais autoral da operacao, com uma composicao mais premium e menos cara de sistema padrao.",
  novo:
    "Um cadastro mais editorial, com melhor respiracao visual e uma forma mais profissional de apresentar os campos.",
  equipamentos:
    "Uma galeria mais elegante para explorar a base, com foco em leitura, ritmo e destaque de cada item.",
  solicitacoes:
    "Uma tela mais limpa para decisao administrativa, com estrutura visual melhor para acompanhar os pedidos.",
};

function currencyFormatter(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusClass(status: string) {
  if (status === "Disponivel" || status === "Aprovado") return "status-positive";
  if (status === "Solicitado" || status === "Recusado") return "status-negative";
  return "status-warning";
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
  const navItems: { id: Page; icon: React.ReactNode; caption: string }[] = [
    { id: "dashboard", icon: <Compass size={18} />, caption: "Panorama geral" },
    { id: "novo", icon: <PackagePlus size={18} />, caption: "Cadastro" },
    { id: "equipamentos", icon: <LayoutGrid size={18} />, caption: "Consulta visual" },
    { id: "solicitacoes", icon: <ClipboardList size={18} />, caption: "Fila administrativa" },
  ];

  return (
    <div className="shell">
      <aside className="rail">
        <div className="rail-brand">
          <div className="rail-logos">
            <img src={logo1} alt="Logo CAR" />
            <img src={logo2} alt="Logo Governo da Bahia" />
          </div>
          <div className="rail-brand-copy">
            <strong>Bahia Equipamentos</strong>
            <span>Plataforma operacional</span>
          </div>
        </div>

        <div className="rail-user">
          <div className="rail-avatar">B</div>
          <div>
            <strong>Equipe Bahia</strong>
            <span>Ambiente inicial</span>
          </div>
        </div>

        <nav className="rail-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === item.id ? "rail-link active" : "rail-link"}
              onClick={() => setPage(item.id)}
            >
              <span className="rail-link-icon">{item.icon}</span>
              <span className="rail-link-copy">
                <strong>{pageLabels[item.id]}</strong>
                <small>{item.caption}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="rail-note">
          <ShieldCheck size={16} />
          Estrutura pronta para Supabase, GitHub e Vercel.
        </div>
      </aside>

      <section className="stage">
        <header className="masthead">
          <div>
            <span className="eyebrow">Sistema Bahia</span>
            <h1>Gestao de Equipamentos</h1>
            <p>Uma interface mais marcante, profissional e com linguagem visual de produto.</p>
          </div>
        </header>
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
      <section className="page-banner">
        <div>
          <span className="page-kicker">Bahia</span>
          <h2>{pageLabels[page]}</h2>
          <p>{pageDescriptions[page]}</p>
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
  const totalEstimatedValue = equipments.reduce(
    (total, item) => total + Number(item.valorEstimado || 0),
    0,
  );
  const pendingCount = solicitations.filter((item) => item.decisaoAdmin === "Pendente").length;
  const leadEquipment = equipments[0];

  return (
    <PageFrame page="dashboard">
      <section className="overview-grid">
        <article className="hero-card">
          <div className="hero-card-copy">
            <span className="hero-chip">
              <Sparkles size={14} />
              Nova assinatura visual
            </span>
            <h3>Uma operacao com mais presenca, mais design e menos cara de painel comum.</h3>
            <p>
              O foco aqui e transformar a percepcao do produto: uma interface mais premium,
              mais organizada e com um layout mais memoravel.
            </p>
            <div className="hero-actions">
              <button type="button" className="cta-primary" onClick={() => goTo("novo")}>
                Cadastrar novo
                <ArrowRight size={16} />
              </button>
              <button type="button" className="cta-ghost" onClick={() => goTo("equipamentos")}>
                Explorar galeria
              </button>
            </div>
          </div>

          <div className="hero-card-side">
            <div className="hero-value">
              <span>Disponibilidade</span>
              <strong>{Math.round((availableCount / Math.max(equipments.length, 1)) * 100)}%</strong>
            </div>
            <div className="hero-meter">
              <span
                style={{
                  width: `${Math.round((availableCount / Math.max(equipments.length, 1)) * 100)}%`,
                }}
              />
            </div>
            <p>{availableCount} itens liberados para novas solicitacoes agora.</p>
          </div>
        </article>

        <article className="spotlight-card">
          <span className="card-tag">Destaque</span>
          <h3>{leadEquipment?.nome ?? "Base em preparacao"}</h3>
          <p>{leadEquipment?.descricao ?? "Assim que houver registros, eles aparecem aqui."}</p>
          <dl>
            <div>
              <dt>Municipio</dt>
              <dd>{leadEquipment?.municipio ?? "-"}</dd>
            </div>
            <div>
              <dt>Programa</dt>
              <dd>{leadEquipment?.programa ?? "-"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{leadEquipment?.status ?? "-"}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="stats-ribbon">
        <article className="stat-tile stat-tile-wide">
          <span>Base total</span>
          <strong>{equipments.length}</strong>
          <small>equipamentos cadastrados</small>
        </article>
        <article className="stat-tile">
          <span>Disponiveis</span>
          <strong>{availableCount}</strong>
          <small>prontos para uso</small>
        </article>
        <article className="stat-tile">
          <span>Pendentes</span>
          <strong>{pendingCount}</strong>
          <small>em avaliacao</small>
        </article>
        <article className="stat-tile stat-tile-accent">
          <span>Valor estimado</span>
          <strong>{currencyFormatter(totalEstimatedValue)}</strong>
          <small>capacidade consolidada</small>
        </article>
      </section>

      <section className="action-board">
        <button type="button" className="action-card action-card-primary" onClick={() => goTo("novo")}>
          <PackagePlus size={20} />
          <div>
            <strong>Novo equipamento</strong>
            <span>Cadastro com leitura mais limpa</span>
          </div>
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          className="action-card"
          onClick={() => goTo("equipamentos")}
        >
          <Search size={20} />
          <div>
            <strong>Consultar base</strong>
            <span>Galeria com mais ritmo visual</span>
          </div>
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          className="action-card"
          onClick={() => goTo("solicitacoes")}
        >
          <ClipboardList size={20} />
          <div>
            <strong>Solicitacoes</strong>
            <span>Painel administrativo organizado</span>
          </div>
          <ChevronRight size={18} />
        </button>
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
      dataSolicitacao: "2026-08-04",
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
        <PageFrame page="novo">
          <section className="editor-layout">
            <article className="editor-intro">
              <span className="card-tag">Cadastro</span>
              <h3>Uma tela mais editorial para um formulario que parecia burocratico.</h3>
              <p>
                Aqui o foco mudou para composicao, espacamento e hierarquia. O fluxo continua
                o mesmo, mas a experiencia fica muito mais profissional.
              </p>
            </article>

            <section className="form-panel">
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
                  <button type="submit" className="cta-primary">
                    Salvar equipamento
                  </button>
                </div>
              </form>
            </section>
          </section>
        </PageFrame>
      )}

      {page === "equipamentos" && (
        <PageFrame
          page="equipamentos"
          actions={
            <div className="page-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, municipio, endereco ou programa"
              />
            </div>
          }
        >
          <section className="gallery-grid">
            {filteredEquipments.map((equipment, index) => (
              <article
                key={equipment.id}
                className={index === 0 ? "gallery-card gallery-card-large" : "gallery-card"}
              >
                <div className="gallery-head">
                  <span className={`status-pill ${statusClass(equipment.status)}`}>
                    {equipment.status}
                  </span>
                  <span className="gallery-program">{equipment.programa}</span>
                </div>
                <h3>{equipment.nome}</h3>
                <p>{equipment.descricao}</p>
                <div className="gallery-facts">
                  <span>{equipment.municipio}</span>
                  <span>{equipment.endereco}</span>
                  <span>{currencyFormatter(equipment.valorEstimado)}</span>
                </div>
                <button type="button" className="gallery-action" onClick={() => setSelectedEquipment(equipment)}>
                  <Send size={15} />
                  Solicitar
                </button>
              </article>
            ))}
          </section>
        </PageFrame>
      )}

      {page === "solicitacoes" && (
        <PageFrame page="solicitacoes">
          <section className="request-layout">
            <article className="request-summary">
              <span className="card-tag">Acompanhamento</span>
              <h3>{solicitations.length} solicitacoes acompanhadas em uma leitura mais limpa.</h3>
              <p>
                O retorno administrativo agora aparece em uma estrutura mais elegante e mais
                facil de escanear visualmente.
              </p>
            </article>

            <section className="table-panel">
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
          </section>
        </PageFrame>
      )}

      {selectedEquipment && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="page-kicker">Solicitacao</span>
                <h3>{selectedEquipment.nome}</h3>
                <p>Preencha os dados para registrar a solicitacao do equipamento.</p>
              </div>
              <button
                type="button"
                className="cta-ghost"
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
                <button type="submit" className="cta-primary">
                  Enviar solicitacao
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
