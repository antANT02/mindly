"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { MindlyWordmark } from "@/components/brand/mindly-wordmark";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (authError) {
      setError(authError.message || "Não foi possível criar a conta.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070512] px-4 text-[#F4F1FA]">
      <div className="mb-6 text-center">
        <MindlyWordmark size="lg" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-[2px] border border-[#CBB6FF]/20 border-t-4 border-t-[#7E49C7] bg-[#1B0B3A] p-6"
      >
        <div>
          <h1 className="font-serif text-2xl tracking-tight text-[#F4F1FA]">
            Criar Conta
          </h1>
          <p className="mt-0.5 text-xs text-[#9D8EC4]">
            Configure seu perfil de estudos e lobbies colaborativos.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
              Nome
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
              E-mail
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
              Senha
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-[2px] border border-[#E04F33]/50 bg-[#E04F33]/15 px-3 py-2 text-xs text-[#F4F1FA]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-[2px] bg-[#7E49C7] py-2.5 text-sm font-semibold text-[#F4F1FA] transition-colors duration-150 hover:bg-[#9361D9] disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{loading ? "Criando..." : "Criar Conta"}</span>
        </button>

        <p className="pt-1 text-center text-xs text-[#9D8EC4]">
          Já possui conta?{" "}
          <Link href="/login" className="text-[#CBB6FF] hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}