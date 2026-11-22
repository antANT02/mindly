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
          })),
        },
      },
      select: { id: true },
    });

    revalidatePath("/");
    revalidatePath("/workspace");
    if (parsed.data.groupId) {
      revalidatePath(`/grupos/${parsed.data.groupId}`);
    }
    return { ok: true, data: task };
  } catch (error) {
    console.error("Erro em createCoopTaskAction:", error);
    return { ok: false, error: "Erro ao criar tarefa compartilhada." };
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
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/");
    revalidatePath("/workspace");
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
): Promise<CoopActionResult<{ allCompleted: boolean }>> {
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

    await prisma.taskAssignee.update({
      where: { id: assignment.id },
      data: { completedIndividual: parsed.data.completed },
    });

    const updatedAssignees = assignment.task.assignees.map((a) =>
      a.userId === userId
        ? { ...a, completedIndividual: parsed.data.completed }
        : a
    );

    const allCompleted = updatedAssignees.every((a) => a.completedIndividual);

    await prisma.$transaction([
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
      ...(parsed.data.completed && !assignment.completedIndividual
        ? [
            prisma.user.update({
              where: { id: userId },
              data: { xp: { increment: 25 } },
            }),
          ]
        : []),
    ]);

    revalidatePath("/");
    revalidatePath("/workspace");
    if (assignment.task.groupId) {
      revalidatePath(`/grupos/${assignment.task.groupId}`);
    }
    return { ok: true, data: { allCompleted } };
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
    if (task.groupId) {
      revalidatePath(`/grupos/${task.groupId}`);
    }
    return { ok: true };
  } catch (error) {
    console.error("Erro em updateTaskStatusAction:", error);
    return { ok: false, error: "Erro ao atualizar status da tarefa." };
  }
}