import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ConsoleLibraryDashboard,
  type ConsoleCoopTaskItem,
  type ConsoleFriendOption,
  type ConsoleLibraryGroupCard,
  type ConsoleLibrarySubjectCard,
  type ConsolePendingRequest,
} from "@/components/console/console-library-dashboard";
import type {
  ConsolePresence,
  ConsoleUserProfile,
} from "@/components/console/console-hud-shell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let sessionUserId: string | null = null;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    sessionUserId = session?.user?.id ?? null;
  } catch (err) {
    console.error("Erro ao obter sessão na HomePage:", err);
  }

  let currentUser: ConsoleUserProfile | null = null;
  if (sessionUserId) {
    try {
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
    } catch (err) {
      console.error("Erro ao carregar usuário na HomePage:", err);
    }
  }

  let subjects: ConsoleLibrarySubjectCard[] = [];
  try {
    const [disciplinas, consoleSubjects] = await Promise.all([
      prisma.disciplina.findMany({
        where: sessionUserId
          ? { OR: [{ publica: true }, { userId: sessionUserId }] }
          : { publica: true },
        include: {
          studyGroup: { select: { id: true, name: true } },
          tarefas: {
            select: { id: true, titulo: true, status: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      sessionUserId
        ? prisma.subject.findMany({
            where: {
              OR: [
                { userId: sessionUserId },
                { group: { consoleMembers: { some: { userId: sessionUserId } } } },
              ],
            },
            include: {
              group: { select: { id: true, name: true } },
              tasks: {
                select: { id: true, title: true, status: true },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 24,
          })
        : Promise.resolve([]),
    ]);

    const mappedConsole = consoleSubjects.map((subj) => {
      const nextPending = subj.tasks.find((t) => t.status !== "DONE");
      return {
        id: subj.id,
        name: subj.name,
        code: subj.code || "DISCIPLINA",
        accentColor: subj.accentColor || "#66C0F4",
        coverImage: subj.coverImage,
        groupId: subj.groupId,
        groupName: subj.group?.name ?? null,
        totalTasks: subj.tasks.length,
        completedTasks: subj.tasks.filter((t) => t.status === "DONE").length,
        nextTaskTitle: nextPending?.title ?? null,
        href: `/disciplinas/${subj.id}`,
      };
    });

    const mappedLegacy = disciplinas.map((disc) => {
      const nextPending = disc.tarefas.find((t) => t.status !== "CONCLUIDA");
      return {
        id: disc.id,
        name: disc.nome,
        code: disc.publica ? "PÚBLICA" : "PRIVADA",
        accentColor: disc.corHex || "#66C0F4",
        coverImage: null,
        groupId: disc.studyGroupId,
        groupName: disc.studyGroup?.name ?? null,
        totalTasks: disc.tarefas.length,
        completedTasks: disc.tarefas.filter((t) => t.status === "CONCLUIDA")
          .length,
        nextTaskTitle: nextPending?.titulo ?? null,
        href: `/disciplinas/${disc.id}`,
      };
    });

    subjects = [...mappedConsole, ...mappedLegacy];
  } catch (err) {
    console.error("Erro ao carregar disciplinas na HomePage:", err);
  }

  let groups: ConsoleLibraryGroupCard[] = [];
  try {
    const studyGroups = await prisma.studyGroup.findMany({
      where: sessionUserId
        ? {
            OR: [
              { ownerId: sessionUserId },
              { consoleMembers: { some: { userId: sessionUserId } } },
              { members: { some: { userId: sessionUserId } } },
            ],
          }
        : undefined,
      include: {
        consoleMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                image: true,
                presence: true,
              },
            },
          },
        },
        _count: { select: { tasks: true, tarefas: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    groups = studyGroups.map((grp) => ({
      id: grp.id,
      name: grp.name,
      description: grp.description,
      bannerColor: grp.bannerColor || "#1A9FFF",
      inviteCode: grp.inviteCode,
      memberCount: grp.consoleMembers.length || 1,
      taskCount: (grp._count?.tasks ?? 0) + (grp._count?.tarefas ?? 0),
      members: grp.consoleMembers.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
        image: m.user.image,
        presence: m.user.presence,
      })),
      href: `/grupos/${grp.id}`,
    }));
  } catch (err) {
    console.error("Erro ao carregar grupos na HomePage:", err);
  }

  const combinedTasks: ConsoleCoopTaskItem[] = [];
  try {
    const coopTasksDb = await prisma.task.findMany({
      where: sessionUserId
        ? {
            OR: [
              { creatorId: sessionUserId },
              { assignees: { some: { userId: sessionUserId } } },
              { group: { consoleMembers: { some: { userId: sessionUserId } } } },
            ],
          }
        : undefined,
      include: {
        subject: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
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
      take: 15,
    });

    for (const task of coopTasksDb) {
      combinedTasks.push({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        subjectName: task.subject?.name ?? null,
        groupName: task.group?.name ?? null,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        href: task.groupId
          ? `/grupos/${task.groupId}?task=${task.id}`
          : task.subjectId
            ? `/disciplinas/${task.subjectId}?task=${task.id}`
            : `/workspace?task=${task.id}`,
        completedByCurrentUser: sessionUserId
          ? task.assignees.some(
              (a) => a.userId === sessionUserId && a.completedIndividual
            )
          : false,
        assignees: task.assignees.map((a) => ({
          userId: a.userId,
          name: a.user.name,
          avatarUrl: a.user.avatarUrl,
          image: a.user.image,
          completedIndividual: a.completedIndividual,
        })),
      });
    }
  } catch (err) {
    console.error("Erro ao carregar tasks Co-op na HomePage:", err);
  }

  try {
    const tarefasLegadas = await prisma.tarefa.findMany({
      where: sessionUserId
        ? {
            OR: [
              { userId: sessionUserId },
              { disciplina: { publica: true } },
            ],
          }
        : { disciplina: { publica: true } },
      include: {
        disciplina: { select: { id: true, nome: true } },
        studyGroup: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    for (const t of tarefasLegadas) {
      combinedTasks.push({
        id: t.id,
        title: t.titulo,
        description: t.descricao,
        priority: t.srsIntervalo >= 4 ? "LOW" : "MEDIUM",
        status: t.status === "CONCLUIDA" ? "DONE" : "TODO",
        subjectName: t.disciplina?.nome ?? null,
        groupName: t.studyGroup?.name ?? null,
        href: `/disciplinas/${t.disciplinaId}?tarefa=${t.id}`,
        completedByCurrentUser: t.status === "CONCLUIDA",
        assignees: [],
      });
    }
  } catch (err) {
    console.error("Erro ao carregar tarefas públicas na HomePage:", err);
  }

  let friends: ConsoleFriendOption[] = [];
  let pendingRequests: ConsolePendingRequest[] = [];

  if (sessionUserId) {
    try {
      const [acceptedRows, incomingRows] = await Promise.all([
        prisma.friendship.findMany({
          where: {
            status: "ACCEPTED",
            OR: [{ requesterId: sessionUserId }, { addresseeId: sessionUserId }],
          },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
                image: true,
                presence: true,
                statusText: true,
                xp: true,
                streakDays: true,
              },
            },
            addressee: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
                image: true,
                presence: true,
                statusText: true,
                xp: true,
                streakDays: true,
              },
            },
          },
        }),
        prisma.friendship.findMany({
          where: {
            addresseeId: sessionUserId,
            status: "PENDING",
          },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
                image: true,
                presence: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      friends = acceptedRows.map((row) =>
        row.requesterId === sessionUserId ? row.addressee : row.requester
      );
      pendingRequests = incomingRows;
    } catch (err) {
      console.error("Erro ao carregar amizades na HomePage:", err);
    }
  }

  return (
    <ConsoleLibraryDashboard
      currentUser={currentUser}
      subjects={subjects}
      groups={groups}
      coopTasks={combinedTasks}
      friends={friends}
      pendingRequests={pendingRequests}
    />
  );
}