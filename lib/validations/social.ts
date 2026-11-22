import { z } from "zod";

export const presenceEnum = z.enum(["ONLINE", "STUDYING", "BUSY", "OFFLINE"]);
export const friendshipResponseEnum = z.enum(["ACCEPT", "DECLINE"]);

export const searchUserSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Digite pelo menos 2 caracteres para buscar.")
    .max(100),
});

export const sendFriendRequestSchema = z.object({
  addresseeId: z.string().trim().min(1, "Usuário de destino inválido."),
});

export const respondFriendRequestSchema = z.object({
  requestId: z.string().trim().min(1, "Solicitação inválida."),
  action: friendshipResponseEnum,
});

export const updateProfileSocialSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres.").max(80).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "Use apenas letras minúsculas, números ou _ (3 a 24 caracteres).")
    .optional()
    .nullable(),
  bio: z.string().trim().max(280, "Bio limitada a 280 caracteres.").optional().nullable(),
  statusText: z.string().trim().max(120, "Status limitado a 120 caracteres.").optional().nullable(),
  presence: presenceEnum.optional(),
  avatarUrl: z
    .string()
    .trim()
    .url("URL de avatar inválida.")
    .max(500)
    .optional()
    .nullable(),
  metaDiariaMinutos: z.coerce.number().int().min(15).max(960).optional(),
});

export type PresenceStatusValue = z.infer<typeof presenceEnum>;
export type SearchUserInput = z.infer<typeof searchUserSchema>;
export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;
export type RespondFriendRequestInput = z.infer<typeof respondFriendRequestSchema>;
export type UpdateProfileSocialInput = z.infer<typeof updateProfileSocialSchema>;