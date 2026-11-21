import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditorialShell } from "@/components/EditorialShell";
import { ProfileSettingsClient } from "@/components/ProfileSettingsClient";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [dbUser, memberships, totalDisciplinas, totalTarefas, tarefasConcluidas, sessoes] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          image: true,
          metaDiariaMinutos: true,
          fatorFacilidadePadrao: true,
        },
      }),
      prisma.studyGroupMember.findMany({
        where: { userId: session.user.id },
        include: {
          group: {
            include: {
              _count: { select: { members: true } },
            },
          },
        },
      }),
      prisma.disciplina.count({ where: { userId: session.user.id } }),
      prisma.tarefa.count({ where: { userId: session.user.id } }),
      prisma.tarefa.count({
        where: { userId: session.user.id, status: "CONCLUIDA" },
      }),
      prisma.sessaoEstudo.findMany({
        where: { userId: session.user.id },
        select: { duracaoMin: true },
      }),
    ]);

  if (!dbUser) {
    redirect("/login");
  }

  const minutosEstudados = sessoes.reduce((acc, s) => acc + s.duracaoMin, 0);
  const shellGroups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    inviteCode: m.group.inviteCode,
    role: m.role,
    memberCount: m.group._count.members,
  }));

  return (
    <EditorialShell
      user={dbUser}
      groups={shellGroups}
      pageTitle="Perfil e Preferências"
      pageEyebrow="CONTA & DESEMPENHO"
    >
      <ProfileSettingsClient
        profile={dbUser}
        stats={{
          totalDisciplinas,
          tarefasConcluidas,
          totalTarefas,
          minutosEstudados,
          gruposAtivos: shellGroups.length,
        }}
      />
    </EditorialShell>
  );
}