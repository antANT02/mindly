"use client";

import React, { useState } from "react";
import { Camera, CheckCircle2, Loader2, Save, UserCheck } from "lucide-react";
import {
  updateProfileAndPresenceAction,
} from "@/app/actions/social.actions";
import type {
  ConsolePresence,
  ConsoleUserProfile,
} from "@/components/console/console-hud-shell";

interface ProfileAvatarEditorProps {
  initialProfile: ConsoleUserProfile;
  onUpdated?: () => void;
}

export function ProfileAvatarEditor({
  initialProfile,
  onUpdated,
}: ProfileAvatarEditorProps) {
  const [name, setName] = useState(initialProfile.name);
  const [username, setUsername] = useState(initialProfile.username ?? "");
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [statusText, setStatusText] = useState(initialProfile.statusText ?? "");
  const [presence, setPresence] = useState<ConsolePresence>(
    initialProfile.presence
  );
  const [avatarUrl, setAvatarUrl] = useState(
    initialProfile.avatarUrl || initialProfile.image || ""
  );
  const [metaDiariaMinutos, setMetaDiariaMinutos] = useState(
    initialProfile.metaDiariaMinutos
  );

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        setFeedback({
          type: "error",
          message: payload?.error || "Falha ao enviar imagem de avatar.",
        });
        return;
      }

      const nextUrl = payload.avatarUrl || payload.url || "";
      if (nextUrl) {
        setAvatarUrl(nextUrl);
        setFeedback({
          type: "success",
          message: "Avatar enviado! Clique em Salvar Perfil para confirmar.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Erro de rede ao fazer upload do avatar.",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const result = await updateProfileAndPresenceAction({
      name,
      username: username.trim() ? username.trim().replace(/^@/, "") : null,
      bio: bio.trim() || null,
      statusText: statusText.trim() || null,
      presence,
      avatarUrl: avatarUrl.trim() || null,
      metaDiariaMinutos,
    });

    setSaving(false);

    if (!result.ok) {
      setFeedback({
        type: "error",
        message: result.error || "Não foi possível salvar o perfil.",
      });
      return;
    }

    setFeedback({
      type: "success",
      message: "Perfil, status de presença e avatar atualizados com sucesso.",
    });
    onUpdated?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-[#171D25]/90 p-6 shadow-xl backdrop-blur-xl"
    >
      <div className="mb-6 flex flex-col items-start gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name || "Avatar"}
              className="h-24 w-24 rounded-2xl object-cover ring-2 ring-[#66C0F4]/60"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#1E2631] text-2xl font-bold text-[#66C0F4] ring-2 ring-white/15">
              {(name || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-[#1A9FFF] text-[#0E141B] shadow-lg transition hover:bg-[#66C0F4]">
            {uploadingAvatar ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
          </label>
        </div>

        <div className="space-y-1">
          <span className="font-mono text-xs uppercase tracking-wider text-[#66C0F4]">
            Identidade & Presença
          </span>
          <h2 className="text-xl font-bold text-[#F3F4F6]">
            {name || "Estudante Mindly"}
          </h2>
          <p className="font-mono text-xs text-[#8F98A0]">
            {username ? `@${username}` : "Defina um @username para amigos te acharem"} •{" "}
            {initialProfile.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8F98A0]">
            Nome de Exibição
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8F98A0]">
            @Username (Busca de Amigos)
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ex: carlos_valli"
            className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 font-mono text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8F98A0]">
            Estado de Presença
          </label>
          <select
            value={presence}
            onChange={(e) => setPresence(e.target.value as ConsolePresence)}
            className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
          >
            <option value="ONLINE">Online (Disponível)</option>
            <option value="STUDYING">Estudando Agora (Em Sessão)</option>
            <option value="BUSY">Ocupado / Foco Máximo</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8F98A0]">
            Status em Tempo Real
          </label>
          <input
            type="text"
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            placeholder="Ex: Revisando Cálculo II para a prova"
            className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8F98A0]">
            URL do Avatar (ou use o botão da câmera)
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8F98A0]">
            Meta Diária (minutos)
          </label>
          <input
            type="number"
            min={15}
            max={960}
            value={metaDiariaMinutos}
            onChange={(e) => setMetaDiariaMinutos(Number(e.target.value) || 120)}
            className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 font-mono text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8F98A0]">
            Biografia / Foco Acadêmico
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Escreva uma breve apresentação sobre suas trilhas, projetos ou provas..."
            className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
          />
        </div>
      </div>

      {feedback && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-medium ${
            feedback.type === "success"
              ? "border-[#A4D007]/40 bg-[#A4D007]/10 text-[#A4D007]"
              : "border-[#D94126]/40 bg-[#D94126]/10 text-[#F3F4F6]"
          }`}
        >
          {feedback.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={saving || uploadingAvatar}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1A9FFF] px-5 py-2.5 text-sm font-semibold text-[#0E141B] shadow-[0_0_24px_rgba(26,159,255,0.3)] transition hover:bg-[#66C0F4] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Salvar Perfil</span>
        </button>
      </div>
    </form>
  );
}