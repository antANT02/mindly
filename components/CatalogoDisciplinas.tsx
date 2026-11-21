"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export interface DisciplinaCard {
  id: string;
  nome: string;
  descricao: string | null;
  corHex: string;
  metaHorasSem: number;
  publica: boolean;
  userId: string;
  autorNome: string;
  totalTarefas: number;
  tarefasConcluidas: number;
  totalSessoes: number;
}

interface CatalogoDisciplinasProps {
  disciplinas: DisciplinaCard[];
  usuario: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export function CatalogoDisciplinas({
  disciplinas,
  usuario,
}: CatalogoDisciplinasProps) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"TODAS" | "PUBLICAS" | "MINHAS">("TODAS");
  const [saindo, setSaindo] = useState(false);

  const disciplinasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return disciplinas.filter((item) => {
      if (filtro === "PUBLICAS" && !item.publica) return false;
      if (filtro === "MINHAS" && (!usuario || item.userId !== usuario.id)) {
        return false;
      }

      if (!termo) return true;

      return (
        item.nome.toLowerCase().includes(termo) ||
        (item.descricao && item.descricao.toLowerCase().includes(termo)) ||
        item.autorNome.toLowerCase().includes(termo)
      );
    });
  }, [disciplinas, busca, filtro, usuario]);

  async function handleLogout() {
    setSaindo(true);
    await signOut();
    router.refresh();
    setSaindo(false);
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1A1C1A]">
      {/* Cabeçalho editorial */}
      <header className="border-b border-[#E5E2DC] bg-[#FCFBF9]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1E3A2F]" />
            <Link
              href="/"
              className="text-base font-semibold tracking-tight text-[#1A1C1A]"
            >
              MindLy
            </Link>
            <span className="hidden text-xs text-[#737873] sm:inline">
              | Caderno de Estudos & Revisão Espaçada
            </span>
          </div>

          <nav className="flex items-center gap-3">
            {usuario ? (
              <>
                <span className="hidden text-sm text-[#4A4E4A] sm:inline">
                  Olá,{" "}
                  <strong className="font-medium text-[#1A1C1A]">
                    {usuario.name}
                  </strong>
                </span>
                <Link
                  href="/workspace"
                  className="rounded-lg bg-[#1E3A2F] px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#162C23]"
                >
                  Meu Workspace
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={saindo}
                  className="rounded-lg border border-[#D6D2C9] bg-white px-3.5 py-1.5 text-sm font-medium text-[#2A2D2A] transition-colors hover:bg-[#F2EFE9] disabled:opacity-60 cursor-pointer"
                >
                  {saindo ? "Saindo..." : "Sair"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-[#2A2D2A] transition-colors hover:bg-[#EFECE6]"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="rounded-lg bg-[#1E3A2F] px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#162C23]"
                >
                  Criar conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Seção principal */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1E3A2F]">
            Biblioteca & Planejamento
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1A1C1A] sm:text-4xl">
            Organize estudos profundos com revisão programada.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#5C615C]">
            Explore trilhas públicas estruturadas por disciplina ou acompanhe suas
            próprias metas semanais, tarefas e sessões de foco.
          </p>
        </div>

        {/* Barra de busca e filtros */}
        <div className="mt-8 flex flex-col gap-4 border-y border-[#E5E2DC] py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por disciplina, tema ou autor..."
              className="w-full rounded-lg border border-[#D6D2C9] bg-white px-4 py-2 text-sm text-[#1A1C1A] placeholder:text-[#8E928E] focus:border-[#1E3A2F] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltro("TODAS")}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                filtro === "TODAS"
                  ? "bg-[#1E3A2F] text-white"
                  : "bg-white text-[#4A4E4A] border border-[#E5E2DC] hover:bg-[#F2EFE9]"
              }`}
            >
              Todas ({disciplinas.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro("PUBLICAS")}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                filtro === "PUBLICAS"
                  ? "bg-[#1E3A2F] text-white"
                  : "bg-white text-[#4A4E4A] border border-[#E5E2DC] hover:bg-[#F2EFE9]"
              }`}
            >
              Públicas
            </button>
            {usuario && (
              <button
                type="button"
                onClick={() => setFiltro("MINHAS")}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  filtro === "MINHAS"
                    ? "bg-[#1E3A2F] text-white"
                    : "bg-white text-[#4A4E4A] border border-[#E5E2DC] hover:bg-[#F2EFE9]"
                }`}
              >
                Minhas
              </button>
            )}
          </div>
        </div>

        {/* Grade de Disciplinas */}
        {disciplinasFiltradas.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-[#D6D2C9] bg-white p-12 text-center">
            <p className="text-base font-medium text-[#2A2D2A]">
              Nenhuma disciplina encontrada para esse filtro.
            </p>
            <p className="mt-1 text-sm text-[#6B706B]">
              Tente limpar o termo de busca ou alternar a aba selecionada.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {disciplinasFiltradas.map((disc) => {
              const progresso =
                disc.totalTarefas > 0
                  ? Math.round((disc.tarefasConcluidas / disc.totalTarefas) * 100)
                  : 0;

              return (
                <article
                  key={disc.id}
                  className="flex flex-col justify-between rounded-xl border border-[#E5E2DC] bg-white p-6 transition-colors hover:border-[#C5C0B6]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-[#5C615C]">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: disc.corHex }}
                        />
                        {disc.metaHorasSem}h / semana
                      </span>

                      <span className="rounded-md bg-[#F3F1EC] px-2.5 py-0.5 text-xs font-medium text-[#4A4E4A]">
                        {disc.publica ? "Pública" : "Privada"}
                      </span>
                    </div>

                    <h2 className="mt-3 text-lg font-semibold tracking-tight text-[#1A1C1A]">
                      {disc.nome}
                    </h2>

                    {disc.descricao && (
                      <p className="mt-2 text-sm leading-relaxed text-[#5C615C]">
                        {disc.descricao}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 border-t border-[#F0EDE6] pt-4">
                    <div className="flex items-center justify-between text-xs text-[#6B706B]">
                      <span>Curadoria: {disc.autorNome}</span>
                      <span>
                        {disc.tarefasConcluidas}/{disc.totalTarefas} tópicos
                        concluídos ({progresso}%)
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EFECE6]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progresso}%`,
                          backgroundColor: disc.corHex,
                        }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}