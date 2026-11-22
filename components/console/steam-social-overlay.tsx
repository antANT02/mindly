"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Loader2,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  respondFriendRequestAction,
  searchUsersAction,
  sendFriendRequestAction,
} from "@/app/actions/social.actions";
import { assignFriendsToTaskAction } from "@/app/actions/coop.actions";
import type {
  ConsoleCoopTaskItem,
  ConsoleFriendOption,
  ConsoleLibraryGroupCard,
  ConsolePendingRequest,
} from "@/components/console/console-library-dashboard";

interface SteamSocialOverlayProps {
  open: boolean;
  onClose: () => void;
  friends: ConsoleFriendOption[];
  pendingRequests: ConsolePendingRequest[];
  groups: ConsoleLibraryGroupCard[];
  tasks: ConsoleCoopTaskItem[];
}

type OverlayTab = "FRIENDS" | "REQUESTS" | "GROUPS";

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
  friends,
  pendingRequests,
  groups,
  tasks,
}: SteamSocialOverlayProps) {
  const [activeTab, setActiveTab] = useState<OverlayTab>("FRIENDS");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<FoundUser[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedTaskByFriend, setSelectedTaskByFriend] = useState<
    Record<string, string>
  >({});

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

    setStatusMessage("Solicitação de amizade enviada.");
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
      setStatusMessage(res.error || "Erro ao responder solicitação.");
      return;
    }

    setStatusMessage(
      action === "ACCEPT" ? "Amigo adicionado!" : "Solicitação recusada."
    );
  };

  const handleAssignFriendToTask = async (friendId: string) => {
    const chosenTaskId = selectedTaskByFriend[friendId] || tasks[0]?.id;
    if (!chosenTaskId) {
      setStatusMessage("Crie uma tarefa Co-op antes de convidar um amigo.");
      return;
    }

    setBusyId(friendId);
    setStatusMessage(null);
    const res = await assignFriendsToTaskAction(chosenTaskId, [friendId]);
    setBusyId(null);

    if (!res.ok) {
      setStatusMessage(res.error || "Erro ao atribuir amigo à tarefa.");
      return;
    }

    setStatusMessage("Amigo atribuído à tarefa com 1 clique!");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-white/15 bg-[#171D25]/95 text-[#F3F4F6] shadow-2xl backdrop-blur-2xl"
        >
          {/* Cabeçalho do Overlay */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-[#66C0F4]" />
              <div>
                <h2 className="text-base font-bold">Mindly Social Overlay</h2>
                <p className="font-mono text-[11px] text-[#8F98A0]">
                  Amigos, Convites & Lobbies Ativos
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#8F98A0] transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Abas */}
          <div className="grid grid-cols-3 border-b border-white/10 bg-[#0E141B]/60 p-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("FRIENDS")}
              className={`rounded-lg py-2 font-semibold transition ${
                activeTab === "FRIENDS"
                  ? "bg-[#1E2631] text-[#66C0F4]"
                  : "text-[#8F98A0] hover:text-white"
              }`}
            >
              Amigos ({friends.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("REQUESTS")}
              className={`rounded-lg py-2 font-semibold transition ${
                activeTab === "REQUESTS"
                  ? "bg-[#1E2631] text-[#A4D007]"
                  : "text-[#8F98A0] hover:text-white"
              }`}
            >
              Convites ({pendingRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("GROUPS")}
              className={`rounded-lg py-2 font-semibold transition ${
                activeTab === "GROUPS"
                  ? "bg-[#1E2631] text-[#66C0F4]"
                  : "text-[#8F98A0] hover:text-white"
              }`}
            >
              Grupos ({groups.length})
            </button>
          </div>

          {/* Corpo Rolável */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {statusMessage && (
              <div className="rounded-lg border border-[#66C0F4]/40 bg-[#66C0F4]/10 px-3 py-2 text-xs text-[#66C0F4]">
                {statusMessage}
              </div>
            )}

            {activeTab === "FRIENDS" && (
              <div className="space-y-3">
                {friends.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 bg-[#0E141B]/50 p-4 text-xs text-[#8F98A0]">
                    Nenhum amigo conectado ainda. Use a aba{" "}
                    <span className="text-[#66C0F4]">Convites</span> para buscar
                    por @username.
                  </p>
                ) : (
                  friends.map((friend) => {
                    const avatar = friend.avatarUrl || friend.image;
                    const isStudying = friend.presence === "STUDYING";
                    return (
                      <div
                        key={friend.id}
                        className="space-y-2.5 rounded-xl border border-white/10 bg-[#1E2631]/80 p-3.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={friend.name}
                                className="h-9 w-9 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#26303E] font-mono text-xs font-bold text-[#66C0F4]">
                                {friend.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-[#F3F4F6]">
                                {friend.name}
                              </p>
                              <p
                                className={`text-xs ${
                                  isStudying
                                    ? "text-[#66C0F4]"
                                    : "text-[#A4D007]"
                                }`}
                              >
                                {friend.statusText ||
                                  (isStudying
                                    ? "Estudando agora"
                                    : "Online")}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono text-[11px] text-[#8F98A0]">
                            {friend.xp} XP
                          </span>
                        </div>

                        {tasks.length > 0 && (
                          <div className="flex items-center gap-2 pt-1">
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
                              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0E141B] px-2.5 py-1.5 text-xs text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
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
                              onClick={() => handleAssignFriendToTask(friend.id)}
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#1A9FFF] px-3 py-1.5 text-xs font-semibold text-[#0E141B] transition hover:bg-[#66C0F4] disabled:opacity-50"
                            >
                              {busyId === friend.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <UserPlus className="h-3.5 w-3.5" />
                              )}
                              <span>Atribuir</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "REQUESTS" && (
              <div className="space-y-5">
                <form onSubmit={handleSearchUsers} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#8F98A0]" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar @username ou e-mail..."
                      className="w-full rounded-lg border border-white/10 bg-[#0E141B] py-2 pl-9 pr-3 text-xs text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching}
                    className="rounded-lg bg-[#1A9FFF] px-3.5 py-2 text-xs font-semibold text-[#0E141B] hover:bg-[#66C0F4]"
                  >
                    {searching ? "..." : "Buscar"}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-mono text-[11px] uppercase text-[#8F98A0]">
                      Resultados da busca
                    </p>
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1E2631] p-3"
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
                          className="rounded-lg bg-[#1A9FFF] px-3 py-1.5 text-xs font-semibold text-[#0E141B] hover:bg-[#66C0F4]"
                        >
                          Convidar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="font-mono text-[11px] uppercase text-[#8F98A0]">
                    Solicitações recebidas
                  </p>
                  {pendingRequests.length === 0 ? (
                    <p className="text-xs text-[#8F98A0]">
                      Nenhuma solicitação pendente.
                    </p>
                  ) : (
                    pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1E2631] p-3"
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
                            className="inline-flex items-center gap-1 rounded-lg bg-[#A4D007] px-2.5 py-1 text-xs font-semibold text-[#0E141B]"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Aceitar</span>
                          </button>
                          <button
                            type="button"
                            disabled={busyId === req.id}
                            onClick={() =>
                              handleRespondRequest(req.id, "DECLINE")
                            }
                            className="rounded-lg border border-white/15 bg-[#0E141B] px-2.5 py-1 text-xs text-[#8F98A0] hover:text-white"
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

            {activeTab === "GROUPS" && (
              <div className="space-y-2.5">
                {groups.length === 0 ? (
                  <p className="text-xs text-[#8F98A0]">
                    Você ainda não participa de nenhum grupo.
                  </p>
                ) : (
                  groups.map((grp) => (
                    <Link
                      key={grp.id}
                      href={grp.href}
                      onClick={onClose}
                      className="block rounded-xl border border-white/10 bg-[#1E2631] p-3.5 transition hover:border-[#66C0F4]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#F3F4F6]">
                          {grp.name}
                        </span>
                        <span className="font-mono text-[11px] text-[#66C0F4]">
                          {grp.inviteCode}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-[#8F98A0]">
                        {grp.memberCount} membros • {grp.taskCount} tarefas
                      </p>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}