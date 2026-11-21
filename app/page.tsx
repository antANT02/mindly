import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CatalogoDisciplinas,
  DisciplinaCard,
} from "@/components/CatalogoDisciplinas";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;

  const disciplinasRaw = await prisma.disciplina.findMany({
    where: userId
      ? {
          OR: [{ publica: true }, { userId }],
        }
      : {
          publica: true,
        },
    include: {
      user: {
        select: { name: true },
      },
      tarefas: {
        select: { status: true },
      },
      _count: {
        select: { sessoes: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const disciplinas: DisciplinaCard[] = disciplinasRaw.map((d) => ({
    id: d.id,
    nome: d.nome,
    descricao: d.descricao,
    corHex: d.corHex,
    metaHorasSem: d.metaHorasSem,
    publica: d.publica,
    userId: d.userId,
    autorNome: d.user.name,
    totalTarefas: d.tarefas.length,
    tarefasConcluidas: d.tarefas.filter((t) => t.status === "CONCLUIDA").length,
    totalSessoes: d._count.sessoes,
  }));

  const usuario = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }
    : null;

  return <CatalogoDisciplinas disciplinas={disciplinas} usuario={usuario} />;
}