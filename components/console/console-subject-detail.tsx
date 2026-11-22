"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import {
  createCoopTaskAction,
  createLegacyDisciplinaTaskAction,
  toggleCoopTaskCompletionAction,
  toggleLegacyDisciplinaTaskAction,
} from "@/app/actions/coop.actions";
import {
  ConsoleHudShell,
  type ConsoleUserProfile,
} from "@/components/console/console-hud-shell";
import type { ConsoleCoopTaskItem } from "@/components/console/console-library-dashboard";

export interface SubjectDetailData {
  id: string;
  name: string;
  code: string | null;
  accentColor: string;
  groupName: string | null;
  isLegacy: boolean;
  tasks: ConsoleCoopTaskItem[];
}

interface ConsoleSubjectDetailProps {
  currentUser: ConsoleUserProfile | null;
  subject: SubjectDetailData;
}

export function ConsoleSubjectDetail({
  currentUser,
  subject,
}: ConsoleSubjectDetailProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const completedCount = subject.tasks.filter(
    (t) => t.completedByCurrentUser
  ).length;
  const progress =
    subject.tasks.length > 0
      ? Math.round((completedCount / subject.tasks.length) * 100)
      : 0;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setFeedback(null);

    const res = subject.isLegacy
      ? await createLegacyDisciplinaTaskAction({
          disciplinaId: subject.id,
          titulo: title.trim(),
          descricao: description.trim() || null,
        })
      : await createCoopTaskAction({
          title: title.trim(),
          description: description.trim() || null,
          priority: "MEDIUM",
          subjectId: subject.id,
          assigneeIds: [],
        });

    setSubmitting(false);
    if (!res.ok) {
      setFeedback(res.error || "Erro ao adicionar tarefa.");
      return;
    }

    setTitle("");
    setDescription("");
    setFeedback("Tarefa vinculada à disciplina.");
    router.refresh();
  };

  const handleToggle = async (taskId: string, currentCompleted: boolean) => {
    setTogglingId(taskId);
    if (subject.isLegacy) {
      await toggleLegacyDisciplinaTaskAction(taskId, !currentCompleted);
    } else {
      await toggleCoopTaskCompletionAction(taskId, !currentCompleted);
    }
    setTogglingId(null);
    router.refresh();
  };

  return (
    <ConsoleHudShell user={currentUser} ambientColor={subject.accentColor}>
      <div className="space-y-6">
        {/* Header Cinematográfico estilo Steam Library Detail */}
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#121820]">
          <div
            className="h-44 w-full"
            style={{
              backgroundImage: `radial-gradient(circle at 80% 20%, ${subject.accentColor}66 0%, transparent 60%), linear-gradient(180deg, ${subject.accentColor}22 0%, #0B0F14 100%)`,
            }}
          />
          <div className="relative -mt-20 px-6 pb-6">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="rounded bg-[#0B0F14]/85 px-2 py-0.5 text-[#66C0F4]">
                {subject.code || "DISCIPLINA"}
              </span>
              {subject.groupName && (
                <span className="rounded bg-[#0B0F14]/85 px-2 py-0.5 text-[#A4D007]">
                  {subject.groupName}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold capitalize tracking-tight text-[#F3F4F6] sm:text-3xl">
              {subject.name}
            </h1>
          </div>

          {/* Action Bar Integrada */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] bg-[#0B0F14]/70 px-6 py-3.5">
            <div className="flex items-center gap-6 font-mono text-xs tabular-nums">
              <div>
                <span className="text-[#8F98A0]">Progresso </span>
                <strong className="text-[#F3F4F6]">{progress}%</strong>
              </div>
              <div>
                <span className="text-[#8F98A0]">Concluídas </span>
                <strong className="text-[#A4D007]">
                  {completedCount}/{subject.tasks.length}
                </strong>
              </div>
            </div>

            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-[#1A222D]">
              <div
                className="h-full transition-all"
                style={{
                  width: `${progress}%`,
                  backgroundColor: subject.accentColor,
                }}
              />
            </div>
          </div>
        </section>

        {feedback && (
          <div className="rounded-xl border border-[#66C0F4]/30 bg-[#66C0F4]/10 px-4 py-2 text-xs text-[#66C0F4]">
            {feedback}
          </div>
        )}

        {/* Grid de Conteúdo (2 Colunas) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {currentUser && (
              <form
                onSubmit={handleAddTask}
                className="flex flex-col gap-2.5 rounded-2xl border border-white/[0.07] bg-[#121820] p-4 sm:flex-row"
              >
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nova atividade nesta disciplina..."
                  className="flex-1 rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nota opcional"
                  className="rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4] sm:w-48"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1A9FFF] px-4 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#66C0F4] disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>{submitting ? "Salvando..." : "Adicionar"}</span>
                </button>
              </form>
            )}

            <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#121820]">
              {subject.tasks.length === 0 ? (
                <p className="p-8 text-center text-sm text-[#8F98A0]">
                  Nenhuma tarefa cadastrada nesta disciplina ainda.
                </p>
              ) : (
                subject.tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={togglingId === t.id}
                        onClick={() =>
                          handleToggle(t.id, t.completedByCurrentUser)
                        }
                        className="text-[#8F98A0] transition hover:text-[#66C0F4] disabled:opacity-50"
                      >
                        {t.completedByCurrentUser ? (
                          <CheckCircle2 className="h-4.5 w-4.5 text-[#A4D007]" />
                        ) : (
                          <Circle className="h-4.5 w-4.5" />
                        )}
                      </button>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            t.completedByCurrentUser
                              ? "line-through text-[#8F98A0]"
                              : "text-[#F3F4F6]"
                          }`}
                        >
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="text-xs text-[#8F98A0]">
                            {t.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="h-fit space-y-3 rounded-2xl border border-white/[0.07] bg-[#121820] p-5 lg:col-span-4">
            <h2 className="font-mono text-xs uppercase tracking-wider text-[#8F98A0]">
              Resumo da Trilha
            </h2>
            <div className="space-y-2 text-xs text-[#8F98A0]">
              <div className="flex justify-between">
                <span>Total de entregas</span>
                <span className="font-mono tabular-nums text-[#F3F4F6]">
                  {subject.tasks.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Concluídas</span>
                <span className="font-mono tabular-nums text-[#A4D007]">
                  {completedCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pendentes</span>
                <span className="font-mono tabular-nums text-[#E5A93C]">
                  {Math.max(0, subject.tasks.length - completedCount)}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ConsoleHudShell>
  );
}