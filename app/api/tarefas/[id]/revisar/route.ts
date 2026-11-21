import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QualidadeRevisao, StatusTarefa } from "@/lib/generated/prisma";

const revisarSchema = z.object({
  qualidade: z.nativeEnum(QualidadeRevisao).optional(),
  status: z.nativeEnum(StatusTarefa).optional(),
});

function calcularProximoIntervalo(
  intervaloAtual: number,
  qualidade: QualidadeRevisao
): number {
  const base = Math.max(1, intervaloAtual);

  if (qualidade === QualidadeRevisao.DIFICIL) {
    return 1;
  }
  if (qualidade === QualidadeRevisao.BOM) {
    return Math.max(2, base * 2);
  }
  return Math.max(4, Math.ceil(base * 2.5));
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const parsed = revisarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parâmetros de revisão inválidos." },
        { status: 400 }
      );
    }

    const tarefaExistente = await prisma.tarefa.findUnique({
      where: { id },
    });

    if (!tarefaExistente || tarefaExistente.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Tarefa não encontrada ou sem permissão." },
        { status: 404 }
      );
    }

    let novoIntervalo = tarefaExistente.srsIntervalo;
    let proximaRevisao = tarefaExistente.proximaRevisao;
    let ultimaQualidade = tarefaExistente.ultimaQualidade;
    let novoStatus = parsed.data.status ?? tarefaExistente.status;

    if (parsed.data.qualidade) {
      novoIntervalo = calcularProximoIntervalo(
        tarefaExistente.srsIntervalo,
        parsed.data.qualidade
      );
      proximaRevisao = new Date(
        Date.now() + novoIntervalo * 24 * 60 * 60 * 1000
      );
      ultimaQualidade = parsed.data.qualidade;
      if (!parsed.data.status) {
        novoStatus = StatusTarefa.CONCLUIDA;
      }
    }

    const tarefaAtualizada = await prisma.tarefa.update({
      where: { id },
      data: {
        srsIntervalo: novoIntervalo,
        proximaRevisao,
        ultimaQualidade,
        status: novoStatus,
      },
    });

    return NextResponse.json({ tarefa: tarefaAtualizada });
  } catch (error) {
    console.error("Erro em PATCH /api/tarefas/[id]/revisar:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar revisão da tarefa." },
      { status: 500 }
    );
  }
}