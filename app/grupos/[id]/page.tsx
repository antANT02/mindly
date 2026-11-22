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
  ConsoleGroupLobby,
  type ConsoleGroupDetailData,
} from "@/components/console/console-group-lobby";

export const dynamic = "force-dynamic";

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function GrupoDetalhePage({ params }: GroupPageProps) {
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

  const groupDb = await prisma.studyGroup.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          avatarUrl: true,
          image: true,
          presence: true,
          statusText: true,
        },
      },
      consoleMembers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              avatarUrl: true,
              image: true,
              presence: true,
              statusText: true,
            },
          },
        },
      },
      subjects: {
        include: {
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        include: {
          subject: { select: { name: true } },
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

  if (!groupDb) {
    return (
      <ConsoleHudShell user={currentUser}>
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#171D25] p-8 text-center">
          <h1 className="text-xl font-bold text-[#F3F4F6]">
            Grupo não encontrado
          </h1>
          <p className="mt-2 text-sm text-[#8F98A0]">
            Este lobby de estudos pode ter sido removido ou o link está inválido.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-xl bg-[#1A9FFF] px-5 py-2.5 text-sm font-semibold text-[#0E141B]"
          >
            Voltar à Biblioteca
          </Link>
        </div>
      </ConsoleHudShell>
    );
  }

  const membersList =
    groupDb.consoleMembers.length > 0
      ? groupDb.consoleMembers.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          username: m.user.username,
          avatarUrl: m.user.avatarUrl,
          image: m.user.image,
          presence: m.user.presence,
          statusText: m.user.statusText,
          role: m.role,
        }))
      : [
          {
            id: groupDb.owner.id,
            name: groupDb.owner.name,
            email: groupDb.owner.email,
            username: groupDb.owner.username,
            avatarUrl: groupDb.owner.avatarUrl,
            image: groupDb.owner.image,
            presence: groupDb.owner.presence,
            statusText: groupDb.owner.statusText,
            role: "OWNER",
          },
        ];

  const detail: ConsoleGroupDetailData = {
    id: groupDb.id,
    name: groupDb.name,
    description: groupDb.description,
    bannerColor: groupDb.bannerColor || "#1A9FFF",
    inviteCode: groupDb.inviteCode,
    members: membersList,
    subjects: groupDb.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      accentColor: s.accentColor || "#66C0F4",
      taskCount: s._count.tasks,
    })),
    tasks: groupDb.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      subjectName: t.subject?.name ?? null,
      groupName: groupDb.name,
      href: `/grupos/${groupDb.id}?task=${t.id}`,
      completedByCurrentUser: sessionUserId
        ? t.assignees.some(
            (a) => a.userId === sessionUserId && a.completedIndividual
          )
        : false,
      assignees: t.assignees.map((a) => ({
        userId: a.userId,
        name: a.user.name,
        avatarUrl: a.user.avatarUrl,
        image: a.user.image,
        completedIndividual: a.completedIndividual,
      })),
    })),
  };

  return <ConsoleGroupLobby currentUser={currentUser} group={detail} />;
}