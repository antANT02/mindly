"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Loader2, Search, X } from "lucide-react";
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

  if (!open) return null;

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
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#070512]/80"
      />

      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[380px] flex-col border-l border-[#CBB6FF]/20 bg-[#1B0B3A] text-[#F4F1FA]">
        {/* Cabeçalho */}
        <div className="border-b border-[#CBB6FF]/15 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <span className="font-serif text-lg tracking-tight text-[#F4F1FA]">
              Rede de Estudo
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar painel social"
              className="rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512] p-1 text-[#9D8EC4] transition-colors duration-150 hover:text-[#F4F1FA]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#9D8EC4]">
              Estado
            </span>
            <select
              value={presence}
              onChange={(e) =>
                handlePresenceChange(e.target.value as ConsolePresence)
              }
              className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-2.5 py-1 text-xs text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
            >
              <option value="ONLINE">Online</option>
              <option value="STUDYING">Estudando Agora</option>
              <option value="BUSY">Ocupado</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
        </div>

        {/* Abas Sólidas */}
        <div className="grid grid-cols-3 border-b border-[#CBB6FF]/15 bg-[#070512] text-xs font-medium">
          {(
            [
              { id: "FRIENDS", label: `Amigos (${friends.length})` },
              { id: "GROUPS", label: `Grupos (${groups.length})` },
              { id: "INVITES", label: `Convites (${pendingRequests.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 py-2.5 transition-colors duration-150 ${
                activeTab === tab.id
                  ? "border-[#7E49C7] bg-[#1B0B3A] text-[#F4F1FA]"
                  : "border-transparent text-[#9D8EC4] hover:text-[#CBB6FF]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Corpo */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {statusMessage && (
            <div className="rounded-[2px] border border-[#7E49C7] bg-[#3B1C6E] px-3 py-2 text-xs text-[#F4F1FA]">
              {statusMessage}
            </div>
          )}

          {activeTab === "FRIENDS" && (
            <>
              {studyingFriends.length > 0 && (
                <div className="space-y-2">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[#CBB6FF]">
                    Em Sessão ({studyingFriends.length})
                  </div>
                  {studyingFriends.map((friend) => {
                    const avatar = friend.avatarUrl || friend.image;
                    return (
                      <div
                        key={friend.id}
                        className="space-y-2 rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512] p-3"
                      >
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={friend.name}
                                className="h-8 w-8 rounded-[2px] border border-[#7E49C7] object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#7E49C7] bg-[#3B1C6E] font-mono text-xs font-bold text-[#CBB6FF]">
                                {friend.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-[#F4F1FA]">
                                {friend.name}
                              </p>
                              <p className="text-[11px] text-[#CBB6FF]">
                                {friend.statusText || "Estudando agora"}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono text-[11px] tabular-nums text-[#9D8EC4]">
                            {friend.xp} XP
                          </span>
                        </div>

                        {tasks.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <select
                              value={
                                selectedTaskByFriend[friend.id] || tasks[0].id
                              }
                              onChange={(e) =>
                                setSelectedTaskByFriend((prev) => ({
                                  ...prev,
                                  [friend.id]: e.target.value,
                                }))
                              }
                              className="min-w-0 flex-1 rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A] px-2 py-1 text-[11px] text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
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
                              className="shrink-0 rounded-[2px] bg-[#7E49C7] px-2.5 py-1 text-[11px] font-semibold text-[#F4F1FA] transition-colors duration-150 hover:bg-[#9361D9] disabled:opacity-50"
                            >
                              {busyId === friend.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Atribuir"
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2">
                <div className="font-mono text-[11px] uppercase tracking-wider text-[#9D8EC4]">
                  Conectados ({onlineFriends.length})
                </div>
                {friends.length === 0 ? (
                  <p className="rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512] p-4 text-xs text-[#9D8EC4]">
                    Nenhum amigo conectado. Busque por @username na aba
                    Convites.
                  </p>
                ) : (
                  onlineFriends.map((friend) => {
                    const avatar = friend.avatarUrl || friend.image;
                    return (
                      <div
                        key={friend.id}
                        className="space-y-2 rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512] p-3"
                      >
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={friend.name}
                                className="h-8 w-8 rounded-[2px] border border-[#CBB6FF]/20 object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#CBB6FF]/20 bg-[#1B0B3A] font-mono text-xs font-bold text-[#CBB6FF]">
                                {friend.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-[#F4F1FA]">
                                {friend.name}
                              </p>
                              <p className="text-[11px] text-[#9D8EC4]">
                                {friend.statusText || "Online"}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono text-[11px] tabular-nums text-[#9D8EC4]">
                            {friend.xp} XP
                          </span>
                        </div>

                        {tasks.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <select
                              value={
                                selectedTaskByFriend[friend.id] || tasks[0].id
                              }
                              onChange={(e) =>
                                setSelectedTaskByFriend((prev) => ({
                                  ...prev,
                                  [friend.id]: e.target.value,
                                }))
                              }
                              className="min-w-0 flex-1 rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A] px-2 py-1 text-[11px] text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
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
                              className="shrink-0 rounded-[2px] border border-[#7E49C7] bg-[#3B1C6E] px-2.5 py-1 text-[11px] font-medium text-[#F4F1FA] transition-colors duration-150 hover:bg-[#7E49C7] disabled:opacity-50"
                            >
                              Atribuir
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
                <p className="rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512] p-4 text-xs text-[#9D8EC4]">
                  Nenhum grupo ativo no momento.
                </p>
              ) : (
                groups.map((grp) => (
                  <Link
                    key={grp.id}
                    href={grp.href}
                    onClick={onClose}
                    className="block rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512] p-3.5 transition-colors duration-150 hover:border-[#7E49C7] hover:bg-[#3B1C6E]/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold capitalize text-[#F4F1FA]">
                        {grp.name}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-[#CBB6FF]">
                        {grp.inviteCode}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] tabular-nums text-[#9D8EC4]">
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
                  <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[#9D8EC4]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar @username ou e-mail..."
                    className="w-full rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512] py-1.5 pl-8 pr-2.5 text-xs text-[#F4F1FA] placeholder-[#9D8EC4]/70 outline-none focus:border-[#7E49C7]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="rounded-[2px] bg-[#7E49C7] px-3 py-1.5 text-xs font-semibold text-[#F4F1FA] hover:bg-[#9361D9]"
                >
                  {searching ? "..." : "Buscar"}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <div className="font-mono text-[11px] uppercase text-[#9D8EC4]">
                    Resultados
                  </div>
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512] p-2.5"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[#F4F1FA]">
                          {u.name}
                        </p>
                        <p className="font-mono text-[11px] text-[#9D8EC4]">
                          {u.username ? `@${u.username}` : `${u.xp} XP`}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => handleSendRequest(u.id)}
                        className="rounded-[2px] bg-[#7E49C7] px-2.5 py-1 text-xs font-semibold text-[#F4F1FA] hover:bg-[#9361D9]"
                      >
                        Convidar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <div className="font-mono text-[11px] uppercase text-[#9D8EC4]">
                  Solicitações Pendentes
                </div>
                {pendingRequests.length === 0 ? (
                  <p className="text-xs text-[#9D8EC4]">
                    Nenhuma solicitação pendente.
                  </p>
                ) : (
                  pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512] p-2.5"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[#F4F1FA]">
                          {req.requester.name}
                        </p>
                        <p className="font-mono text-[11px] text-[#9D8EC4]">
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
                          className="inline-flex items-center gap-1 rounded-[2px] bg-[#7E49C7] px-2 py-1 text-xs font-semibold text-[#F4F1FA]"
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
                          className="rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A] px-2 py-1 text-xs text-[#9D8EC4] hover:text-[#F4F1FA]"
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
      </aside>
    </>
  );
}