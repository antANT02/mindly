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
  ConsoleWorkspaceView,
  type WorkspaceSubjectItem,
} from "@/components/console/console-workspace-view";
import type { ConsoleCoopTaskItem } from "@/components/console/console-library-dashboard";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const sessionUserId = session?.user?.id ?? null;

  if (!sessionUserId) {
    return (
      <ConsoleHudShell user={null}>
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#171D25] p-8 text-center">
          <h1 className="text-xl font-bold text-[#F3F4F6]">
            Autenticação necessária
          </h1>
          <p className="mt-2 text-sm text-[#8F98A0]">
            Entre na sua conta para gerenciar suas disciplinas e tarefas no
            Workspace.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-xl bg-[#1A9FFF] px-5 py-2.5 text-sm font-semibold text-[#0E141B]"
          >
            Ir para Login
          </Link>
        </div>
      </ConsoleHudShell>
    );
  }

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

  const currentUser: ConsoleUserProfile | null = dbUser
    ? {
        ...dbUser,
        presence: (dbUser.presence as ConsolePresence) || "ONLINE",
      }
    : null;

  const [subjectsDb, tasksDb] = await Promise.all([
    prisma.subject.findMany({
      where: { userId: sessionUserId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { creatorId: sessionUserId },
          { assignees: { some: { userId: sessionUserId } } },
        ],
      },
      include: {
        subject: { select: { name: true } },
        group: { select: { name: true } },
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
    }),
  ]);

  const subjects: WorkspaceSubjectItem[] = subjectsDb.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    accentColor: s.accentColor || "#66C0F4",
    taskCount: s._count.tasks,
  }));

  const tasks: ConsoleCoopTaskItem[] = tasksDb.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    subjectName: t.subject?.name ?? null,
    groupName: t.group?.name ?? null,
    href: t.groupId
      ? `/grupos/${t.groupId}?task=${t.id}`
      : `/workspace?task=${t.id}`,
    completedByCurrentUser: t.assignees.some(
      (a) => a.userId === sessionUserId && a.completedIndividual
    ),
    assignees: t.assignees.map((a) => ({
      userId: a.userId,
      name: a.user.name,
      avatarUrl: a.user.avatarUrl,
      image: a.user.image,
      completedIndividual: a.completedIndividual,
    })),
  }));

  return (
    <ConsoleWorkspaceView
      currentUser={currentUser}
      subjects={subjects}
      tasks={tasks}
    />
  );
}