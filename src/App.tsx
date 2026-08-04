import {
  Boxes,
  ClipboardList,
  FileText,
  MapPinned,
  PackagePlus,
  Search,
  Send,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
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

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const municipalityCoordinates: Record<string, { lat: number; lng: number }> = {
  Salvador: { lat: -12.9777, lng: -38.5016 },
  "Feira de Santana": { lat: -12.2664, lng: -38.9663 },
  Ilheus: { lat: -14.7936, lng: -39.0469 },
  Juazeiro: { lat: -9.4116, lng: -40.4980 },
};

const statusPalette = {
  estoque: "#2e9f3d",
  analise: "#f59e0b",
  solicitado: "#dc2626",
  aprovado: "#0b6fc2",
} as const;

function buildPieStyle(values: number[]) {
  const total = values.reduce((sum, value) => sum + value, 0);

  if (!total) {
    return {
      background:
        "conic-gradient(#d7dee7 0deg 360deg)",
    };
  }

  const colors = [
    statusPalette.estoque,
    statusPalette.analise,
    statusPalette.solicitado,
    statusPalette.aprovado,
  ];
  let offset = 0;
  const slices = values.map((value, index) => {
    const angle = (value / total) * 360;
    const slice = `${colors[index]} ${offset}deg ${offset + angle}deg`;
    offset += angle;
    return slice;
  });

  return {
    background: `conic-gradient(${slices.join(", ")})`,
  };
}

function buildMapCenter(equipments: Equipment[]) {
  const points = equipments
    .map((item) => municipalityCoordinates[item.municipio])
    .filter(Boolean);

  if (points.length === 0) {
    return { lat: -12.5, lng: -39.4 };
  }

  const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;
  return { lat, lng };
}

function statusAccent(status: Equipment["status"]) {
  if (status === "Disponivel") return statusPalette.estoque;
  if (status === "Solicitado") return statusPalette.solicitado;
  return statusPalette.analise;
}

function municipalityAccent(
  municipalityEquipments: Equipment[],
  municipalitySolicitations: Solicitation[],
) {
  if (municipalitySolicitations.some((item) => item.decisaoAdmin === "Aprovado")) {
    return statusPalette.aprovado;
  }

  if (municipalityEquipments.some((item) => item.status === "Solicitado")) {
    return statusPalette.solicitado;
  }

  if (municipalityEquipments.some((item) => item.status === "Em analise")) {
    return statusPalette.analise;
  }

  return statusPalette.estoque;
}

function DonutChart({
  items,
}: {
  items: { label: string; value: number; color: string; onClick: () => void }[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-layout">
      <div className="donut-figure">
        <svg viewBox="0 0 180 180" className="donut-svg" aria-hidden="true">
          <circle cx="90" cy="90" r={radius} className="donut-track" />
          {total > 0
            ? items.map((item) => {
                const dash = (item.value / total) * circumference;
                const segment = (
                  <circle
                    key={item.label}
                    cx="90"
                    cy="90"
                    r={radius}
                    className="donut-segment"
                    style={{
                      stroke: item.color,
                      strokeDasharray: `${dash} ${circumference - dash}`,
                      strokeDashoffset: -offset,
                    }}
                  />
                );
                offset += dash;
                return segment;
              })
            : null}
        </svg>
        <div className="donut-center">
          <strong>{total}</strong>
          <span>registros</span>
        </div>
      </div>

      <div className="donut-labels">
        {items.map((item) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <button
              key={item.label}
              type="button"
              className="donut-label"
              onClick={item.onClick}
            >
              <i className="legend-dot" style={{ background: item.color }} />
              <div className="donut-label-copy">
                <strong>{item.label}</strong>
                <span>{item.value} itens</span>
              </div>
              <b>{percentage}%</b>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BarChartList({
  items,
  maxValue,
  activeKey,
  onSelect,
}: {
  items: [string, number][];
  maxValue: number;
  activeKey: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="chart-list">
      {items.length > 0 ? (
        items.map(([label, value]) => (
          <button
            key={label}
            type="button"
            className={`chart-row ${activeKey === label ? "active" : ""}`}
            onClick={() => onSelect(label)}
          >
            <div className="chart-row-head">
              <strong>{label}</strong>
              <span>{value} equipamento{value > 1 ? "s" : ""}</span>
            </div>
            <div className="chart-row-body">
              <div className="chart-row-track">
                <span style={{ width: `${(value / maxValue) * 100}%` }} />
              </div>
              <b>{value}</b>
            </div>
          </button>
        ))
      ) : (
        <div className="empty-state">Sem dados para exibir.</div>
      )}
    </div>
  );
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
  const [equipmentFilter, setEquipmentFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [municipioFilter, setMunicipioFilter] = useState("Todos");
  const [sistemaFilter, setSistemaFilter] = useState("Todos");
  const [programaFilter, setProgramaFilter] = useState("Todos");
  const [decisionFilter, setDecisionFilter] = useState("Todos");

  const filterOptions = useMemo(() => {
    return {
      equipamentos: ["Todos", ...new Set(equipments.map((item) => item.nome))],
      status: ["Todos", ...new Set(equipments.map((item) => item.status))],
      municipios: ["Todos", ...new Set(equipments.map((item) => item.municipio))],
      sistemas: ["Todos", ...new Set(equipments.map((item) => item.sistemaProdutivo))],
      programas: ["Todos", ...new Set(equipments.map((item) => item.programa))],
    };
  }, [equipments]);

  const filteredEquipments = useMemo(() => {
    return equipments.filter((item) => {
      return (
        (equipmentFilter === "Todos" || item.nome === equipmentFilter) &&
        (statusFilter === "Todos" || item.status === statusFilter) &&
        (municipioFilter === "Todos" || item.municipio === municipioFilter) &&
        (sistemaFilter === "Todos" || item.sistemaProdutivo === sistemaFilter) &&
        (programaFilter === "Todos" || item.programa === programaFilter)
      );
    });
  }, [equipmentFilter, equipments, municipioFilter, programaFilter, sistemaFilter, statusFilter]);

  const filteredEquipmentIds = useMemo(() => {
    return new Set(filteredEquipments.map((item) => item.id));
  }, [filteredEquipments]);

  const filteredSolicitations = useMemo(() => {
    return solicitations.filter(
      (item) =>
        filteredEquipmentIds.has(item.equipamentoId) &&
        (decisionFilter === "Todos" || item.decisaoAdmin === decisionFilter),
    );
  }, [decisionFilter, filteredEquipmentIds, solicitations]);

  const availableCount = filteredEquipments.filter((item) => item.status === "Disponivel").length;
  const requestedCount = filteredEquipments.filter((item) => item.status === "Solicitado").length;
  const maintenanceCount = filteredEquipments.filter((item) => item.status === "Em analise").length;
  const approvedCount = filteredSolicitations.filter((item) => item.decisaoAdmin === "Aprovado").length;
  const donatedCount = 0;
  const totalEstimatedValue = filteredEquipments.reduce(
    (total, item) => total + Number(item.valorEstimado || 0),
    0,
  );
  const equipmentBySystem = Array.from(
    filteredEquipments.reduce((map, item) => {
      map.set(item.sistemaProdutivo, (map.get(item.sistemaProdutivo) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);

  const equipmentByMunicipio = Array.from(
    filteredEquipments.reduce((map, item) => {
      map.set(item.municipio, (map.get(item.municipio) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);

  const maxSystemCount = Math.max(...equipmentBySystem.map(([, count]) => count), 1);
  const maxMunicipioCount = Math.max(...equipmentByMunicipio.map(([, count]) => count), 1);
  const mapCenter = buildMapCenter(filteredEquipments);
  const municipalityMapData = equipmentByMunicipio
    .map(([municipio, count]) => ({
      municipio,
      count,
      coordinates: municipalityCoordinates[municipio],
      statuses: filteredEquipments.filter((item) => item.municipio === municipio),
      solicitations: filteredSolicitations.filter((item) =>
        filteredEquipments.some(
          (equipment) => equipment.id === item.equipamentoId && equipment.municipio === municipio,
        ),
      ),
    }))
    .filter((item) => item.coordinates);

  function resetInteractiveFilters() {
    setStatusFilter("Todos");
    setMunicipioFilter("Todos");
    setSistemaFilter("Todos");
    setDecisionFilter("Todos");
  }

  function toggleStatusFilter(nextStatus: string) {
    setDecisionFilter("Todos");
    setStatusFilter((current) => (current === nextStatus ? "Todos" : nextStatus));
  }

  function toggleDecisionFilter(nextDecision: string) {
    setStatusFilter("Todos");
    setDecisionFilter((current) => (current === nextDecision ? "Todos" : nextDecision));
  }

  function toggleMunicipioFilter(nextMunicipio: string) {
    setMunicipioFilter((current) => (current === nextMunicipio ? "Todos" : nextMunicipio));
  }

  function toggleSistemaFilter(nextSistema: string) {
    setSistemaFilter((current) => (current === nextSistema ? "Todos" : nextSistema));
  }

  return (
    <PageFrame page="dashboard">
      <section className="dashboard-filters dashboard-filters-top">
        <label>
          Equipamento
          <select value={equipmentFilter} onChange={(event) => setEquipmentFilter(event.target.value)}>
            {filterOptions.equipamentos.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {filterOptions.status.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Municipio
          <select value={municipioFilter} onChange={(event) => setMunicipioFilter(event.target.value)}>
            {filterOptions.municipios.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Sistema
          <select value={sistemaFilter} onChange={(event) => setSistemaFilter(event.target.value)}>
            {filterOptions.sistemas.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Projetos
          <select value={programaFilter} onChange={(event) => setProgramaFilter(event.target.value)}>
            {filterOptions.programas.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="dashboard-cards">
        <button
          type="button"
          className={`dashboard-stat dashboard-stat-stock ${statusFilter === "Disponivel" ? "active" : ""}`}
          onClick={() => toggleStatusFilter("Disponivel")}
        >
          <span>Estoque</span>
          <strong>{availableCount}</strong>
          <small>Qtd_Estoque</small>
        </button>
        <button
          type="button"
          className={`dashboard-stat dashboard-stat-requested ${statusFilter === "Solicitado" ? "active" : ""}`}
          onClick={() => toggleStatusFilter("Solicitado")}
        >
          <span>Solicitados</span>
          <strong>{requestedCount}</strong>
          <small>Qtd_Solicitados</small>
        </button>
        <button
          type="button"
          className={`dashboard-stat dashboard-stat-approved ${decisionFilter === "Aprovado" ? "active" : ""}`}
          onClick={() => toggleDecisionFilter("Aprovado")}
        >
          <span>Aprovados</span>
          <strong>{approvedCount}</strong>
          <small>Qtd_Aprovados</small>
        </button>
        <button
          type="button"
          className="dashboard-stat dashboard-stat-value"
          onClick={resetInteractiveFilters}
        >
          <span>R$ Valor Estimado</span>
          <strong>{currencyFormatter(totalEstimatedValue)}</strong>
          <small>Total da base filtrada</small>
        </button>
        <button
          type="button"
          className="dashboard-stat dashboard-stat-donated"
          onClick={resetInteractiveFilters}
        >
          <span>Doados</span>
          <strong>{donatedCount}</strong>
          <small>Qtd_Doados</small>
        </button>
      </section>

      <section className="dashboard-top-grid">
        <article className="panel dashboard-map-panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Mapa territorial</span>
              <h3>Distribuicao real dos equipamentos</h3>
            </div>
            <div className="map-panel-tag">
              <MapPinned size={16} />
              Bahia
            </div>
          </div>
          <div className="map-legend">
            <span><i className="legend-dot stock" />Estoque</span>
            <span><i className="legend-dot requested" />Solicitado</span>
            <span><i className="legend-dot approved" />Aprovado</span>
            <span><i className="legend-dot maintenance" />Em analise</span>
          </div>
          <div className="map-stage">
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={7}
              scrollWheelZoom
              className="leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {municipalityMapData.map((item) => {
                const markerColor = municipalityAccent(item.statuses, item.solicitations);
                const status = item.statuses[0]?.status ?? "Disponivel";
                return (
                  <CircleMarker
                    key={item.municipio}
                    center={[item.coordinates.lat, item.coordinates.lng]}
                    radius={Math.max(10, item.count * 4)}
                    eventHandlers={{
                      click: () => toggleMunicipioFilter(item.municipio),
                    }}
                    pathOptions={{
                      color: "#ffffff",
                      weight: 2,
                      fillColor: markerColor,
                      fillOpacity: 0.9,
                    }}
                  >
                    <Popup>
                      <strong>{item.municipio}</strong>
                      <br />
                      Equipamentos: {item.count}
                      <br />
                      Status em destaque: {status}
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </article>

        <article className="panel dashboard-donut-panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Valor estimado</span>
              <h3>Composicao por status</h3>
            </div>
          </div>
          <DonutChart
            items={[
              {
                label: "Estoque",
                value: availableCount,
                color: statusPalette.estoque,
                onClick: () => toggleStatusFilter("Disponivel"),
              },
              {
                label: "Em analise",
                value: maintenanceCount,
                color: statusPalette.analise,
                onClick: () => toggleStatusFilter("Em analise"),
              },
              {
                label: "Solicitado",
                value: requestedCount,
                color: statusPalette.solicitado,
                onClick: () => toggleStatusFilter("Solicitado"),
              },
              {
                label: "Aprovado",
                value: approvedCount,
                color: statusPalette.aprovado,
                onClick: () => toggleDecisionFilter("Aprovado"),
              },
            ]}
          />
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Equipamentos</span>
              <h3>Por sistema produtivo</h3>
            </div>
          </div>
          <BarChartList
            items={equipmentBySystem}
            maxValue={maxSystemCount}
            activeKey={sistemaFilter}
            onSelect={toggleSistemaFilter}
          />
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Municipios</span>
              <h3>Equipamentos por municipio</h3>
            </div>
          </div>
          <BarChartList
            items={equipmentByMunicipio}
            maxValue={maxMunicipioCount}
            activeKey={municipioFilter}
            onSelect={toggleMunicipioFilter}
          />
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="section-label">Detalhamento</span>
            <h3>Equipamentos filtrados</h3>
          </div>
          <div className="quick-actions dashboard-actions">
            <button type="button" className="action-button primary" onClick={() => goTo("novo")}>
              <PackagePlus size={16} />
              Novo cadastro
            </button>
            <button type="button" className="action-button" onClick={() => goTo("equipamentos")}>
              <Search size={16} />
              Consultar base
            </button>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Programa</th>
                <th>Valor estimado</th>
                <th>Status</th>
                <th>Sistema</th>
                <th>Municipio</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipments.map((equipment) => (
                <tr key={equipment.id}>
                  <td>{equipment.nome}</td>
                  <td>{equipment.programa}</td>
                  <td>{currencyFormatter(equipment.valorEstimado)}</td>
                  <td>
                    <span className={`status-pill ${statusClass(equipment.status)}`}>
                      {equipment.status}
                    </span>
                  </td>
                  <td>{equipment.sistemaProdutivo}</td>
                  <td>{equipment.municipio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
      anexos: selectedFiles.map((file) => file.name),
      status: "Disponivel" as const,
    };

    try {
      const response = await api.createEquipment(newEquipment);
      setEquipments((current) => [response.item, ...current]);
      setEquipmentForm(initialEquipmentForm);
      setSelectedFiles([]);
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
      contatoSolicitante: formatPhone(solicitationForm.contatoSolicitante),
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
                    type="file"
                    multiple
                    onChange={(event) =>
                      setSelectedFiles(Array.from(event.target.files ?? []))
                    }
                  />
                </label>
                <div className="file-list">
                  {selectedFiles.length > 0 ? (
                    selectedFiles.map((file) => (
                      <span key={`${file.name}-${file.lastModified}`} className="file-chip">
                        {file.name}
                      </span>
                    ))
                  ) : (
                    <span className="file-helper">Nenhum arquivo selecionado.</span>
                  )}
                </div>
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
                    updateSolicitationForm("contatoSolicitante", formatPhone(event.target.value))
                  }
                  inputMode="numeric"
                  placeholder="71 91234-5678"
                  maxLength={13}
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
