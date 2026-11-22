import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ConsoleHudShell,
  type ConsolePresence,
  type ConsoleUserProfile,
} from "@/components/console/console-hud-shell";
import { ProfileAvatarEditor } from "@/components/console/profile-avatar-editor";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const sessionUserId = session?.user?.id ?? null;

  if (!sessionUserId) {
    return (
      <ConsoleHudShell user={null}>
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#171D25] p-8 text-center">
          <h1 className="text-xl font-bold text-[#F3F4F6]">
            Autenticação necessária
          </h1>
          <p className="mt-2 text-sm text-[#8F98A0]">
            Entre na sua conta para editar seu perfil, enviar avatar e
            gerenciar seu status de estudo.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-xl bg-[#1A9FFF] px-5 py-2.5 text-sm font-semibold text-[#0E141B] hover:bg-[#66C0F4]"
          >
            Ir para Login
          </Link>
        </div>
      </ConsoleHudShell>
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatarUrl: true,
      image: true,
      bio: true,
      statusText: true,
      presence: true,
      xp: true,
      streakDays: true,
      metaDiariaMinutos: true,
    },
  });

  if (!dbUser) {
    return null;
  }

  const profile: ConsoleUserProfile = {
    ...dbUser,
    presence: (dbUser.presence as ConsolePresence) || "ONLINE",
  };

  return (
    <ConsoleHudShell user={profile}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[#66C0F4]">
            Configurações do Jogador / Estudante
          </span>
          <h1 className="text-2xl font-bold text-[#F3F4F6]">
            Perfil, Avatar & Presença
          </h1>
        </div>

        <ProfileAvatarEditor initialProfile={profile} />
      </div>
    </ConsoleHudShell>
  );
}