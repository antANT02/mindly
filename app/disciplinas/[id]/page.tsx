import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ConsoleHudShell,
  type ConsolePresence,
  type ConsoleUserProfile,
} from "@/components/console/console-hud-shell";
import {
  ConsoleSubjectDetail,
  type SubjectDetailData,
} from "@/components/console/console-subject-detail";

export const dynamic = "force-dynamic";

interface SubjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function DisciplinaDetalhePage({
  params,
}: SubjectPageProps) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const sessionUserId = session?.user?.id ?? null;

  let currentUser: ConsoleUserProfile | null = null;
  if (sessionUserId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        image: true,
        bio: true,
        statusText: true,
        presence: true,
        xp: true,
        streakDays: true,
        metaDiariaMinutos: true,
      },
    });
    if (dbUser) {
      currentUser = {
        ...dbUser,
        presence: (dbUser.presence as ConsolePresence) || "ONLINE",
      };
    }
  }

  const subjectDb = await prisma.subject.findUnique({
    where: { id },
    include: {
      group: { select: { name: true } },
      tasks: {
        include: {
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (subjectDb) {
    const detail: SubjectDetailData = {
      id: subjectDb.id,
      name: subjectDb.name,
      code: subjectDb.code,
      accentColor: subjectDb.accentColor || "#66C0F4",
      groupName: subjectDb.group?.name ?? null,
      isLegacy: false,
      tasks: subjectDb.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        subjectName: subjectDb.name,
        groupName: subjectDb.group?.name ?? null,
        href: `/disciplinas/${subjectDb.id}?task=${t.id}`,
        completedByCurrentUser: sessionUserId
          ? t.assignees.some(
              (a) => a.userId === sessionUserId && a.completedIndividual
            )
          : t.status === "DONE",
        assignees: t.assignees.map((a) => ({
          userId: a.userId,
          name: a.user.name,
          avatarUrl: a.user.avatarUrl,
          image: a.user.image,
          completedIndividual: a.completedIndividual,
        })),
      })),
    };

    return <ConsoleSubjectDetail currentUser={currentUser} subject={detail} />;
  }

  const legacyDisc = await prisma.disciplina.findUnique({
    where: { id },
    include: {
      studyGroup: { select: { name: true } },
      tarefas: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!legacyDisc) {
    return (
      <ConsoleHudShell user={currentUser}>
        <div className="mx-auto max-w-lg rounded-2xl border border-white/[0.08] bg-[#121820] p-8 text-center">
          <h1 className="text-lg font-bold text-[#F3F4F6]">
            Disciplina não encontrada
          </h1>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-[#1A9FFF] px-4 py-2 text-xs font-semibold text-[#0B0F14]"
          >
            Voltar à Biblioteca
          </Link>
        </div>
      </ConsoleHudShell>
    );
  }

  const legacyDetail: SubjectDetailData = {
    id: legacyDisc.id,
    name: legacyDisc.nome,
    code: legacyDisc.publica ? "PÚBLICA" : "PRIVADA",
    accentColor: legacyDisc.corHex || "#66C0F4",
    groupName: legacyDisc.studyGroup?.name ?? null,
    isLegacy: true,
    tasks: legacyDisc.tarefas.map((t) => ({
      id: t.id,
      title: t.titulo,
      description: t.descricao,
      priority: "MEDIUM",
      status: t.status === "CONCLUIDA" ? "DONE" : "TODO",
      subjectName: legacyDisc.nome,
      groupName: legacyDisc.studyGroup?.name ?? null,
      href: `/disciplinas/${legacyDisc.id}?tarefa=${t.id}`,
      completedByCurrentUser: t.status === "CONCLUIDA",
      assignees: [],
    })),
  };

  return (
    <ConsoleSubjectDetail currentUser={currentUser} subject={legacyDetail} />
  );
}