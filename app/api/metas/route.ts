import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const criarMetaSchema = z.object({
  titulo: z.string().trim().min(2, "Informe o título da meta.").max(120),
  descricao: z.string().trim().max(400).optional().nullable(),
  horasAlvo: z.coerce.number().int().min(1).max(1000),
  disciplinaId: z.string().trim().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Autenticação necessária para criar meta." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = criarMetaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    let disciplinaIdValido: string | null = null;
    if (parsed.data.disciplinaId) {
      const disc = await prisma.disciplina.findUnique({
        where: { id: parsed.data.disciplinaId },
        select: { id: true, userId: true },
      });
      if (!disc || disc.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Disciplina inválida para esta meta." },
          { status: 403 }
        );
      }
      disciplinaIdValido = disc.id;
    }

    const meta = await prisma.meta.create({
      data: {
        titulo: parsed.data.titulo,
        descricao: parsed.data.descricao || null,
        horasAlvo: parsed.data.horasAlvo,
        horasAtuais: 0,
        disciplinaId: disciplinaIdValido,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ meta }, { status: 201 });
  } catch (error) {
    console.error("Erro em POST /api/metas:", error);
    return NextResponse.json(
      { error: "Erro ao criar meta." },
      { status: 500 }
    );
  }
}