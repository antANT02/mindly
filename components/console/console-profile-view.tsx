"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
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
  { value: "STUDYING", label: "Estudando Agora", dotClass: "bg-[#CBB6FF]" },
  { value: "BUSY", label: "Ocupado", dotClass: "bg-[#E5A93C]" },
  { value: "OFFLINE", label: "Offline", dotClass: "bg-[#9D8EC4]" },
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
    <ConsoleHudShell user={currentUser}>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Identidade Sólida */}
        <section className="rounded-[2px] border border-[#CBB6FF]/15 border-t-4 border-t-[#7E49C7] bg-[#1B0B3A] p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={name}
                    className="h-20 w-20 rounded-[2px] border border-[#CBB6FF]/35 bg-[#070512] object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-[2px] border border-[#CBB6FF]/35 bg-[#3B1C6E] font-serif text-3xl text-[#CBB6FF]">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}

                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  title="Alterar avatar"
                  className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-[2px] border border-[#CBB6FF]/30 bg-[#070512] text-[#CBB6FF] transition-colors duration-150 hover:border-[#7E49C7]"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
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
                  <h1 className="font-serif text-3xl tracking-tight text-[#F4F1FA]">
                    {name}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-2 py-0.5 font-mono text-[11px] text-[#F4F1FA]">
                    <span
                      className={`h-2 w-2 rounded-full ${currentPresenceMeta.dotClass}`}
                    />
                    {currentPresenceMeta.label}
                  </span>
                </div>
                <p className="font-mono text-xs text-[#9D8EC4]">
                  {username ? `@${username}` : currentUser.email}
                  {statusText ? ` · ${statusText}` : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="self-start rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3.5 py-2 text-xs font-medium text-[#9D8EC4] transition-colors duration-150 hover:border-[#E04F33] hover:text-[#E04F33] sm:self-auto"
            >
              {signingOut ? "Saindo..." : "Encerrar Sessão"}
            </button>
          </div>
        </section>

        {/* Telemetria */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            {
              label: "Ofensiva",
              value: `${currentUser.streakDays}d`,
              accent: "text-[#CBB6FF]",
            },
            {
              label: "XP Total",
              value: `${currentUser.xp}`,
              accent: "text-[#F4F1FA]",
            },
            {
              label: "Concluídas",
              value: `${stats.completedTasks}`,
              accent: "text-[#CBB6FF]",
            },
            {
              label: "Disciplinas",
              value: `${stats.activeSubjects}`,
              accent: "text-[#F4F1FA]",
            },
            {
              label: "Grupos",
              value: `${stats.activeGroups}`,
              accent: "text-[#F4F1FA]",
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A] p-4"
            >
              <span className="block font-mono text-[11px] uppercase tracking-wider text-[#9D8EC4]">
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
          <div className="rounded-[2px] border border-[#7E49C7] bg-[#3B1C6E] px-4 py-2 text-xs text-[#F4F1FA]">
            {feedback}
          </div>
        )}

        {/* Formulário */}
        <form
          onSubmit={handleSaveProfile}
          className="space-y-5 rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A] p-6"
        >
          <h2 className="border-b border-[#CBB6FF]/15 pb-2 font-serif text-xl text-[#F4F1FA]">
            Identidade & Presença
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
                Nome de Exibição
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
                Username (@)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: carlos"
                className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 font-mono text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
                Status de Sessão
              </label>
              <select
                value={presence}
                onChange={(e) =>
                  setPresence(e.target.value as ConsolePresence)
                }
                className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
              >
                {PRESENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
                Frase de Atividade
              </label>
              <input
                type="text"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="Ex.: Revisando Estruturas de Dados"
                className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
              Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Curso, foco atual ou stack de estudos..."
              className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-[2px] bg-[#7E49C7] px-4 py-2 text-xs font-semibold text-[#F4F1FA] transition-colors duration-150 hover:bg-[#9361D9] disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </ConsoleHudShell>
  );
}