import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const criarDisciplinaSchema = z.object({
  nome: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres.").max(100),
  descricao: z.string().trim().max(400).optional().nullable(),
  corHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida. Use formato hexadecimal como #1E3A2F.")
    .default("#1E3A2F"),
  metaHorasSem: z.coerce.number().int().min(1).max(80).default(6),
  publica: z.boolean().default(false),
});

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user?.id;

    const disciplinas = await prisma.disciplina.findMany({
      where: userId
        ? {
            OR: [{ publica: true }, { userId }],
          }
        : {
            publica: true,
          },
      include: {
        tarefas: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ disciplinas });
  } catch (error) {
    console.error("Erro em GET /api/disciplinas:", error);
    return NextResponse.json(
      { error: "Erro ao carregar disciplinas." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Autenticação necessária para criar disciplina." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = criarDisciplinaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const disciplina = await prisma.disciplina.create({
      data: {
        nome: parsed.data.nome,
        descricao: parsed.data.descricao || null,
        corHex: parsed.data.corHex,
        metaHorasSem: parsed.data.metaHorasSem,
        publica: parsed.data.publica,
        userId: session.user.id,
      },
      include: {
        tarefas: true,
      },
    });

    return NextResponse.json({ disciplina }, { status: 201 });
  } catch (error) {
    console.error("Erro em POST /api/disciplinas:", error);
    return NextResponse.json(
      { error: "Erro ao criar disciplina." },
      { status: 500 }
    );
  }
}