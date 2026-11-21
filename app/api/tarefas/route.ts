import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusTarefa } from "@/lib/generated/prisma/client";

const criarTarefaSchema = z.object({
  titulo: z.string().trim().min(2, "O título deve ter pelo menos 2 caracteres.").max(140),
  descricao: z.string().trim().max(500).optional().nullable(),
  estimativaMin: z.coerce.number().int().min(5).max(480).default(25),
  disciplinaId: z.string().trim().min(1, "Selecione uma disciplina."),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Autenticação necessária para criar tarefa." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = criarTarefaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const disciplina = await prisma.disciplina.findUnique({
      where: { id: parsed.data.disciplinaId },
      select: { id: true, userId: true },
    });

    if (!disciplina || disciplina.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Disciplina não encontrada ou sem permissão." },
        { status: 403 }
      );
    }

    const tarefa = await prisma.tarefa.create({
      data: {
        titulo: parsed.data.titulo,
        descricao: parsed.data.descricao || null,
        estimativaMin: parsed.data.estimativaMin,
        status: StatusTarefa.PENDENTE,
        srsIntervalo: 1,
        proximaRevisao: new Date(),
        disciplinaId: disciplina.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ tarefa }, { status: 201 });
  } catch (error) {
    console.error("Erro em POST /api/tarefas:", error);
    return NextResponse.json(
      { error: "Erro ao criar tarefa." },
      { status: 500 }
    );
  }
}