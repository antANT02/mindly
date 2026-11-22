"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  respondFriendRequestSchema,
  searchUserSchema,
  sendFriendRequestSchema,
  updateProfileSocialSchema,
} from "@/lib/validations/social";

export interface ActionResult<T = undefined> {
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

export async function searchUsersAction(rawQuery: string): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      username: string | null;
      avatarUrl: string | null;
      image: string | null;
      presence: string;
      statusText: string | null;
      xp: number;
    }>
  >
> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const parsed = searchUserSchema.safeParse({ query: rawQuery });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Consulta inválida.",
      };
    }

    const normalized = parsed.data.query.replace(/^@/, "").toLowerCase();

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { username: { contains: normalized, mode: "insensitive" } },
          { email: { contains: normalized, mode: "insensitive" } },
          { name: { contains: normalized, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        image: true,
        presence: true,
        statusText: true,
        xp: true,
      },
      take: 12,
    });

    return { ok: true, data: users };
  } catch (error) {
    console.error("Erro em searchUsersAction:", error);
    return { ok: false, error: "Falha ao buscar usuários." };
  }
}

export async function sendFriendRequestAction(
  addresseeId: string
): Promise<ActionResult<{ requestId: string }>> {
  try {
    const requesterId = await getAuthenticatedUserId();
    if (!requesterId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const parsed = sendFriendRequestSchema.safeParse({ addresseeId });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Destinatário inválido.",
      };
    }

    if (parsed.data.addresseeId === requesterId) {
      return {
        ok: false,
        error: "Você não pode enviar convite de amizade para si mesmo.",
      };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: parsed.data.addresseeId },
      select: { id: true },
    });

    if (!targetUser) {
      return { ok: false, error: "Usuário não encontrado." };
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId: parsed.data.addresseeId },
          { requesterId: parsed.data.addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return { ok: false, error: "Vocês já são amigos no Mindly." };
      }
      if (existing.status === "PENDING") {
        return { ok: false, error: "Já existe um convite pendente entre vocês." };
      }

      const reopened = await prisma.friendship.update({
        where: { id: existing.id },
        data: {
          requesterId,
          addresseeId: parsed.data.addresseeId,
          status: "PENDING",
        },
        select: { id: true },
      });

      revalidatePath("/");
      revalidatePath("/perfil");
      return { ok: true, data: { requestId: reopened.id } };
    }

    const created = await prisma.friendship.create({
      data: {
        requesterId,
        addresseeId: parsed.data.addresseeId,
        status: "PENDING",
      },
      select: { id: true },
    });

    revalidatePath("/");
    revalidatePath("/perfil");
    return { ok: true, data: { requestId: created.id } };
  } catch (error) {
    console.error("Erro em sendFriendRequestAction:", error);
    return { ok: false, error: "Erro ao enviar solicitação de amizade." };
  }
}

export async function respondFriendRequestAction(
  requestId: string,
  action: "ACCEPT" | "DECLINE"
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const parsed = respondFriendRequestSchema.safeParse({ requestId, action });
    if (!parsed.success) {
      return { ok: false, error: "Parâmetros de resposta inválidos." };
    }

    const request = await prisma.friendship.findUnique({
      where: { id: parsed.data.requestId },
    });

    if (!request || request.addresseeId !== userId) {
      return {
        ok: false,
        error: "Solicitação não encontrada ou sem permissão.",
      };
    }

    await prisma.friendship.update({
      where: { id: request.id },
      data: {
        status: parsed.data.action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
      },
    });

    revalidatePath("/");
    revalidatePath("/perfil");
    return { ok: true };
  } catch (error) {
    console.error("Erro em respondFriendRequestAction:", error);
    return { ok: false, error: "Erro ao responder solicitação de amizade." };
  }
}

export async function listFriendsAndRequestsAction(): Promise<
  ActionResult<{
    friends: Array<{
      friendshipId: string;
      user: {
        id: string;
        name: string;
        username: string | null;
        avatarUrl: string | null;
        image: string | null;
        presence: string;
        statusText: string | null;
        xp: number;
        streakDays: number;
      };
    }>;
    incomingRequests: Array<{
      id: string;
      createdAt: Date;
      requester: {
        id: string;
        name: string;
        username: string | null;
        avatarUrl: string | null;
        image: string | null;
        presence: string;
      };
    }>;
  }>
> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const [acceptedRows, incomingRows] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
              image: true,
              presence: true,
              statusText: true,
              xp: true,
              streakDays: true,
            },
          },
          addressee: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
              image: true,
              presence: true,
              statusText: true,
              xp: true,
              streakDays: true,
            },
          },
        },
      }),
      prisma.friendship.findMany({
        where: {
          addresseeId: userId,
          status: "PENDING",
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
              image: true,
              presence: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const friends = acceptedRows.map((row) => ({
      friendshipId: row.id,
      user: row.requesterId === userId ? row.addressee : row.requester,
    }));

    return {
      ok: true,
      data: {
        friends,
        incomingRequests: incomingRows,
      },
    };
  } catch (error) {
    console.error("Erro em listFriendsAndRequestsAction:", error);
    return { ok: false, error: "Erro ao carregar lista de amigos." };
  }
}

export async function updateProfileAndPresenceAction(
  input: {
    name?: string;
    username?: string | null;
    bio?: string | null;
    statusText?: string | null;
    presence?: "ONLINE" | "STUDYING" | "BUSY" | "OFFLINE";
    avatarUrl?: string | null;
    metaDiariaMinutos?: number;
  }
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { ok: false, error: "Autenticação necessária." };
    }

    const parsed = updateProfileSocialSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados de perfil inválidos.",
      };
    }

    if (parsed.data.username) {
      const taken = await prisma.user.findFirst({
        where: {
          username: parsed.data.username,
          id: { not: userId },
        },
        select: { id: true },
      });

      if (taken) {
        return {
          ok: false,
          error: "Este @username já está em uso por outro estudante.",
        };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.username !== undefined ? { username: parsed.data.username } : {}),
        ...(parsed.data.bio !== undefined ? { bio: parsed.data.bio } : {}),
        ...(parsed.data.statusText !== undefined ? { statusText: parsed.data.statusText } : {}),
        ...(parsed.data.presence !== undefined ? { presence: parsed.data.presence } : {}),
        ...(parsed.data.avatarUrl !== undefined
          ? { avatarUrl: parsed.data.avatarUrl, image: parsed.data.avatarUrl }
          : {}),
        ...(parsed.data.metaDiariaMinutos !== undefined
          ? { metaDiariaMinutos: parsed.data.metaDiariaMinutos }
          : {}),
      },
    });

    revalidatePath("/");
    revalidatePath("/perfil");
    revalidatePath("/workspace");
    return { ok: true };
  } catch (error) {
    console.error("Erro em updateProfileAndPresenceAction:", error);
    return { ok: false, error: "Erro ao atualizar perfil e presença." };
  }
}