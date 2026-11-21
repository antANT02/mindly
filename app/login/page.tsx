"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await signIn.email({
      email,
      password,
    });

    setCarregando(false);

    if (error) {
      setErro(error.message || "Não foi possível entrar. Verifique e-mail e senha.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#F8F7F4] text-[#1A1C1A] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#E5E2DC] rounded-xl p-8 shadow-xs">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-semibold tracking-widest uppercase text-[#1E3A2F]"
          >
            MindLy
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1A1C1A]">
            Entrar na sua área de estudo
          </h1>
          <p className="mt-1 text-sm text-[#5C615C]">
            Retome suas disciplinas, metas e revisões programadas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#2A2D2A] mb-1.5"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3.5 py-2.5 text-sm text-[#1A1C1A] placeholder:text-[#8E928E] focus:border-[#1E3A2F] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#2A2D2A] mb-1.5"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[#D6D2C9] bg-[#FCFBF9] px-3.5 py-2.5 text-sm text-[#1A1C1A] placeholder:text-[#8E928E] focus:border-[#1E3A2F] focus:outline-none"
            />
          </div>

          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-[#1E3A2F] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#162C23] disabled:opacity-60 cursor-pointer"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#5C615C]">
          Ainda não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-medium text-[#1E3A2F] underline underline-offset-4 hover:text-[#162C23]"
          >
            Criar conta gratuita
          </Link>
        </p>
      </div>
    </main>
  );
}