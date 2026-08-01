import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  MapPin,
  PackagePlus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Warehouse,
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
    "Acompanhe a operacao de equipamentos, veja disponibilidade e concentre o fluxo em uma experiencia mais gerencial.",
  novo:
    "Cadastre novos equipamentos com os campos do PowerApps, mantendo a base pronta para banco, anexos e validacoes futuras.",
  equipamentos:
    "Pesquise, filtre e visualize os equipamentos disponiveis em uma galeria mais elegante e clara para o usuario.",
  solicitacoes:
    "Veja as solicitacoes abertas, a decisao administrativa e as observacoes do fluxo em um unico painel.",
};

function currencyFormatter(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function metricValue(label: string, equipments: Equipment[], solicitations: Solicitation[]) {
  if (label === "Equipamentos cadastrados") return String(equipments.length);
  if (label === "Disponiveis") {
    return String(equipments.filter((item) => item.status === "Disponivel").length);
  }
  if (label === "Solicitacoes abertas") {
    return String(solicitations.filter((item) => item.decisaoAdmin === "Pendente").length);
  }
  return currencyFormatter(
    equipments.reduce((total, item) => total + Number(item.valorEstimado || 0), 0),
  );
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
          <p>Aplicacao no mesmo estilo do sistema publicado, agora focada no fluxo do PowerApps.</p>
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
  const totalEstimatedValue = equipments.reduce(
    (total, item) => total + Number(item.valorEstimado || 0),
    0,
  );
  const highlightedEquipment = equipments[0];
  const latestSolicitation = solicitations[0];
  const municipalityCounts = equipments.reduce<Record<string, number>>((acc, item) => {
    acc[item.municipio] = (acc[item.municipio] || 0) + 1;
    return acc;
  }, {});
  const topMunicipality =
    Object.entries(municipalityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Sem definicao";

  return (
    <PageBlock page="dashboard">
      <section className="hero-spotlight">
        <div className="hero-spotlight-copy">
          <span className="hero-chip">
            <Sparkles size={14} />
            Nova experiencia operacional
          </span>
          <h3>Uma central mais premium para consultar, cadastrar e distribuir equipamentos com clareza.</h3>
          <p>
            Mantivemos a base do Sistema Bahia, mas agora com uma camada visual mais forte,
            mais institucional e pronta para crescer com dados reais e aprovacoes.
          </p>
          <div className="hero-actions">
            <button type="button" className="hero-primary" onClick={() => goTo("novo")}>
              Cadastrar equipamento
              <ArrowRight size={16} />
            </button>
            <button type="button" className="hero-secondary" onClick={() => goTo("equipamentos")}>
              Explorar galeria
            </button>
          </div>
        </div>

        <div className="hero-spotlight-panel">
          <div className="hero-panel-top">
            <strong>Disponibilidade da base</strong>
            <span>{percentage(availableCount, equipments.length)}%</span>
          </div>
          <div className="progress-rail">
            <span style={{ width: `${percentage(availableCount, equipments.length)}%` }} />
          </div>
          <div className="hero-mini-stats">
            <div>
              <small>Municipio com mais itens</small>
              <strong>{topMunicipality}</strong>
            </div>
            <div>
              <small>Valor consolidado</small>
              <strong>{currencyFormatter(totalEstimatedValue)}</strong>
            </div>
            <div>
              <small>Solicitacoes pendentes</small>
              <strong>{pendingCount}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="cards-grid">
        {[
          "Equipamentos cadastrados",
          "Disponiveis",
          "Solicitacoes abertas",
          "Valor estimado total",
        ].map((label) => (
          <div key={label} className="metric">
            <span>{label}</span>
            <strong>{metricValue(label, equipments, solicitations)}</strong>
          </div>
        ))}
      </section>

      <section className="dashboard-grid-featured">
        <div className="panel">
          <div className="panel-heading">
            <h3>Fluxos principais</h3>
            <p>Os caminhos do antigo app ja estao organizados em modulos claros.</p>
          </div>
          <div className="journey-grid">
            <button type="button" className="journey-card" onClick={() => goTo("novo")}>
              <PackagePlus size={22} />
              <strong>Novo equipamento</strong>
              <span>Cadastrar equipamento com municipio, endereco filtrado, programa e anexos.</span>
            </button>
            <button
              type="button"
              className="journey-card"
              onClick={() => goTo("equipamentos")}
            >
              <Search size={22} />
              <strong>Consultar equipamentos</strong>
              <span>Ver galeria, pesquisar registros e abrir popup para solicitar.</span>
            </button>
            <button
              type="button"
              className="journey-card"
              onClick={() => goTo("solicitacoes")}
            >
              <ClipboardList size={22} />
              <strong>Solicitacoes</strong>
              <span>Acompanhar decisao administrativa, admin responsavel e observacoes.</span>
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h3>Estrutura pronta para producao</h3>
            <p>O esqueleto tecnico ja segue o caminho do projeto publicado.</p>
          </div>
          <div className="stack-list">
            <div className="stack-card">
              <strong>Vite + React</strong>
              <span>Frontend leve e alinhado ao projeto que voce ja publicou.</span>
            </div>
            <div className="stack-card">
              <strong>Supabase</strong>
              <span>Banco, storage de anexos e autenticacao para o proximo passo.</span>
            </div>
            <div className="stack-card">
              <strong>Vercel</strong>
              <span>Deploy pronto para conectar quando o repositorio estiver no GitHub.</span>
            </div>
          </div>
        </div>

        <div className="panel panel-accent">
          <div className="panel-heading">
            <h3>Radar operacional</h3>
            <p>Leitura rapida do que merece atencao agora.</p>
          </div>
          <div className="insight-list">
            <div className="insight-card">
              <div className="insight-icon">
                <Warehouse size={18} />
              </div>
              <div>
                <strong>{availableCount} equipamentos disponiveis</strong>
                <span>Prontos para novas solicitacoes imediatas.</span>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">
                <Clock3 size={18} />
              </div>
              <div>
                <strong>{pendingCount} solicitacoes em analise</strong>
                <span>Fila administrativa aguardando decisao.</span>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">
                <MapPin size={18} />
              </div>
              <div>
                <strong>{topMunicipality} em destaque</strong>
                <span>Concentracao atual mais forte da base.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid-two">
        <div className="panel featured-equipment-panel">
          <div className="panel-heading">
            <h3>Equipamento em evidência</h3>
            <p>Uma vitrine mais forte para destacar registros relevantes.</p>
          </div>
          {highlightedEquipment && (
            <div className="featured-equipment-card">
              <div className="featured-banner">
                <span className={`status-pill ${statusClass(highlightedEquipment.status)}`}>
                  {highlightedEquipment.status}
                </span>
                <span className="featured-program">{highlightedEquipment.programa}</span>
              </div>
              <h4>{highlightedEquipment.nome}</h4>
              <p>{highlightedEquipment.descricao}</p>
              <div className="featured-grid">
                <div>
                  <small>Municipio</small>
                  <strong>{highlightedEquipment.municipio}</strong>
                </div>
                <div>
                  <small>Endereco</small>
                  <strong>{highlightedEquipment.endereco}</strong>
                </div>
                <div>
                  <small>Proprietario</small>
                  <strong>{highlightedEquipment.proprietario}</strong>
                </div>
                <div>
                  <small>Valor estimado</small>
                  <strong>{currencyFormatter(highlightedEquipment.valorEstimado)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="panel activity-panel">
          <div className="panel-heading">
            <h3>Ultima movimentacao</h3>
            <p>Resumo executivo do pedido mais recente registrado.</p>
          </div>
          {latestSolicitation && (
            <div className="timeline-card">
              <div className="timeline-line" />
              <div className="timeline-item">
                <div className="timeline-point">
                  <Send size={14} />
                </div>
                <div>
                  <strong>{latestSolicitation.equipamentoNome}</strong>
                  <span>
                    Solicitado por {latestSolicitation.nomeSolicitante} para{" "}
                    {latestSolicitation.localDestino}.
                  </span>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-point">
                  <BadgeCheck size={14} />
                </div>
                <div>
                  <strong>Status atual: {latestSolicitation.decisaoAdmin}</strong>
                  <span>{latestSolicitation.observacoes ?? "Sem observacoes adicionais."}</span>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-point">
                  <CircleDollarSign size={14} />
                </div>
                <div>
                  <strong>Base preparada para integracao real</strong>
                  <span>O proximo passo e ligar banco, anexos e autenticacao.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageBlock>
  );
}

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [equipments, setEquipments] = useState<Equipment[]>(mockEquipments);
  const [solicitations, setSolicitations] = useState<Solicitation[]>(mockSolicitations);
  const [equipmentForm, setEquipmentForm] =
    useState<EquipmentFormState>(initialEquipmentForm);
  const [solicitationForm, setSolicitationForm] =
    useState<SolicitationFormState>(initialSolicitationForm);
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
          <section className="dashboard-grid-two form-layout-grid">
            <div className="panel panel-accent">
              <div className="panel-heading">
                <h3>Direcao da tela</h3>
                <p>Este formulario ja segue a logica do PowerApps, mas com um acabamento mais elegante e institucional.</p>
              </div>
              <div className="form-intro-list">
                <div className="form-intro-item">
                  <Boxes size={18} />
                  <div>
                    <strong>Cadastro estruturado</strong>
                    <span>Campos organizados por contexto, com leitura bem mais leve.</span>
                  </div>
                </div>
                <div className="form-intro-item">
                  <MapPin size={18} />
                  <div>
                    <strong>Endereco dependente do municipio</strong>
                    <span>Regra ja pronta para depois receber a base real do Supabase.</span>
                  </div>
                </div>
                <div className="form-intro-item">
                  <BadgeCheck size={18} />
                  <div>
                    <strong>Pronto para anexos e validacoes</strong>
                    <span>Estrutura preparada para virar fluxo de producao.</span>
                  </div>
                </div>
              </div>
            </div>

            <section className="panel">
            <div className="panel-heading">
              <h3>Cadastro principal</h3>
              <p>Formulario base da tela do PowerApps, ja preparado para depois salvar no Supabase.</p>
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
          <section className="gallery-toolbar panel">
            <div className="gallery-toolbar-copy">
              <h3>Galeria inteligente de equipamentos</h3>
              <p>
                Um formato mais bonito para navegar a base, destacar itens e abrir a
                solicitacao com menos atrito.
              </p>
            </div>
            <div className="gallery-toolbar-stats">
              <div>
                <small>Resultados</small>
                <strong>{filteredEquipments.length}</strong>
              </div>
              <div>
                <small>Disponiveis</small>
                <strong>{equipments.filter((item) => item.status === "Disponivel").length}</strong>
              </div>
              <div>
                <small>Programas</small>
                <strong>{new Set(equipments.map((item) => item.programa)).size}</strong>
              </div>
            </div>
          </section>

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
          <section className="cards-grid cards-grid-compact">
            <div className="metric">
              <span>Solicitacoes totais</span>
              <strong>{solicitations.length}</strong>
            </div>
            <div className="metric">
              <span>Aprovadas</span>
              <strong>
                {solicitations.filter((item) => item.decisaoAdmin === "Aprovado").length}
              </strong>
            </div>
            <div className="metric">
              <span>Pendentes</span>
              <strong>
                {solicitations.filter((item) => item.decisaoAdmin === "Pendente").length}
              </strong>
            </div>
            <div className="metric">
              <span>Recusadas</span>
              <strong>
                {solicitations.filter((item) => item.decisaoAdmin === "Recusado").length}
              </strong>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h3>Galeria administrativa</h3>
              <p>Espaco para acompanhar retorno do admin, aprovacoes e observacoes do fluxo.</p>
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
