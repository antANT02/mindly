import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type {
  ConsolePresence,
  ConsoleUserProfile,
} from "@/components/console/console-hud-shell";
import {
  ConsoleProfileView,
  type ProfileTelemetryStats,
} from "@/components/console/console-profile-view";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [dbUser, completedCoopCount, subjectCount, groupCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          avatarUrl: true,
          image: true,
          bio: true,
          statusText: true,
          presence: true,
          xp: true,
          streakDays: true,
          metaDiariaMinutos: true,
        },
      }),
      prisma.taskAssignee.count({
        where: { userId, completedIndividual: true },
      }),
      prisma.subject.count({
        where: {
          OR: [
            { userId },
            { group: { consoleMembers: { some: { userId } } } },
          ],
        },
      }),
      prisma.studyGroup.count({
        where: {
          OR: [
            { ownerId: userId },
            { consoleMembers: { some: { userId } } },
          ],
        },
      }),
    ]);

  if (!dbUser) {
    redirect("/login");
  }

  const currentUser: ConsoleUserProfile = {
    ...dbUser,
    presence: (dbUser.presence as ConsolePresence) || "ONLINE",
  };

  const stats: ProfileTelemetryStats = {
    completedTasks: completedCoopCount,
    activeSubjects: subjectCount,
    activeGroups: groupCount,
  };

  return <ConsoleProfileView currentUser={currentUser} stats={stats} />;
}