"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { MindlyWordmark } from "@/components/brand/mindly-wordmark";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (authError) {
      setError(authError.message || "Credenciais inválidas.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] px-4 text-[#F3F4F6]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 65% 45% at 50% 0%, rgba(26,159,255,0.16) 0%, transparent 65%), linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 32px 32px, 32px 32px",
      }}
    >
      <div className="mb-7 text-center">
        <MindlyWordmark size="lg" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#121820]/90 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[#F3F4F6]">
            Iniciar Sessão
          </h1>
          <p className="mt-0.5 text-xs text-[#8F98A0]">
            Entre com sua conta para acessar sua biblioteca.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
              E-mail
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none transition focus:border-[#66C0F4] focus:ring-2 focus:ring-[#66C0F4]/25"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
              Senha
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none transition focus:border-[#66C0F4] focus:ring-2 focus:ring-[#66C0F4]/25"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-[#E04F33]/35 bg-[#E04F33]/10 px-3 py-2 text-xs text-[#E04F33]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A9FFF] py-2.5 text-sm font-semibold text-[#0B0F14] transition hover:bg-[#66C0F4] disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{loading ? "Conectando..." : "Entrar"}</span>
        </button>

        <p className="pt-1 text-center text-xs text-[#8F98A0]">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-[#66C0F4] hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}