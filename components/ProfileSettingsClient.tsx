"use client";

import React, { useState, useRef } from "react";
import { Upload, Check, Clock, CheckSquare, BookOpen } from "lucide-react";
import { EditorialAvatar } from "@/components/EditorialAvatar";
import { updateProfileAction } from "@/app/actions/mindly";

interface ProfileSettingsClientProps {
  profile: {
    id: string;
    name: string;
    email: string;
    bio: string | null;
    image: string | null;
    metaDiariaMinutos: number;
    fatorFacilidadePadrao: number;
  };
  stats: {
    totalDisciplinas: number;
    tarefasConcluidas: number;
    totalTarefas: number;
    minutosEstudados: number;
    gruposAtivos: number;
  };
}

export function ProfileSettingsClient({
  profile,
  stats,
}: ProfileSettingsClientProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(profile.image);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.image);
  const [metaDiariaMinutos, setMetaDiariaMinutos] = useState(
    profile.metaDiariaMinutos
  );
  const [fatorFacilidadePadrao, setFatorFacilidadePadrao] = useState(
    profile.fatorFacilidadePadrao
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setMessage(null);
    const localObjectUrl = URL.createObjectURL(file);
    setPreviewUrl(localObjectUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao enviar foto.");
        setPreviewUrl(imageUrl);
        return;
      }

      setImageUrl(data.url);
      setPreviewUrl(data.url);
      setMessage("Foto de perfil atualizada.");
    } catch {
      setError("Falha de rede ao enviar a foto.");
      setPreviewUrl(imageUrl);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await updateProfileAction({
      name,
      bio,
      image: imageUrl,
      metaDiariaMinutos,
      fatorFacilidadePadrao,
    });

    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage("Alterações de perfil salvas.");
  }

  const horasEstudadas = (stats.minutosEstudados / 60).toFixed(1);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface p-5">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs uppercase tracking-wider">Tempo total</span>
            <Clock className="h-4 w-4 text-olive" strokeWidth={1.5} />
          </div>
          <p className="mt-3 font-serif text-3xl text-ink">{horasEstudadas}h</p>
          <p className="mt-1 text-xs text-ink-subtle">
            {stats.minutosEstudados} minutos registrados
          </p>
        </div>

        <div className="rounded-lg border border-line bg-surface p-5">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs uppercase tracking-wider">Tarefas</span>
            <CheckSquare className="h-4 w-4 text-olive" strokeWidth={1.5} />
          </div>
          <p className="mt-3 font-serif text-3xl text-ink">
            {stats.tarefasConcluidas}/{stats.totalTarefas}
          </p>
          <p className="mt-1 text-xs text-ink-subtle">Concluídas no espaço</p>
        </div>

        <div className="rounded-lg border border-line bg-surface p-5">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs uppercase tracking-wider">Disciplinas</span>
            <BookOpen className="h-4 w-4 text-olive" strokeWidth={1.5} />
          </div>
          <p className="mt-3 font-serif text-3xl text-ink">
            {stats.totalDisciplinas}
          </p>
          <p className="mt-1 text-xs text-ink-subtle">Cadastradas</p>
        </div>

        <div className="rounded-lg border border-line bg-surface p-5">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs uppercase tracking-wider">Grupos</span>
            <Check className="h-4 w-4 text-olive" strokeWidth={1.5} />
          </div>
          <p className="mt-3 font-serif text-3xl text-ink">
            {stats.gruposAtivos}
          </p>
          <p className="mt-1 text-xs text-ink-subtle">Espaços colaborativos</p>
        </div>
      </section>

      <form
        onSubmit={handleSave}
        className="rounded-lg border border-line bg-surface p-6 sm:p-8"
      >
        <div className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-center">
          <EditorialAvatar
            src={previewUrl}
            name={name}
            email={profile.email}
            size="lg"
          />
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              Foto de perfil
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="editorial-transition inline-flex items-center gap-2 rounded-md border border-line bg-paper px-3.5 py-2 text-xs font-medium text-ink hover:border-olive hover:text-olive disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>{uploading ? "Enviando..." : "Escolher foto"}</span>
              </button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(null);
                    setPreviewUrl(null);
                  }}
                  className="text-xs text-ink-muted hover:text-ink"
                >
                  Remover foto
                </button>
              )}
            </div>
            <p className="text-xs text-ink-subtle">
              Formato quadrado recomendado (JPG, PNG ou WebP até 4 MB).
            </p>
          </div>
        </div>

        {(message || error) && (
          <div
            className={`mt-6 rounded-md border px-4 py-3 text-xs ${
              error
                ? "border-line bg-paper text-ink"
                : "border-olive/30 bg-olive-soft text-olive-deep"
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
              Nome completo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-olive focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
              E-mail
            </label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full rounded-md border border-line bg-paper/60 px-3.5 py-2.5 text-sm text-ink-subtle"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
              Biografia curta
            </label>
            <textarea
              rows={3}
              maxLength={280}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Foco atual, semestre, áreas de interesse ou rotina de revisão..."
              className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-olive focus:outline-none"
            />
            <p className="mt-1 text-right text-[11px] text-ink-subtle">
              {bio.length}/280
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
              Meta diária (minutos)
            </label>
            <input
              type="number"
              min={15}
              max={960}
              value={metaDiariaMinutos}
              onChange={(e) => setMetaDiariaMinutos(Number(e.target.value))}
              className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-olive focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
              Fator de facilidade SRS padrão
            </label>
            <input
              type="number"
              step="0.1"
              min={1.3}
              max={3.5}
              value={fatorFacilidadePadrao}
              onChange={(e) =>
                setFatorFacilidadePadrao(Number(e.target.value))
              }
              className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-olive focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end border-t border-line pt-6">
          <button
            type="submit"
            disabled={saving || uploading}
            className="editorial-transition rounded-md bg-olive px-5 py-2.5 text-xs font-medium text-surface hover:bg-olive-deep disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>
      </form>
    </div>
  );
}