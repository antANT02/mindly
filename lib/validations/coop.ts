import { z } from "zod";

export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const taskBoardStatusEnum = z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]);

export const createStudyGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome do grupo deve ter pelo menos 2 caracteres.")
    .max(80, "Máximo de 80 caracteres."),
  description: z
    .string()
    .trim()
    .max(400, "A descrição pode ter no máximo 400 caracteres.")
    .optional()
    .nullable(),
  bannerColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Selecione uma cor hexadecimal válida.")
    .default("#1A9FFF"),
});

export const joinStudyGroupSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(4, "Código de convite inválido.")
    .max(32),
});

export const createSubjectSchema = z.object({
  name: z.string().trim().min(2, "Nome da disciplina muito curto.").max(100),
  code: z.string().trim().max(20).optional().nullable(),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor hexadecimal inválida.")
    .default("#66C0F4"),
  coverImage: z.string().trim().url("URL de capa inválida.").optional().nullable(),
  groupId: z.string().trim().optional().nullable(),
});

export const createCoopTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "O título da tarefa deve ter pelo menos 2 caracteres.")
    .max(140),
  description: z.string().trim().max(600).optional().nullable(),
  priority: taskPriorityEnum.default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable(),
  subjectId: z.string().trim().optional().nullable(),
  groupId: z.string().trim().optional().nullable(),
  assigneeIds: z.array(z.string().trim().min(1)).default([]),
});

export const assignFriendsToTaskSchema = z.object({
  taskId: z.string().trim().min(1, "Tarefa inválida."),
  userIds: z.array(z.string().trim().min(1)).min(1, "Selecione ao menos um amigo."),
});

export const toggleCoopTaskCompletionSchema = z.object({
  taskId: z.string().trim().min(1, "Tarefa inválida."),
  completed: z.boolean(),
});

export const updateTaskStatusSchema = z.object({
  taskId: z.string().trim().min(1, "Tarefa inválida."),
  status: taskBoardStatusEnum,
});

export type CreateStudyGroupInput = z.infer<typeof createStudyGroupSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type CreateCoopTaskInput = z.infer<typeof createCoopTaskSchema>;