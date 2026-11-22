"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  assignFriendsToTaskSchema,
  createCoopTaskSchema,
  createStudyGroupSchema,
  createSubjectSchema,
  joinStudyGroupSchema,
  toggleCoopTaskCompletionSchema,
  updateTaskStatusSchema,
  type CreateCoopTaskInput,
  type CreateStudyGroupInput,
  type CreateSubjectInput,
} from "@/lib/validations/coop";

export interface CoopActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user?.id ?? null;
}

function generateInviteCode(): string {
  return `MLY-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function getBrazilDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function createStudyGroupAction(
  input: CreateStudyGroupInput
): Promise<CoopActionResult<{ id: string; inviteCode: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const parsed = createStudyGroupSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados do grupo inválidos.",
      };
    }

    const inviteCode = generateInviteCode();

    const group = await prisma.studyGroup.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        bannerColor: parsed.data.bannerColor,
        inviteCode,
        ownerId: userId,
        consoleMembers: {
          create: {
            userId,
            role: "OWNER",
          },
        },
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
      select: {
        id: true,
        inviteCode: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/workspace");
    revalidatePath("/perfil");
    return { ok: true, data: group };
  } catch (error) {
    console.error("Erro em createStudyGroupAction:", error);
    return { ok: false, error: "Não foi possível criar o grupo de estudos." };
  }
}

export async function joinStudyGroupByCodeAction(
  rawCode: string
): Promise<CoopActionResult<{ groupId: string; groupName: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const parsed = joinStudyGroupSchema.safeParse({
      inviteCode: rawCode.toUpperCase(),
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Código inválido.",
      };
    }

    const group = await prisma.studyGroup.findUnique({
      where: { inviteCode: parsed.data.inviteCode },
      select: { id: true, name: true },
    });

    if (!group) {
      return { ok: false, error: "Nenhum lobby encontrado com este código." };
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId,
        },
      },
    });

    if (existingMember) {
      return {
        ok: true,
        data: { groupId: group.id, groupName: group.name },
      };
    }

    await prisma.$transaction([
      prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId,
          role: "MEMBER",
        },
      }),
      prisma.studyGroupMember.upsert({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId,
          },
        },
        update: {},
        create: {
          groupId: group.id,
          userId,
          role: "MEMBER",
        },
      }),
    ]);

    revalidatePath("/");
    revalidatePath("/perfil");
    revalidatePath(`/grupos/${group.id}`);
    return {
      ok: true,
      data: { groupId: group.id, groupName: group.name },
    };
  } catch (error) {
    console.error("Erro em joinStudyGroupByCodeAction:", error);
    return { ok: false, error: "Erro ao entrar no grupo de estudos." };
  }
}

export async function createSubjectAction(
  input: CreateSubjectInput
): Promise<CoopActionResult<{ id: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const parsed = createSubjectSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }

    if (parsed.data.groupId) {
      const member = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: parsed.data.groupId,
            userId,
          },
        },
      });

      if (!member) {
        return {
          ok: false,
          error: "Você precisa ser membro do grupo para vincular uma disciplina.",
        };
      }
    }

    const subject = await prisma.subject.create({
      data: {
        name: parsed.data.name,
        code: parsed.data.code ?? null,
        accentColor: parsed.data.accentColor,
        coverImage: parsed.data.coverImage ?? null,
        userId,
        groupId: parsed.data.groupId ?? null,
      },
      select: { id: true },
    });

    revalidatePath("/");
    revalidatePath("/workspace");
    revalidatePath("/perfil");
    return { ok: true, data: subject };
  } catch (error) {
    console.error("Erro em createSubjectAction:", error);
    return { ok: false, error: "Erro ao criar disciplina." };
  }
}

export async function createCoopTaskAction(
  input: CreateCoopTaskInput
): Promise<CoopActionResult<{ id: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const parsed = createCoopTaskSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados da tarefa inválidos.",
      };
    }

    if (parsed.data.groupId) {
      const member = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: parsed.data.groupId,
            userId,
          },
        },
      });
      if (!member) {
        return {
          ok: false,
          error: "Sem permissão para criar tarefas neste grupo.",
        };
      }
    }

    const uniqueAssigneeIds = Array.from(
      new Set([userId, ...parsed.data.assigneeIds])
    );

    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        priority: parsed.data.priority,
        status: "TODO",
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        subjectId: parsed.data.subjectId ?? null,
        groupId: parsed.data.groupId ?? null,
        creatorId: userId,
        assignees: {
          create: uniqueAssigneeIds.map((assigneeId) => ({
            userId: assigneeId,
            completedIndividual: false,
            xpAwarded: false,
          })),
        },
      },
      select: { id: true },
    });

    revalidatePath("/");
    revalidatePath("/workspace");
    if (parsed.data.subjectId) {
      revalidatePath(`/disciplinas/${parsed.data.subjectId}`);
    }
    if (parsed.data.groupId) {
      revalidatePath(`/grupos/${parsed.data.groupId}`);
    }
    return { ok: true, data: task };
  } catch (error) {
    console.error("Erro em createCoopTaskAction:", error);
    return { ok: false, error: "Erro ao criar tarefa compartilhada." };
  }
}

export async function createLegacyDisciplinaTaskAction(input: {
  disciplinaId: string;
  titulo: string;
  descricao?: string | null;
}): Promise<CoopActionResult<{ id: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const titulo = input.titulo.trim();
    if (!titulo) {
      return { ok: false, error: "Informe o título da atividade." };
    }

    const disciplina = await prisma.disciplina.findUnique({
      where: { id: input.disciplinaId },
      select: { id: true, userId: true, publica: true, studyGroupId: true },
    });

    if (!disciplina) {
      return { ok: false, error: "Disciplina não encontrada." };
    }

    if (disciplina.userId !== userId && !disciplina.publica) {
      return {
        ok: false,
        error: "Sem permissão para adicionar atividades nesta disciplina.",
      };
    }

    const tarefa = await prisma.tarefa.create({
      data: {
        titulo,
        descricao: input.descricao?.trim() || null,
        status: "PENDENTE",
        disciplinaId: disciplina.id,
        userId,
        studyGroupId: disciplina.studyGroupId ?? null,
      },
      select: { id: true },
    });

    revalidatePath("/");
    revalidatePath("/workspace");
    revalidatePath(`/disciplinas/${disciplina.id}`);
    return { ok: true, data: tarefa };
  } catch (error) {
    console.error("Erro em createLegacyDisciplinaTaskAction:", error);
    return { ok: false, error: "Erro ao criar atividade na disciplina." };
  }
}

export async function toggleLegacyDisciplinaTaskAction(
  tarefaId: string,
  completed: boolean
): Promise<CoopActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const tarefa = await prisma.tarefa.findUnique({
      where: { id: tarefaId },
      select: {
        id: true,
        disciplinaId: true,
        userId: true,
        status: true,
      },
    });

    if (!tarefa) {
      return { ok: false, error: "Atividade não encontrada." };
    }

    const existingConclusao = await prisma.tarefaConclusao.findUnique({
      where: {
        tarefaId_userId: {
          tarefaId: tarefa.id,
          userId,
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streakDays: true, lastActivityAt: true },
    });

    const now = new Date();
    let nextStreakDays = user?.streakDays ?? 0;
    if (completed && user) {
      const todayKey = getBrazilDayKey(now);
      const lastKey = user.lastActivityAt
        ? getBrazilDayKey(user.lastActivityAt)
        : null;

      if (lastKey !== todayKey) {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayKey = getBrazilDayKey(yesterday);
        nextStreakDays = lastKey === yesterdayKey ? user.streakDays + 1 : 1;
      }
    }

    const shouldAwardXp = completed && !existingConclusao;

    await prisma.$transaction([
      prisma.tarefa.update({
        where: { id: tarefa.id },
        data: { status: completed ? "CONCLUIDA" : "PENDENTE" },
      }),
      ...(shouldAwardXp
        ? [
            prisma.tarefaConclusao.create({
              data: {
                tarefaId: tarefa.id,
                userId,
              },
            }),
          ]
        : []),
      ...(completed
        ? [
            prisma.user.update({
              where: { id: userId },
              data: {
                ...(shouldAwardXp ? { xp: { increment: 25 } } : {}),
                streakDays: nextStreakDays,
                lastActivityAt: now,
              },
            }),
          ]
        : []),
    ]);

    revalidatePath("/");
    revalidatePath("/workspace");
    revalidatePath("/perfil");
    revalidatePath(`/disciplinas/${tarefa.disciplinaId}`);
    return { ok: true };
  } catch (error) {
    console.error("Erro em toggleLegacyDisciplinaTaskAction:", error);
    return { ok: false, error: "Erro ao atualizar atividade." };
  }
}

export async function assignFriendsToTaskAction(
  taskId: string,
  userIds: string[]
): Promise<CoopActionResult> {
  try {
    const actorId = await getAuthenticatedUserId();
    if (!actorId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const parsed = assignFriendsToTaskSchema.safeParse({ taskId, userIds });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Parâmetros inválidos.",
      };
    }

    const task = await prisma.task.findUnique({
      where: { id: parsed.data.taskId },
      include: { assignees: { select: { userId: true } } },
    });

    if (!task) {
      return { ok: false, error: "Tarefa não encontrada." };
    }

    const canManage =
      task.creatorId === actorId ||
      task.assignees.some((a) => a.userId === actorId);

    if (!canManage) {
      return {
        ok: false,
        error: "Você não tem permissão para convidar integrantes nesta tarefa.",
      };
    }

    const existingIds = new Set(task.assignees.map((a) => a.userId));
    const toInsert = parsed.data.userIds.filter((id) => !existingIds.has(id));

    if (toInsert.length > 0) {
      await prisma.taskAssignee.createMany({
        data: toInsert.map((userId) => ({
          taskId: task.id,
          userId,
          completedIndividual: false,
          xpAwarded: false,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/");
    revalidatePath("/workspace");
    if (task.subjectId) {
      revalidatePath(`/disciplinas/${task.subjectId}`);
    }
    if (task.groupId) {
      revalidatePath(`/grupos/${task.groupId}`);
    }
    return { ok: true };
  } catch (error) {
    console.error("Erro em assignFriendsToTaskAction:", error);
    return { ok: false, error: "Erro ao atribuir amigos à tarefa." };
  }
}

export async function toggleCoopTaskCompletionAction(
  taskId: string,
  completed: boolean
): Promise<CoopActionResult<{ allCompleted: boolean; xpGranted: number }>> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const parsed = toggleCoopTaskCompletionSchema.safeParse({ taskId, completed });
    if (!parsed.success) {
      return { ok: false, error: "Parâmetros inválidos." };
    }

    const assignment = await prisma.taskAssignee.findUnique({
      where: {
        taskId_userId: {
          taskId: parsed.data.taskId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            streakDays: true,
            lastActivityAt: true,
          },
        },
        task: {
          include: {
            assignees: true,
          },
        },
      },
    });

    if (!assignment) {
      return {
        ok: false,
        error: "Você não está atribuído a esta tarefa.",
      };
    }

    const shouldAwardXp = parsed.data.completed && !assignment.xpAwarded;
    const xpGranted = shouldAwardXp ? 25 : 0;

    const updatedAssignees = assignment.task.assignees.map((a) =>
      a.userId === userId
        ? { ...a, completedIndividual: parsed.data.completed }
        : a
    );

    const allCompleted = updatedAssignees.every((a) => a.completedIndividual);

    let nextStreakDays = assignment.user.streakDays;
    const now = new Date();
    if (parsed.data.completed) {
      const todayKey = getBrazilDayKey(now);
      const lastKey = assignment.user.lastActivityAt
        ? getBrazilDayKey(assignment.user.lastActivityAt)
        : null;

      if (lastKey !== todayKey) {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayKey = getBrazilDayKey(yesterday);
        nextStreakDays =
          lastKey === yesterdayKey ? assignment.user.streakDays + 1 : 1;
      }
    }

    await prisma.$transaction([
      prisma.taskAssignee.update({
        where: { id: assignment.id },
        data: {
          completedIndividual: parsed.data.completed,
          ...(shouldAwardXp ? { xpAwarded: true } : {}),
        },
      }),
      prisma.task.update({
        where: { id: assignment.taskId },
        data: {
          status: allCompleted
            ? "DONE"
            : parsed.data.completed
              ? "IN_PROGRESS"
              : "TODO",
        },
      }),
      ...(parsed.data.completed
        ? [
            prisma.user.update({
              where: { id: userId },
              data: {
                ...(shouldAwardXp ? { xp: { increment: 25 } } : {}),
                streakDays: nextStreakDays,
                lastActivityAt: now,
              },
            }),
          ]
        : []),
    ]);

    revalidatePath("/");
    revalidatePath("/workspace");
    revalidatePath("/perfil");
    if (assignment.task.subjectId) {
      revalidatePath(`/disciplinas/${assignment.task.subjectId}`);
    }
    if (assignment.task.groupId) {
      revalidatePath(`/grupos/${assignment.task.groupId}`);
    }
    return { ok: true, data: { allCompleted, xpGranted } };
  } catch (error) {
    console.error("Erro em toggleCoopTaskCompletionAction:", error);
    return { ok: false, error: "Erro ao atualizar progresso na tarefa." };
  }
}

export async function updateTaskStatusAction(
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
): Promise<CoopActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const parsed = updateTaskStatusSchema.safeParse({ taskId, status });
    if (!parsed.success) {
      return { ok: false, error: "Status inválido." };
    }

    const task = await prisma.task.findUnique({
      where: { id: parsed.data.taskId },
      include: { assignees: { select: { userId: true } } },
    });

    if (!task) {
      return { ok: false, error: "Tarefa não encontrada." };
    }

    const authorized =
      task.creatorId === userId ||
      task.assignees.some((a) => a.userId === userId);

    if (!authorized) {
      return { ok: false, error: "Sem permissão para alterar esta tarefa." };
    }

    await prisma.task.update({
      where: { id: task.id },
      data: { status: parsed.data.status },
    });

    revalidatePath("/");
    revalidatePath("/workspace");
    if (task.subjectId) {
      revalidatePath(`/disciplinas/${task.subjectId}`);
    }
    if (task.groupId) {
      revalidatePath(`/grupos/${task.groupId}`);
    }
    return { ok: true };
  } catch (error) {
    console.error("Erro em updateTaskStatusAction:", error);
    return { ok: false, error: "Erro ao atualizar status da tarefa." };
  }
}