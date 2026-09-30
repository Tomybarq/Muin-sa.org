import { NextResponse } from "next/server";
import { getSession, clearSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isArchived: true,
        language: true,
        darkMode: true,
        image: {
          select: {
            id: true,
            name: true,
            originalName: true,
            mimetype: true,
            fileSize: true,
          },
        },
        role: {
          select: {
            name: true,
            type: true,
            permissions: {
              select: {
                actions: true,
                screen: {
                  select: {
                    path: true,
                  },
                },
              },
            },
          },
        },
        permissions: {
          select: {
            actions: true,
            deniedActions: true,
            screen: {
              select: {
                path: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.isArchived) {
      await clearSession();
      return NextResponse.json({ error: "User is archived or not found" }, { status: 401 });
    }

    const permissions: Record<string, string[]> = {};
    user.role.permissions.forEach((p) => {
      permissions[p.screen.path] = [...(p.actions || [])];
    });

    user.permissions.forEach((p) => {
      const path = p.screen.path;
      const roleActions = permissions[path] || [];
      const allowed = p.actions || [];
      const denied = p.deniedActions || [];

      // Combine role actions with explicit allowed actions, then exclude explicit denied actions
      const combined = Array.from(new Set([...roleActions, ...allowed]));
      permissions[path] = combined.filter((act) => !denied.includes(act));
    });

    const isSuperAdmin =
      user.role.type === "superadmin" ||
      user.role.name.toLowerCase() === "superadmin";

    if (isSuperAdmin) {
      const allScreens = await prisma.screen.findMany();
      const allActions = ["view", "create", "edit", "delete", "archive", "unarchive", "export"];
      allScreens.forEach((s) => {
        permissions[s.path] = [...allActions];
      });
    }

    // Auto-grant 'unarchive' permission for any screen that has 'archive' permission
    Object.keys(permissions).forEach((path) => {
      if (permissions[path].includes("archive") && !permissions[path].includes("unarchive")) {
        permissions[path].push("unarchive");
      }
    });

    const allowedScreens = Object.keys(permissions).filter(
      (path) => permissions[path] && permissions[path].length > 0
    );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        roleType: user.role.type,
        language: user.language,
        darkMode: user.darkMode,
        image: user.image
          ? {
              id: user.image.id,
              url: `/api/attachments/${user.image.id}/file`,
              name: user.image.name,
              originalName: user.image.originalName,
              mimetype: user.image.mimetype,
              fileSize: user.image.fileSize,
            }
          : null,
        imageUrl: user.image ? `/api/attachments/${user.image.id}/file` : null,
        allowedScreens,
        permissions,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
