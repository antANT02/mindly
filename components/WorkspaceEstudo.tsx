"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TarefaItem {
  id: string;
  titulo: string;
  descricao: string | null;
  estimativaMin: number;
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA";
  srsIntervalo: number;
  proximaRevisao: string | null;
  ultimaQualidade: "DIFICIL" | "BOM" | "FACIL" | null;
  disciplinaId: string;
}

interface DisciplinaWorkspace {
  id: string;
  nome: string;
  descricao: string | null;
  corHex: string;
  metaHorasSem: number;
  publica: boolean;
  tarefas: TarefaItem[];
}

export interface MetaItem {
  id: string;
  titulo: string;
  descricao: string | null;
  horasAlvo: number;
  horasAtuais: number;
  disciplinaNome: string | null;
}

export interface SessaoItem {
  id: string;
  modo: string;
  duracaoMin: number;
  anotacoesZen: string | null;
  disciplinaNome: string;
  concluidaEm: string;
}

interface WorkspaceEstudoProps {
  disciplinasIniciais: DisciplinaWorkspace[];
  metasIniciais?: MetaItem[];
  sessoesIniciais?: SessaoItem[];
  usuarioNome: string;
}

export function WorkspaceEstudo({
  disciplinasIniciais,
  metasIniciais = [],
  sessoesIniciais = [],
  usuarioNome,
}: WorkspaceEstudoProps) {
  const router = useRouter();
  const [disciplinas, setDisciplinas] =
    useState<DisciplinaWorkspace[]>(disciplinasIniciais);
  const [metas, setMetas] = useState<MetaItem[]>(metasIniciais);
  const [sessoes, setSessoes] = useState<SessaoItem[]>(sessoesIniciais);

  // Nova disciplina
  const [nomeDisc, setNomeDisc] = useState("");
  const [descDisc, setDescDisc] = useState("");
  const [metaHoras, setMetaHoras] = useState(6);
  const [publicaDisc, setPublicaDisc] = useState(false);
  const [salvandoDisc, setSalvandoDisc] = useState(false);

  // Nova tarefa
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(
    disciplinasIniciais[0]?.id || ""
  );
  const [tituloTarefa, setTituloTarefa] = useState("");
  const [estimativaMin, setEstimativaMin] = useState(25);
  const [salvandoTarefa, setSalvandoTarefa] = useState(false);

  // Nova sessão de estudo
  const [disciplinaSessao, setDisciplinaSessao] = useState(
    disciplinasIniciais[0]?.id || ""
  );
  const [modoSessao, setModoSessao] = useState("POMODORO_25_5");
  const [duracaoSessao, setDuracaoSessao] = useState(25);
  const [anotacoesZen, setAnotacoesZen] = useState("");
  const [salvandoSessao, setSalvandoSessao] = useState(false);

  // Nova meta
  const [tituloMeta, setTituloMeta] = useState("");
  const [horasAlvoMeta, setHorasAlvoMeta] = useState(20);
  const [disciplinaMeta, setDisciplinaMeta] = useState("");
  const [salvandoMeta, setSalvandoMeta] = useState(false);

  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleCriarDisciplina(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    setSalvandoDisc(true);

    const res = await fetch("/api/disciplinas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nomeDisc,
        descricao: descDisc || null,
        metaHorasSem: metaHoras,
        publica: publicaDisc,
        corHex: "#1E3A2F",
      }),
    });

    const data = await res.json();
    setSalvandoDisc(false);

    if (!res.ok) {
      setErro(data.error || "Erro ao criar disciplina.");
      return;
    }

    const nova: DisciplinaWorkspace = {
      ...data.disciplina,
      tarefas: [],
    };

    setDisciplinas((prev) => [nova, ...prev]);
    if (!disciplinaSelecionada) setDisciplinaSelecionada(nova.id);
    if (!disciplinaSessao) setDisciplinaSessao(nova.id);
    setNomeDisc("");
    setDescDisc("");
    setPublicaDisc(false);
    setMensagem("Disciplina adicionada ao seu workspace.");
    router.refresh();
  }

  async function handleCriarTarefa(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);

    if (!disciplinaSelecionada) {
      setErro("Crie uma disciplina antes de adicionar uma tarefa.");
      return;
    }

    setSalvandoTarefa(true);

    const res = await fetch("/api/tarefas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: tituloTarefa,
        estimativaMin,
        disciplinaId: disciplinaSelecionada,
      }),
    });

    const data = await res.json();
    setSalvandoTarefa(false);

    if (!res.ok) {
      setErro(data.error || "Erro ao criar tarefa.");
      return;
    }

    const tarefaCriada: TarefaItem = {
      ...data.tarefa,
      proximaRevisao: data.tarefa.proximaRevisao
        ? String(data.tarefa.proximaRevisao)
        : null,
    };

    setDisciplinas((prev) =>
      prev.map((d) =>
        d.id === disciplinaSelecionada
          ? { ...d, tarefas: [tarefaCriada, ...d.tarefas] }
          : d
      )
    );
    setTituloTarefa("");
    setMensagem("Tópico de revisão adicionado.");
    router.refresh();
  }

  async function handleRevisarTarefa(
    tarefaId: string,
    disciplinaId: string,
    qualidade: "DIFICIL" | "BOM" | "FACIL"
  ) {
    setErro(null);
    setMensagem(null);

    const res = await fetch(`/api/tarefas/${tarefaId}/revisar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qualidade }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErro(data.error || "Erro ao registrar revisão.");
      return;
    }

    setDisciplinas((prev) =>
      prev.map((d) => {
        if (d.id !== disciplinaId) return d;
        return {
          ...d,
          tarefas: d.tarefas.map((t) =>
            t.id === tarefaId
              ? {
                  ...t,
                  status: data.tarefa.status,
                  srsIntervalo: data.tarefa.srsIntervalo,
                  proximaRevisao: data.tarefa.proximaRevisao
                    ? String(data.tarefa.proximaRevisao)
                    : null,
                  ultimaQualidade: data.tarefa.ultimaQualidade,
                }
              : t
          ),
        };
      })
    );

    setMensagem(
      `Revisão registrada (${qualidade.toLowerCase()}). Novo intervalo SRS atualizado.`
    );
    router.refresh();
  }

  async function handleRegistrarSessao(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);

    const discId = disciplinaSessao || disciplinas[0]?.id;
    if (!discId) {
      setErro("Crie uma disciplina antes de registrar uma sessão.");
      return;
    }

    setSalvandoSessao(true);

    const res = await fetch("/api/sessoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        disciplinaId: discId,
        modo: modoSessao,
        duracaoMin: duracaoSessao,
        anotacoesZen: anotacoesZen || null,
      }),
    });

    const data = await res.json();
    setSalvandoSessao(false);

    if (!res.ok) {
      setErro(data.error || "Erro ao registrar sessão.");
      return;
    }

    const discObj = disciplinas.find((d) => d.id === discId);
    const novaSessao: SessaoItem = {
      id: data.sessao.id,
      modo: data.sessao.modo,
      duracaoMin: data.sessao.duracaoMin,
      anotacoesZen: data.sessao.anotacoesZen,
      disciplinaNome: discObj?.nome || "Disciplina",
      concluidaEm: String(data.sessao.concluidaEm),
    };

    const horasIncremento = Math.max(1, Math.round(duracaoSessao / 60));

    setSessoes((prev) => [novaSessao, ...prev].slice(0, 10));
    setMetas((prev) =>
      prev.map((m) =>
        m.disciplinaNome && discObj && m.disciplinaNome === discObj.nome
          ? { ...m, horasAtuais: m.horasAtuais + horasIncremento }
          : m
      )
    );
    setAnotacoesZen("");
    setMensagem("Sessão de estudo registrada e progresso atualizado.");
    router.refresh();
  }

  async function handleCriarMeta(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    setSalvandoMeta(true);

    const res = await fetch("/api/metas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: tituloMeta,
        horasAlvo: horasAlvoMeta,
        disciplinaId: disciplinaMeta || null,
      }),
    });

    const data = await res.json();
    setSalvandoMeta(false);

    if (!res.ok) {
      setErro(data.error || "Erro ao criar meta.");
      return;
    }

    const discObj = disciplinas.find((d) => d.id === disciplinaMeta);
    const novaMeta: MetaItem = {
      id: data.meta.id,
      titulo: data.meta.titulo,
      descricao: data.meta.descricao,
      horasAlvo: data.meta.horasAlvo,
      horasAtuais: data.meta.horasAtuais,
      disciplinaNome: discObj?.nome ?? null,
    };

    setMetas((prev) => [novaMeta, ...prev]);
    setTituloMeta("");
    setDisciplinaMeta("");
    setMensagem("Meta criada com sucesso.");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1A1C1A]">
      <header className="border-b border-[#E5E2DC] bg-[#FCFBF9]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-base font-semibold tracking-tight text-[#1A1C1A]"
            >
              MindLy
            </Link>
            <span className="text-xs text-[#737873]">/ Workspace</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[#4A4E4A] sm:inline">
              {usuarioNome}
            </span>
            <Link
              href="/"
              className="rounded-lg border border-[#D6D2C9] bg-white px-3.5 py-1.5 text-sm font-medium text-[#2A2D2A] hover:bg-[#F2EFE9]"
            >
              Ver catálogo público
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1E3A2F]">
            Painel do Estudante
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Suas disciplinas, revisões espaçadas e metas
          </h1>
        </div>

        {mensagem && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {erro}
          </div>
        )}

        {/* Formulários: Disciplina e Tarefa */}
        <div className="grid gap-6 md:grid-cols-2 mb-10">
          <form
            onSubmit={handleCriarDisciplina}
            className="rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-4"
          >
            <h2 className="text-base font-semibold text-[#1A1C1A]">
              Nova Disciplina
            </h2>

            <div>
              <label className="block text-xs font-medium text-[#3E423E] mb-1">
                Nome da disciplina
              </label>
              <input
                type="text"
                required
                value={nomeDisc}
                onChange={(e) => setNomeDisc(e.target.value)}
                placeholder="Ex.: Engenharia de Software"
                className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3E423E] mb-1">
                Descrição curta (opcional)
              </label>
              <input
                type="text"
                value={descDisc}
                onChange={(e) => setDescDisc(e.target.value)}
                placeholder="Foco, ementa ou referência principal"
                className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="w-32">
                <label className="block text-xs font-medium text-[#3E423E] mb-1">
                  Meta (h/sem)
                </label>
                <input
                  type="number"
                  min={1}
                  max={80}
                  value={metaHoras}
                  onChange={(e) => setMetaHoras(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#4A4E4A] pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicaDisc}
                  onChange={(e) => setPublicaDisc(e.target.checked)}
                  className="rounded border-[#C5C0B6]"
                />
                Exibir no catálogo público
              </label>
            </div>

            <button
              type="submit"
              disabled={salvandoDisc}
              className="w-full rounded-lg bg-[#1E3A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#162C23] disabled:opacity-60 cursor-pointer"
            >
              {salvandoDisc ? "Salvando..." : "Adicionar disciplina"}
            </button>
          </form>

          <form
            onSubmit={handleCriarTarefa}
            className="rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-4"
          >
            <h2 className="text-base font-semibold text-[#1A1C1A]">
              Novo Tópico / Tarefa de Estudo
            </h2>

            <div>
              <label className="block text-xs font-medium text-[#3E423E] mb-1">
                Disciplina
              </label>
              <select
                value={disciplinaSelecionada}
                onChange={(e) => setDisciplinaSelecionada(e.target.value)}
                className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
              >
                {disciplinas.length === 0 && (
                  <option value="">Crie uma disciplina primeiro</option>
                )}
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3E423E] mb-1">
                Título do tópico ou atividade
              </label>
              <input
                type="text"
                required
                value={tituloTarefa}
                onChange={(e) => setTituloTarefa(e.target.value)}
                placeholder="Ex.: Resolver exercícios de normalização SQL"
                className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3E423E] mb-1">
                Estimativa (minutos)
              </label>
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={estimativaMin}
                onChange={(e) => setEstimativaMin(Number(e.target.value))}
                className="w-32 rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={salvandoTarefa || disciplinas.length === 0}
              className="w-full rounded-lg bg-[#1E3A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#162C23] disabled:opacity-60 cursor-pointer"
            >
              {salvandoTarefa ? "Adicionando..." : "Adicionar tarefa"}
            </button>
          </form>
        </div>

        {/* Lista de disciplinas do usuário e suas tarefas com SRS */}
        <div className="space-y-6 mb-12">
          {disciplinas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D6D2C9] bg-white p-10 text-center text-sm text-[#5C615C]">
              Você ainda não criou disciplinas próprias. Use o formulário acima para começar.
            </div>
          ) : (
            disciplinas.map((disc) => (
              <section
                key={disc.id}
                className="rounded-xl border border-[#E5E2DC] bg-white p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EDE6] pb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1A1C1A]">
                      {disc.nome}
                    </h3>
                    {disc.descricao && (
                      <p className="text-sm text-[#5C615C]">{disc.descricao}</p>
                    )}
                  </div>
                  <span className="rounded-md bg-[#F3F1EC] px-3 py-1 text-xs font-medium text-[#3E423E]">
                    Meta: {disc.metaHorasSem}h/sem · {disc.tarefas.length} tópicos
                  </span>
                </div>

                {disc.tarefas.length === 0 ? (
                  <p className="mt-4 text-sm text-[#737873]">
                    Nenhuma tarefa cadastrada nesta disciplina ainda.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-[#F0EDE6]">
                    {disc.tarefas.map((tarefa) => (
                      <li
                        key={tarefa.id}
                        className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#1A1C1A]">
                              {tarefa.titulo}
                            </span>
                            <span className="rounded bg-[#F3F1EC] px-2 py-0.5 text-[11px] font-medium text-[#4A4E4A]">
                              Intervalo SRS: {tarefa.srsIntervalo}d
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[#6B706B]">
                            Estimativa: {tarefa.estimativaMin} min · Status:{" "}
                            {tarefa.status}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#6B706B] mr-1">
                            Avaliar revisão:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleRevisarTarefa(tarefa.id, disc.id, "DIFICIL")
                            }
                            className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 cursor-pointer"
                          >
                            Difícil (1d)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRevisarTarefa(tarefa.id, disc.id, "BOM")
                            }
                            className="rounded-md border border-[#D6D2C9] bg-[#F8F7F4] px-2.5 py-1 text-xs font-medium text-[#1A1C1A] hover:bg-[#EFECE6] cursor-pointer"
                          >
                            Bom
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRevisarTarefa(tarefa.id, disc.id, "FACIL")
                            }
                            className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100 cursor-pointer"
                          >
                            Fácil
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))
          )}
        </div>

        {/* Seção de Metas e Sessões de Estudo */}
        <div className="border-t border-[#E5E2DC] pt-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1E3A2F]">
              Consistência & Registro
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#1A1C1A]">
              Metas de longo prazo e sessões de foco
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-10">
            {/* Formulário de Sessão de Estudo */}
            <form
              onSubmit={handleRegistrarSessao}
              className="rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-4"
            >
              <h3 className="text-base font-semibold text-[#1A1C1A]">
                Registrar Sessão de Estudo
              </h3>

              <div>
                <label className="block text-xs font-medium text-[#3E423E] mb-1">
                  Disciplina estudada
                </label>
                <select
                  value={disciplinaSessao || disciplinas[0]?.id || ""}
                  onChange={(e) => setDisciplinaSessao(e.target.value)}
                  className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
                >
                  {disciplinas.length === 0 && (
                    <option value="">Crie uma disciplina primeiro</option>
                  )}
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#3E423E] mb-1">
                    Modo
                  </label>
                  <select
                    value={modoSessao}
                    onChange={(e) => setModoSessao(e.target.value)}
                    className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
                  >
                    <option value="POMODORO_25_5">Pomodoro (25/5)</option>
                    <option value="BLOCO_50_10">Bloco Profundo (50/10)</option>
                    <option value="LEITURA_LIVRE">Leitura & Fichamento</option>
                    <option value="REVISAO_SRS">Revisão Ativa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#3E423E] mb-1">
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    required
                    value={duracaoSessao}
                    onChange={(e) => setDuracaoSessao(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3E423E] mb-1">
                  Anotações da sessão (opcional)
                </label>
                <textarea
                  rows={2}
                  value={anotacoesZen}
                  onChange={(e) => setAnotacoesZen(e.target.value)}
                  placeholder="O que foi consolidado ou ficou pendente nesta sessão?"
                  className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={salvandoSessao || disciplinas.length === 0}
                className="w-full rounded-lg bg-[#1E3A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#162C23] disabled:opacity-60 cursor-pointer"
              >
                {salvandoSessao ? "Registrando..." : "Registrar sessão"}
              </button>
            </form>

            {/* Formulário de Meta */}
            <form
              onSubmit={handleCriarMeta}
              className="rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-4"
            >
              <h3 className="text-base font-semibold text-[#1A1C1A]">
                Nova Meta de Horas
              </h3>

              <div>
                <label className="block text-xs font-medium text-[#3E423E] mb-1">
                  Título da meta
                </label>
                <input
                  type="text"
                  required
                  value={tituloMeta}
                  onChange={(e) => setTituloMeta(e.target.value)}
                  placeholder="Ex.: Dominar Cálculo Integral no semestre"
                  className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#3E423E] mb-1">
                    Horas alvo
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    value={horasAlvoMeta}
                    onChange={(e) => setHorasAlvoMeta(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#3E423E] mb-1">
                    Disciplina vinculada
                  </label>
                  <select
                    value={disciplinaMeta}
                    onChange={(e) => setDisciplinaMeta(e.target.value)}
                    className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3 py-2 text-sm focus:border-[#1E3A2F] focus:outline-none"
                  >
                    <option value="">Geral (sem vínculo)</option>
                    {disciplinas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={salvandoMeta}
                className="w-full rounded-lg bg-[#1E3A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#162C23] disabled:opacity-60 cursor-pointer"
              >
                {salvandoMeta ? "Criando meta..." : "Criar meta"}
              </button>
            </form>
          </div>

          {/* Lista de Metas + Histórico de Sessões */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Metas ativas */}
            <section className="rounded-xl border border-[#E5E2DC] bg-white p-6">
              <h3 className="text-base font-semibold text-[#1A1C1A] mb-4">
                Metas em andamento ({metas.length})
              </h3>

              {metas.length === 0 ? (
                <p className="text-sm text-[#737873]">
                  Nenhuma meta cadastrada ainda.
                </p>
              ) : (
                <ul className="space-y-4">
                  {metas.map((meta) => {
                    const pct = Math.min(
                      100,
                      Math.round((meta.horasAtuais / Math.max(1, meta.horasAlvo)) * 100)
                    );

                    return (
                      <li
                        key={meta.id}
                        className="rounded-lg border border-[#F0EDE6] bg-[#FCFBF9] p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-[#1A1C1A]">
                            {meta.titulo}
                          </span>
                          <span className="text-xs font-medium text-[#1E3A2F]">
                            {meta.horasAtuais}h / {meta.horasAlvo}h ({pct}%)
                          </span>
                        </div>

                        {meta.disciplinaNome && (
                          <p className="mt-0.5 text-xs text-[#6B706B]">
                            Disciplina: {meta.disciplinaNome}
                          </p>
                        )}

                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EFECE6]">
                          <div
                            className="h-full rounded-full bg-[#1E3A2F] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Histórico de Sessões */}
            <section className="rounded-xl border border-[#E5E2DC] bg-white p-6">
              <h3 className="text-base font-semibold text-[#1A1C1A] mb-4">
                Sessões recentes ({sessoes.length})
              </h3>

              {sessoes.length === 0 ? (
                <p className="text-sm text-[#737873]">
                  Nenhuma sessão registrada ainda.
                </p>
              ) : (
                <ul className="divide-y divide-[#F0EDE6]">
                  {sessoes.map((sessao) => (
                    <li key={sessao.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-[#1A1C1A]">
                          {sessao.disciplinaNome}
                        </span>
                        <span className="rounded bg-[#F3F1EC] px-2 py-0.5 text-xs font-medium text-[#3E423E]">
                          {sessao.duracaoMin} min · {sessao.modo}
                        </span>
                      </div>

                      {sessao.anotacoesZen && (
                        <p className="mt-1 text-xs text-[#5C615C]">
                          {sessao.anotacoesZen}
                        </p>
                      )}

                      <p className="mt-1 text-[11px] text-[#8E928E]">
                        {new Date(sessao.concluidaEm).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}