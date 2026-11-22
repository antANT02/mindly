"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Loader2,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import {
  respondFriendRequestAction,
  searchUsersAction,
  sendFriendRequestAction,
  updateProfileAndPresenceAction,
} from "@/app/actions/social.actions";
import { assignFriendsToTaskAction } from "@/app/actions/coop.actions";
import type { ConsolePresence } from "@/components/console/console-hud-shell";
import type {
  ConsoleCoopTaskItem,
  ConsoleFriendOption,
  ConsoleLibraryGroupCard,
  ConsolePendingRequest,
} from "@/components/console/console-library-dashboard";

interface SteamSocialOverlayProps {
  open: boolean;
  onClose: () => void;
  currentPresence?: ConsolePresence;
  friends: ConsoleFriendOption[];
  pendingRequests: ConsolePendingRequest[];
  groups: ConsoleLibraryGroupCard[];
  tasks: ConsoleCoopTaskItem[];
}

type OverlayTab = "FRIENDS" | "GROUPS" | "INVITES";

interface FoundUser {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  image: string | null;
  presence: string;
  statusText: string | null;
  xp: number;
}

export function SteamSocialOverlay({
  open,
  onClose,
  currentPresence = "ONLINE",
  friends,
  pendingRequests,
  groups,
  tasks,
}: SteamSocialOverlayProps) {
  const [activeTab, setActiveTab] = useState<OverlayTab>("FRIENDS");
  const [presence, setPresence] = useState<ConsolePresence>(currentPresence);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<FoundUser[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedTaskByFriend, setSelectedTaskByFriend] = useState<
    Record<string, string>
  >({});

  const studyingFriends = friends.filter((f) => f.presence === "STUDYING");
  const onlineFriends = friends.filter((f) => f.presence !== "STUDYING");

  const handlePresenceChange = async (next: ConsolePresence) => {
    setPresence(next);
    await updateProfileAndPresenceAction({ presence: next });
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length < 2) return;
    setSearching(true);
    setStatusMessage(null);

    const res = await searchUsersAction(searchTerm);
    setSearching(false);

    if (!res.ok) {
      setStatusMessage(res.error || "Erro na busca.");
      return;
    }

    setSearchResults(res.data ?? []);
  };

  const handleSendRequest = async (targetUserId: string) => {
    setBusyId(targetUserId);
    setStatusMessage(null);
    const res = await sendFriendRequestAction(targetUserId);
    setBusyId(null);

    if (!res.ok) {
      setStatusMessage(res.error || "Não foi possível enviar convite.");
      return;
    }

    setStatusMessage("Solicitação enviada.");
  };

  const handleRespondRequest = async (
    requestId: string,
    action: "ACCEPT" | "DECLINE"
  ) => {
    setBusyId(requestId);
    setStatusMessage(null);
    const res = await respondFriendRequestAction(requestId, action);
    setBusyId(null);

    if (!res.ok) {
      setStatusMessage(res.error || "Erro ao responder.");
      return;
    }

    setStatusMessage(
      action === "ACCEPT" ? "Amigo adicionado." : "Solicitação recusada."
    );
  };

  const handleAssignFriendToTask = async (friendId: string) => {
    const chosenTaskId = selectedTaskByFriend[friendId] || tasks[0]?.id;
    if (!chosenTaskId) {
      setStatusMessage("Crie uma tarefa antes de atribuir um amigo.");
      return;
    }

    setBusyId(friendId);
    setStatusMessage(null);
    const res = await assignFriendsToTaskAction(chosenTaskId, [friendId]);
    setBusyId(null);

    if (!res.ok) {
      setStatusMessage(res.error || "Erro ao atribuir à tarefa.");
      return;
    }

    setStatusMessage("Amigo atribuído à tarefa.");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[380px] flex-col border-l border-white/[0.08] bg-[#121820]/95 text-[#F3F4F6] shadow-2xl backdrop-blur-2xl"
          >
            {/* Topo do Overlay com Seletor de Presença */}
            <div className="border-b border-white/[0.07] px-4 py-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tracking-tight">
                  Lista de Amigos
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1 text-[#8F98A0] transition hover:bg-[#1A222D] hover:text-[#F3F4F6]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-[#8F98A0]">
                  Seu estado
                </span>
                <select
                  value={presence}
                  onChange={(e) =>
                    handlePresenceChange(e.target.value as ConsolePresence)
                  }
                  className="rounded-lg border border-white/[0.08] bg-[#0B0F14] px-2.5 py-1 text-xs text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                >
                  <option value="ONLINE">Online</option>
                  <option value="STUDYING">Estudando Agora</option>
                  <option value="BUSY">Ocupado</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </div>
            </div>

            {/* Abas */}
            <div className="grid grid-cols-3 border-b border-white/[0.07] bg-[#0B0F14]/70 px-2 py-1.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("FRIENDS")}
                className={`rounded-lg py-1.5 transition ${
                  activeTab === "FRIENDS"
                    ? "bg-[#1A222D] text-[#F3F4F6]"
                    : "text-[#8F98A0] hover:text-[#F3F4F6]"
                }`}
              >
                Amigos ({friends.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("GROUPS")}
                className={`rounded-lg py-1.5 transition ${
                  activeTab === "GROUPS"
                    ? "bg-[#1A222D] text-[#F3F4F6]"
                    : "text-[#8F98A0] hover:text-[#F3F4F6]"
                }`}
              >
                Grupos ({groups.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("INVITES")}
                className={`rounded-lg py-1.5 transition ${
                  activeTab === "INVITES"
                    ? "bg-[#1A222D] text-[#66C0F4]"
                    : "text-[#8F98A0] hover:text-[#F3F4F6]"
                }`}
              >
                Convites ({pendingRequests.length})
              </button>
            </div>

            {/* Corpo Rolável */}
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {statusMessage && (
                <div className="rounded-lg border border-[#66C0F4]/30 bg-[#66C0F4]/10 px-3 py-2 text-xs text-[#66C0F4]">
                  {statusMessage}
                </div>
              )}

              {activeTab === "FRIENDS" && (
                <>
                  {studyingFriends.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-mono text-[11px] uppercase tracking-wider text-[#66C0F4]">
                        Em Sessão ({studyingFriends.length})
                      </div>
                      {studyingFriends.map((friend) => {
                        const avatar = friend.avatarUrl || friend.image;
                        return (
                          <div
                            key={friend.id}
                            className="space-y-2 rounded-xl border border-white/[0.07] bg-[#1A222D]/70 p-3"
                          >
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5">
                                {avatar ? (
                                  <img
                                    src={avatar}
                                    alt={friend.name}
                                    className="h-8 w-8 rounded-lg object-cover ring-1 ring-[#66C0F4]/60"
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#121820] font-mono text-xs font-bold text-[#66C0F4]">
                                    {friend.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-semibold text-[#F3F4F6]">
                                    {friend.name}
                                  </p>
                                  <p className="text-[11px] text-[#66C0F4]">
                                    {friend.statusText || "Estudando agora"}
                                  </p>
                                </div>
                              </div>
                              <span className="font-mono text-[11px] tabular-nums text-[#8F98A0]">
                                {friend.xp} XP
                              </span>
                            </div>

                            {tasks.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <select
                                  value={
                                    selectedTaskByFriend[friend.id] ||
                                    tasks[0].id
                                  }
                                  onChange={(e) =>
                                    setSelectedTaskByFriend((prev) => ({
                                      ...prev,
                                      [friend.id]: e.target.value,
                                    }))
                                  }
                                  className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#0B0F14] px-2 py-1 text-[11px] text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                                >
                                  {tasks.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.title}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={busyId === friend.id}
                                  onClick={() =>
                                    handleAssignFriendToTask(friend.id)
                                  }
                                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#1A9FFF] px-2.5 py-1 text-[11px] font-semibold text-[#0B0F14] transition hover:bg-[#66C0F4] disabled:opacity-50"
                                >
                                  {busyId === friend.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <UserPlus className="h-3 w-3" />
                                  )}
                                  <span>Atribuir</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="font-mono text-[11px] uppercase tracking-wider text-[#A4D007]">
                      Conectados ({onlineFriends.length})
                    </div>
                    {friends.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-white/[0.08] bg-[#0B0F14]/50 p-4 text-xs text-[#8F98A0]">
                        Nenhum amigo conectado. Busque por @username na aba
                        Convites.
                      </p>
                    ) : (
                      onlineFriends.map((friend) => {
                        const avatar = friend.avatarUrl || friend.image;
                        return (
                          <div
                            key={friend.id}
                            className="space-y-2 rounded-xl border border-white/[0.07] bg-[#1A222D]/45 p-3"
                          >
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5">
                                {avatar ? (
                                  <img
                                    src={avatar}
                                    alt={friend.name}
                                    className="h-8 w-8 rounded-lg object-cover ring-1 ring-[#A4D007]/50"
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#121820] font-mono text-xs font-bold text-[#A4D007]">
                                    {friend.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-semibold text-[#F3F4F6]">
                                    {friend.name}
                                  </p>
                                  <p className="text-[11px] text-[#8F98A0]">
                                    {friend.statusText || "Online"}
                                  </p>
                                </div>
                              </div>
                              <span className="font-mono text-[11px] tabular-nums text-[#8F98A0]">
                                {friend.xp} XP
                              </span>
                            </div>

                            {tasks.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <select
                                  value={
                                    selectedTaskByFriend[friend.id] ||
                                    tasks[0].id
                                  }
                                  onChange={(e) =>
                                    setSelectedTaskByFriend((prev) => ({
                                      ...prev,
                                      [friend.id]: e.target.value,
                                    }))
                                  }
                                  className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#0B0F14] px-2 py-1 text-[11px] text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                                >
                                  {tasks.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.title}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={busyId === friend.id}
                                  onClick={() =>
                                    handleAssignFriendToTask(friend.id)
                                  }
                                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-[#121820] px-2.5 py-1 text-[11px] font-medium text-[#66C0F4] transition hover:border-[#66C0F4] disabled:opacity-50"
                                >
                                  <UserPlus className="h-3 w-3" />
                                  <span>Atribuir</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {activeTab === "GROUPS" && (
                <div className="space-y-2.5">
                  {groups.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/[0.08] bg-[#0B0F14]/50 p-4 text-xs text-[#8F98A0]">
                      Nenhum grupo ativo no momento.
                    </p>
                  ) : (
                    groups.map((grp) => (
                      <Link
                        key={grp.id}
                        href={grp.href}
                        onClick={onClose}
                        className="block rounded-xl border border-white/[0.07] bg-[#1A222D]/55 p-3.5 transition hover:border-[#66C0F4]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold capitalize text-[#F3F4F6]">
                            {grp.name}
                          </span>
                          <span className="font-mono text-[11px] tabular-nums text-[#66C0F4]">
                            {grp.inviteCode}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] tabular-nums text-[#8F98A0]">
                          {grp.memberCount} membros · {grp.taskCount} tarefas
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {activeTab === "INVITES" && (
                <div className="space-y-5">
                  <form onSubmit={handleSearchUsers} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[#8F98A0]" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar @username ou e-mail..."
                        className="w-full rounded-lg border border-white/[0.08] bg-[#0B0F14] py-1.5 pl-8 pr-2.5 text-xs text-[#F3F4F6] placeholder-[#8F98A0]/80 outline-none focus:border-[#66C0F4]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searching}
                      className="rounded-lg bg-[#1A9FFF] px-3 py-1.5 text-xs font-semibold text-[#0B0F14] hover:bg-[#66C0F4]"
                    >
                      {searching ? "..." : "Buscar"}
                    </button>
                  </form>

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-mono text-[11px] uppercase text-[#8F98A0]">
                        Resultados
                      </div>
                      {searchResults.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#1A222D]/60 p-2.5"
                        >
                          <div>
                            <p className="text-xs font-semibold text-[#F3F4F6]">
                              {u.name}
                            </p>
                            <p className="font-mono text-[11px] text-[#8F98A0]">
                              {u.username ? `@${u.username}` : `${u.xp} XP`}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={busyId === u.id}
                            onClick={() => handleSendRequest(u.id)}
                            className="rounded-lg bg-[#1A9FFF] px-2.5 py-1 text-xs font-semibold text-[#0B0F14] hover:bg-[#66C0F4]"
                          >
                            Convidar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="font-mono text-[11px] uppercase text-[#8F98A0]">
                      Solicitações Pendentes
                    </div>
                    {pendingRequests.length === 0 ? (
                      <p className="text-xs text-[#8F98A0]">
                        Nenhuma solicitação pendente.
                      </p>
                    ) : (
                      pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#1A222D]/60 p-2.5"
                        >
                          <div>
                            <p className="text-xs font-semibold text-[#F3F4F6]">
                              {req.requester.name}
                            </p>
                            <p className="font-mono text-[11px] text-[#8F98A0]">
                              {req.requester.username
                                ? `@${req.requester.username}`
                                : "Estudante"}
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              disabled={busyId === req.id}
                              onClick={() =>
                                handleRespondRequest(req.id, "ACCEPT")
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-[#A4D007] px-2 py-1 text-xs font-semibold text-[#0B0F14]"
                            >
                              <Check className="h-3 w-3" />
                              Aceitar
                            </button>
                            <button
                              type="button"
                              disabled={busyId === req.id}
                              onClick={() =>
                                handleRespondRequest(req.id, "DECLINE")
                              }
                              className="rounded-lg border border-white/10 bg-[#0B0F14] px-2 py-1 text-xs text-[#8F98A0] hover:text-white"
                            >
                              Recusar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}