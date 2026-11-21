import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const criarSessaoSchema = z.object({
  modo: z.string().trim().min(2).max(40).default("POMODORO_25_5"),
  duracaoMin: z.coerce.number().int().min(1).max(600),
  anotacoesZen: z.string().trim().max(1000).optional().nullable(),
  disciplinaId: z.string().trim().min(1, "Selecione uma disciplina."),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Autenticação necessária para registrar sessão." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = criarSessaoSchema.safeParse(body);

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

    const horasIncremento = Math.max(1, Math.round(parsed.data.duracaoMin / 60));

    const [sessao] = await prisma.$transaction([
      prisma.sessaoEstudo.create({
        data: {
          modo: parsed.data.modo,
          duracaoMin: parsed.data.duracaoMin,
          anotacoesZen: parsed.data.anotacoesZen || null,
          disciplinaId: disciplina.id,
          userId: session.user.id,
        },
      }),
      prisma.meta.updateMany({
        where: {
          userId: session.user.id,
          disciplinaId: disciplina.id,
        },
        data: {
          horasAtuais: {
            increment: horasIncremento,
          },
        },
      }),
    ]);

    return NextResponse.json({ sessao }, { status: 201 });
  } catch (error) {
    console.error("Erro em POST /api/sessoes:", error);
    return NextResponse.json(
      { error: "Erro ao registrar sessão de estudo." },
      { status: 500 }
    );
  }
}