"use client";

import React, { useState } from "react";
import { Check, Copy, Plus, Users, BookOpen } from "lucide-react";
import { EditorialAvatar } from "@/components/EditorialAvatar";
import {
  createGroupDisciplinaAction,
  createGroupTarefaAction,
  toggleTarefaConclusaoMembroAction,
} from "@/app/actions/mindly";

interface GroupMemberItem {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: "OWNER" | "MEMBER";
}

interface GroupDisciplinaItem {
  id: string;
  nome: string;
  descricao: string | null;
  corHex: string;
  metaHorasSem: number;
  _count: { tarefas: number };
}

interface GroupTarefaItem {
  id: string;
  titulo: string;
  notas: string | null;
  disciplinaId: string;
  disciplinaNome: string;
  autorNome: string;
  concluidoPorUserIds: string[];
}

interface StudyGroupViewClientProps {
  currentUserId: string;
  group: {
    id: string;
    name: string;
    description: string | null;
    inviteCode: string;
  };
  members: GroupMemberItem[];
  disciplinas: GroupDisciplinaItem[];
  tarefas: GroupTarefaItem[];
}

export function StudyGroupViewClient({
  currentUserId,
  group,
  members,
  disciplinas,
  tarefas,
}: StudyGroupViewClientProps) {
  const [copied, setCopied] = useState(false);
  const [discNome, setDiscNome] = useState("");
  const [discDesc, setDiscDesc] = useState("");
  const [discMeta, setDiscMeta] = useState(6);

  const [tarefaTitulo, setTarefaTitulo] = useState("");
  const [tarefaNotas, setTarefaNotas] = useState("");
  const [tarefaDiscId, setTarefaDiscId] = useState(disciplinas[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleCopyCode() {
    await navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleAddDisciplina(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    const res = await createGroupDisciplinaAction({
      groupId: group.id,
      nome: discNome,
      descricao: discDesc,
      metaHorasSem: discMeta,
    });
    setBusy(false);
    if (!res.ok) {
      setFeedback(res.error);
      return;
    }
    setDiscNome("");
    setDiscDesc("");
  }

  async function handleAddTarefa(e: React.FormEvent) {
    e.preventDefault();
    if (!tarefaDiscId) return;
    setBusy(true);
    setFeedback(null);
    const res = await createGroupTarefaAction({
      groupId: group.id,
      disciplinaId: tarefaDiscId,
      titulo: tarefaTitulo,
      notas: tarefaNotas,
    });
    setBusy(false);
    if (!res.ok) {
      setFeedback(res.error);
      return;
    }
    setTarefaTitulo("");
    setTarefaNotas("");
  }

  async function handleToggleConclusao(tarefaId: string) {
    await toggleTarefaConclusaoMembroAction({
      groupId: group.id,
      tarefaId,
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-line bg-surface p-6 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-ink-muted">
            {group.description || "Espaço colaborativo de disciplinas e tarefas"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-md border border-line bg-paper px-3 py-1.5">
            <span className="mr-2 text-[11px] uppercase tracking-wider text-ink-muted">
              Convite
            </span>
            <span className="font-mono text-sm font-medium text-ink">
              {group.inviteCode}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="editorial-transition inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium text-ink hover:border-olive hover:text-olive"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-olive" strokeWidth={1.5} />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Copiar código</span>
              </>
            )}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-md border border-line bg-surface px-4 py-3 text-xs text-ink">
          {feedback}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-lg border border-line bg-surface p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl text-ink">
                Tarefas compartilhadas
              </h2>
              <span className="text-xs text-ink-muted">
                {tarefas.length} {tarefas.length === 1 ? "tarefa" : "tarefas"}
              </span>
            </div>

            {disciplinas.length > 0 && (
              <form
                onSubmit={handleAddTarefa}
                className="mb-6 grid gap-3 border-b border-line pb-6 sm:grid-cols-4"
              >
                <select
                  value={tarefaDiscId}
                  onChange={(e) => setTarefaDiscId(e.target.value)}
                  className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-olive focus:outline-none"
                >
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={tarefaTitulo}
                  onChange={(e) => setTarefaTitulo(e.target.value)}
                  placeholder="Nova tarefa compartilhada..."
                  className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-olive focus:outline-none sm:col-span-2"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="editorial-transition inline-flex items-center justify-center gap-1.5 rounded-md bg-olive px-3.5 py-2 text-xs font-medium text-surface hover:bg-olive-deep disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>Adicionar</span>
                </button>
              </form>
            )}

            {tarefas.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                Nenhuma tarefa cadastrada neste grupo ainda.
              </p>
            ) : (
              <div className="divide-y divide-line">
                {tarefas.map((t) => {
                  const doneByMe = t.concluidoPorUserIds.includes(currentUserId);
                  const completedMembers = members.filter((m) =>
                    t.concluidoPorUserIds.includes(m.userId)
                  );

                  return (
                    <div
                      key={t.id}
                      className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleConclusao(t.id)}
                          aria-label="Alternar minha conclusão"
                          className={`editorial-transition mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-xs border ${
                            doneByMe
                              ? "border-olive bg-olive text-surface"
                              : "border-line-strong bg-paper text-transparent hover:border-olive"
                          }`}
                        >
                          <Check className="h-3 w-3" strokeWidth={2} />
                        </button>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              doneByMe
                                ? "text-ink-muted line-through"
                                : "text-ink"
                            }`}
                          >
                            {t.titulo}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-subtle">
                            {t.disciplinaNome} · criada por {t.autorNome}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-8 sm:pl-0">
                        <span className="text-[11px] text-ink-muted">
                          {completedMembers.length}/{members.length} concluíram
                        </span>
                        <div className="flex -space-x-1.5">
                          {completedMembers.map((cm) => (
                            <span
                              key={cm.userId}
                              title={`${cm.name} concluiu`}
                              className="ring-1 ring-surface rounded-md"
                            >
                              <EditorialAvatar
                                src={cm.image}
                                name={cm.name}
                                email={cm.email}
                                size="sm"
                              />
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-line bg-surface p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl text-ink">
                Disciplinas em comum
              </h2>
              <BookOpen className="h-4 w-4 text-olive" strokeWidth={1.5} />
            </div>

            <form
              onSubmit={handleAddDisciplina}
              className="mb-6 grid gap-3 border-b border-line pb-6 sm:grid-cols-4"
            >
              <input
                type="text"
                required
                value={discNome}
                onChange={(e) => setDiscNome(e.target.value)}
                placeholder="Nome da disciplina"
                className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-olive focus:outline-none sm:col-span-2"
              />
              <input
                type="number"
                min={1}
                max={60}
                value={discMeta}
                onChange={(e) => setDiscMeta(Number(e.target.value))}
                placeholder="Meta h/sem"
                className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-olive focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="editorial-transition rounded-md border border-line bg-paper px-3.5 py-2 text-xs font-medium text-ink hover:border-olive hover:text-olive disabled:opacity-50"
              >
                Nova disciplina
              </button>
            </form>

            {disciplinas.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Nenhuma disciplina cadastrada no grupo.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {disciplinas.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-md border border-line bg-paper p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">
                        {d.nome}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {d.metaHorasSem}h/sem
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-subtle">
                      {d._count.tarefas} tarefas vinculadas
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="rounded-lg border border-line bg-surface p-6 h-fit">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl text-ink">Integrantes</h2>
            <Users className="h-4 w-4 text-olive" strokeWidth={1.5} />
          </div>

          <div className="divide-y divide-line">
            {members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <EditorialAvatar
                    src={m.image}
                    name={m.name}
                    email={m.email}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {m.name}
                    </p>
                    <p className="truncate text-xs text-ink-subtle">{m.email}</p>
                  </div>
                </div>
                <span className="ml-2 shrink-0 rounded-xs border border-line bg-paper px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
                  {m.role === "OWNER" ? "Admin" : "Membro"}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}