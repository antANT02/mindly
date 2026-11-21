"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/avatar-utils";

async function requireUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("Sessão inválida ou expirada.");
  }
  return session.user;
}

export async function updateProfileAction(input: {
  name: string;
  bio: string;
  image?: string | null;
  metaDiariaMinutos: number;
  fatorFacilidadePadrao: number;
}) {
  const user = await requireUser();

  const cleanName = input.name.trim();
  if (cleanName.length < 2) {
    return { ok: false as const, error: "O nome deve ter pelo menos 2 caracteres." };
  }

  const cleanBio = input.bio.trim().slice(0, 280);
  const metaMin = Math.max(15, Math.min(960, Math.round(input.metaDiariaMinutos)));
  const easeFactor = Math.max(1.3, Math.min(3.5, Number(input.fatorFacilidadePadrao) || 2.5));

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: cleanName,
      bio: cleanBio || null,
      ...(input.image !== undefined ? { image: input.image } : {}),
      metaDiariaMinutos: metaMin,
      fatorFacilidadePadrao: easeFactor,
    },
  });

  revalidatePath("/");
  revalidatePath("/workspace");
  revalidatePath("/perfil");
  return { ok: true as const };
}

export async function createStudyGroupAction(input: {
  name: string;
  description?: string;
}) {
  const user = await requireUser();
  const cleanName = input.name.trim();
  if (cleanName.length < 2) {
    return { ok: false as const, error: "Informe um nome para o grupo." };
  }

  let inviteCode = generateInviteCode(6);
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.studyGroup.findUnique({ where: { inviteCode } });
    if (!exists) break;
    inviteCode = generateInviteCode(6);
  }

  const group = await prisma.$transaction(async (tx) => {
    const created = await tx.studyGroup.create({
      data: {
        name: cleanName,
        description: input.description?.trim().slice(0, 400) || null,
        inviteCode,
        ownerId: user.id,
      },
    });

    await tx.studyGroupMember.create({
      data: {
        groupId: created.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    return created;
  });

  revalidatePath("/workspace");
  revalidatePath(`/grupos/${group.id}`);
  return { ok: true as const, groupId: group.id };
}

export async function joinStudyGroupByCodeAction(rawCode: string) {
  const user = await requireUser();
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { ok: false as const, error: "Digite o código de convite." };
  }

  const group = await prisma.studyGroup.findUnique({
    where: { inviteCode: code },
    select: { id: true },
  });

  if (!group) {
    return { ok: false as const, error: "Código de convite não encontrado." };
  }

  await prisma.studyGroupMember.upsert({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      userId: user.id,
      role: "MEMBER",
    },
  });

  revalidatePath("/workspace");
  revalidatePath(`/grupos/${group.id}`);
  return { ok: true as const, groupId: group.id };
}

export async function createGroupDisciplinaAction(input: {
  groupId: string;
  nome: string;
  descricao?: string;
  corHex?: string;
  metaHorasSem?: number;
}) {
  const user = await requireUser();

  const member = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: input.groupId, userId: user.id } },
  });
  if (!member) {
    return { ok: false as const, error: "Você não pertence a este grupo." };
  }

  const nome = input.nome.trim();
  if (nome.length < 2) {
    return { ok: false as const, error: "Informe o nome da disciplina." };
  }

  await prisma.disciplina.create({
    data: {
      nome,
      descricao: input.descricao?.trim() || null,
      corHex: input.corHex || "#3D4F3D",
      metaHorasSem: Math.max(1, Math.min(60, Number(input.metaHorasSem) || 6)),
      publica: false,
      userId: user.id,
      studyGroupId: input.groupId,
    },
  });

  revalidatePath(`/grupos/${input.groupId}`);
  return { ok: true as const };
}

export async function createGroupTarefaAction(input: {
  groupId: string;
  disciplinaId: string;
  titulo: string;
  notas?: string;
}) {
  const user = await requireUser();

  const member = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: input.groupId, userId: user.id } },
  });
  if (!member) {
    return { ok: false as const, error: "Você não pertence a este grupo." };
  }

  const titulo = input.titulo.trim();
  if (titulo.length < 2) {
    return { ok: false as const, error: "Informe o título da tarefa." };
  }

  const disciplina = await prisma.disciplina.findFirst({
    where: { id: input.disciplinaId, studyGroupId: input.groupId },
  });
  if (!disciplina) {
    return { ok: false as const, error: "Disciplina inválida para o grupo." };
  }

  await prisma.tarefa.create({
    data: {
      titulo,
      notas: input.notas?.trim() || null,
      status: "PENDENTE",
      disciplinaId: disciplina.id,
      userId: user.id,
      studyGroupId: input.groupId,
    },
  });

  revalidatePath(`/grupos/${input.groupId}`);
  return { ok: true as const };
}

export async function toggleTarefaConclusaoMembroAction(input: {
  groupId: string;
  tarefaId: string;
}) {
  const user = await requireUser();

  const member = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: input.groupId, userId: user.id } },
  });
  if (!member) {
    return { ok: false as const, error: "Acesso negado ao grupo." };
  }

  const existing = await prisma.tarefaConclusao.findUnique({
    where: {
      tarefaId_userId: {
        tarefaId: input.tarefaId,
        userId: user.id,
      },
    },
  });

  if (existing) {
    await prisma.tarefaConclusao.delete({ where: { id: existing.id } });
  } else {
    await prisma.tarefaConclusao.create({
      data: {
        tarefaId: input.tarefaId,
        userId: user.id,
      },
    });
  }

  revalidatePath(`/grupos/${input.groupId}`);
  return { ok: true as const };
}