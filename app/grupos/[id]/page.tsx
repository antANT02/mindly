import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditorialShell } from "@/components/EditorialShell";
import { StudyGroupViewClient } from "@/components/StudyGroupViewClient";

export const dynamic = "force-dynamic";

export default async function GrupoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const [memberships, group] = await Promise.all([
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
    prisma.studyGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        disciplinas: {
          include: {
            _count: { select: { tarefas: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        tarefas: {
          include: {
            disciplina: { select: { nome: true } },
            user: { select: { name: true } },
            conclusoes: { select: { userId: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  if (!group) {
    notFound();
  }

  const isMember = group.members.some((m) => m.userId === session.user.id);
  if (!isMember) {
    redirect("/workspace");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true },
  });

  const shellGroups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    inviteCode: m.group.inviteCode,
    role: m.role,
    memberCount: m.group._count.members,
  }));

  return (
    <EditorialShell
      user={currentUser}
      groups={shellGroups}
      pageTitle={group.name}
      pageEyebrow="GRUPO DE ESTUDO COLABORATIVO"
    >
      <StudyGroupViewClient
        currentUserId={session.user.id}
        group={{
          id: group.id,
          name: group.name,
          description: group.description,
          inviteCode: group.inviteCode,
        }}
        members={group.members.map((m) => ({
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
          role: m.role,
        }))}
        disciplinas={group.disciplinas.map((d) => ({
          id: d.id,
          nome: d.nome,
          descricao: d.descricao,
          corHex: d.corHex,
          metaHorasSem: d.metaHorasSem,
          _count: d._count,
        }))}
        tarefas={group.tarefas.map((t) => ({
          id: t.id,
          titulo: t.titulo,
          notas: t.notas,
          disciplinaId: t.disciplinaId,
          disciplinaNome: t.disciplina.nome,
          autorNome: t.user.name,
          concluidoPorUserIds: t.conclusoes.map((c) => c.userId),
        }))}
      />
    </EditorialShell>
  );
}