"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Loader2, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { updateProfileAndPresenceAction } from "@/app/actions/social.actions";
import {
  ConsoleHudShell,
  type ConsolePresence,
  type ConsoleUserProfile,
} from "@/components/console/console-hud-shell";

export interface ProfileTelemetryStats {
  completedTasks: number;
  activeSubjects: number;
  activeGroups: number;
}

interface ConsoleProfileViewProps {
  currentUser: ConsoleUserProfile;
  stats: ProfileTelemetryStats;
}

const PRESENCE_OPTIONS: Array<{
  value: ConsolePresence;
  label: string;
  dotClass: string;
}> = [
  { value: "ONLINE", label: "Online", dotClass: "bg-[#A4D007]" },
  { value: "STUDYING", label: "Estudando Agora", dotClass: "bg-[#66C0F4]" },
  { value: "BUSY", label: "Ocupado", dotClass: "bg-[#E5A93C]" },
  { value: "OFFLINE", label: "Offline", dotClass: "bg-[#8F98A0]" },
];

export function ConsoleProfileView({
  currentUser,
  stats,
}: ConsoleProfileViewProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username ?? "");
  const [statusText, setStatusText] = useState(currentUser.statusText ?? "");
  const [bio, setBio] = useState(currentUser.bio ?? "");
  const [presence, setPresence] = useState<ConsolePresence>(
    currentUser.presence
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentUser.avatarUrl || currentUser.image || null
  );

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data?.url) {
        setFeedback(data?.error || "Não foi possível enviar o avatar.");
        setUploadingAvatar(false);
        return;
      }

      setAvatarPreview(data.url);
      await updateProfileAndPresenceAction({ avatarUrl: data.url });
      setFeedback("Avatar atualizado.");
      router.refresh();
    } catch {
      setFeedback("Erro ao enviar imagem.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const res = await updateProfileAndPresenceAction({
      name: name.trim(),
      username: username.trim().toLowerCase() || null,
      statusText: statusText.trim() || null,
      bio: bio.trim() || null,
      presence,
    });

    setSaving(false);
    if (!res.ok) {
      setFeedback(res.error || "Erro ao salvar perfil.");
      return;
    }

    setFeedback("Perfil salvo.");
    router.refresh();
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  const currentPresenceMeta =
    PRESENCE_OPTIONS.find((p) => p.value === presence) ?? PRESENCE_OPTIONS[0];

  return (
    <ConsoleHudShell user={currentUser} ambientColor="#66C0F4">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Cartão de Identidade & Banner (Comunidade Steam) */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#121820]">
          <div
            className="h-36 w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(102,192,244,0.28) 0%, transparent 55%), radial-gradient(circle at 85% 30%, rgba(26,159,255,0.2) 0%, transparent 55%), linear-gradient(180deg, #16202C 0%, #0B0F14 100%)",
            }}
          />

          <div className="relative -mt-14 flex flex-col justify-between gap-4 px-6 pb-6 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {/* Avatar com Upload Direto */}
              <div className="relative h-24 w-24 shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={name}
                    className="h-24 w-24 rounded-2xl border-2 border-[#66C0F4]/60 bg-[#0B0F14] object-cover shadow-xl"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-[#66C0F4]/50 bg-[#1A222D] font-mono text-2xl font-bold text-[#66C0F4]">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}

                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  title="Alterar avatar"
                  className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[#1A222D] text-[#F3F4F6] shadow-lg transition hover:border-[#66C0F4] hover:text-[#66C0F4]"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-[#F3F4F6] sm:text-2xl">
                    {name}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#0B0F14]/80 px-2 py-0.5 font-mono text-[11px] text-[#F3F4F6]">
                    <span
                      className={`h-2 w-2 rounded-full ${currentPresenceMeta.dotClass}`}
                    />
                    {currentPresenceMeta.label}
                  </span>
                </div>
                <p className="font-mono text-xs text-[#8F98A0]">
                  {username ? `@${username}` : currentUser.email}
                  {statusText ? ` · ${statusText}` : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-white/10 bg-[#1A222D] px-3.5 py-2 text-xs font-medium text-[#8F98A0] transition hover:border-[#E04F33]/50 hover:text-[#E04F33] sm:self-auto"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{signingOut ? "Saindo..." : "Encerrar Sessão"}</span>
            </button>
          </div>
        </section>

        {/* Grade de Telemetria Real */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            {
              label: "Ofensiva",
              value: `${currentUser.streakDays}d`,
              accent: "text-[#E5A93C]",
            },
            {
              label: "XP Total",
              value: `${currentUser.xp}`,
              accent: "text-[#66C0F4]",
            },
            {
              label: "Concluídas",
              value: `${stats.completedTasks}`,
              accent: "text-[#A4D007]",
            },
            {
              label: "Disciplinas",
              value: `${stats.activeSubjects}`,
              accent: "text-[#F3F4F6]",
            },
            {
              label: "Grupos",
              value: `${stats.activeGroups}`,
              accent: "text-[#F3F4F6]",
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-white/[0.07] bg-[#121820] p-4"
            >
              <span className="block font-mono text-[11px] uppercase tracking-wider text-[#8F98A0]">
                {metric.label}
              </span>
              <span
                className={`mt-1 block font-mono text-2xl font-bold tabular-nums ${metric.accent}`}
              >
                {metric.value}
              </span>
            </div>
          ))}
        </section>

        {feedback && (
          <div className="rounded-xl border border-[#66C0F4]/30 bg-[#66C0F4]/10 px-4 py-2 text-xs text-[#66C0F4]">
            {feedback}
          </div>
        )}

        {/* Formulário de Identidade & Presença */}
        <form
          onSubmit={handleSaveProfile}
          className="space-y-5 rounded-2xl border border-white/[0.07] bg-[#121820] p-6"
        >
          <h2 className="text-base font-bold text-[#F3F4F6]">
            Identidade & Presença
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
                Nome de Exibição
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
                Username (@)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: carlos"
                className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 font-mono text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
                Status de Sessão
              </label>
              <select
                value={presence}
                onChange={(e) =>
                  setPresence(e.target.value as ConsolePresence)
                }
                className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
              >
                {PRESENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
                Frase de Atividade
              </label>
              <input
                type="text"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="Ex.: Revisando Banco de Dados"
                className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
              Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Curso, foco atual ou stack de estudos..."
              className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1A9FFF] px-4 py-2.5 text-xs font-semibold text-[#0B0F14] transition hover:bg-[#66C0F4] disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
            </button>
          </div>
        </form>
      </div>
    </ConsoleHudShell>
  );
}