import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceEstudo } from "@/components/WorkspaceEstudo";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const [minhasDisciplinas, metasRaw, sessoesRaw] = await Promise.all([
    prisma.disciplina.findMany({
      where: { userId: session.user.id },
      include: {
        tarefas: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.meta.findMany({
      where: { userId: session.user.id },
      include: {
        disciplina: { select: { nome: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sessaoEstudo.findMany({
      where: { userId: session.user.id },
      include: {
        disciplina: { select: { nome: true } },
      },
      orderBy: { concluidaEm: "desc" },
      take: 10,
    }),
  ]);

  const serializadas = minhasDisciplinas.map((d) => ({
    id: d.id,
    nome: d.nome,
    descricao: d.descricao,
    corHex: d.corHex,
    metaHorasSem: d.metaHorasSem,
    publica: d.publica,
    tarefas: d.tarefas.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao,
      estimativaMin: t.estimativaMin,
      status: t.status,
      srsIntervalo: t.srsIntervalo,
      proximaRevisao: t.proximaRevisao ? t.proximaRevisao.toISOString() : null,
      ultimaQualidade: t.ultimaQualidade,
      disciplinaId: t.disciplinaId,
    })),
  }));

  const metas = metasRaw.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    descricao: m.descricao,
    horasAlvo: m.horasAlvo,
    horasAtuais: m.horasAtuais,
    disciplinaNome: m.disciplina?.nome ?? null,
  }));

  const sessoes = sessoesRaw.map((s) => ({
    id: s.id,
    modo: s.modo,
    duracaoMin: s.duracaoMin,
    anotacoesZen: s.anotacoesZen,
    disciplinaNome: s.disciplina.nome,
    concluidaEm: s.concluidaEm.toISOString(),
  }));

  return (
    <WorkspaceEstudo
      disciplinasIniciais={serializadas}
      metasIniciais={metas}
      sessoesIniciais={sessoes}
      usuarioNome={session.user.name}
    />
  );
}