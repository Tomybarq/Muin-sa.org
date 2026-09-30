import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.roleType !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            type: true,
            permissions: {
              select: {
                screenId: true,
                actions: true,
              },
            },
          },
        },
        permissions: {
          select: {
            screenId: true,
            actions: true,
            deniedActions: true,
          },
        },
      },
    });

    if (!user || (user.role.type === "superadmin" && session.roleType !== "superadmin")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      rolePermissions: user.role.permissions,
      directPermissions: user.permissions,
    });
  } catch (error) {
    console.error("GET /api/users/[id]/permissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.roleType !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
    }

    const { permissions } = await request.json(); // Array of { screenId: number, actions: string[], deniedActions?: string[] }
    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: "Permissions must be an array" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!targetUser || (targetUser.role.type === "superadmin" && session.roleType !== "superadmin")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const permsScreen = await prisma.screen.findUnique({
      where: { name: "settings-permissions" },
    });

    const isTargetSuperAdmin = targetUser.role.type === "superadmin";

    // Perform updates in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all old direct permissions for this user
      await tx.userPermission.deleteMany({
        where: { userId },
      });

      // Insert new ones if they contain allowed or denied actions
      let activePermissions = permissions.filter(
        (p) => (p.actions && p.actions.length > 0) || (p.deniedActions && p.deniedActions.length > 0)
      );

      // If the target user is not superadmin, exclude the permissions management screen
      if (!isTargetSuperAdmin && permsScreen) {
        activePermissions = activePermissions.filter((p) => p.screenId !== permsScreen.id);
      }

      if (activePermissions.length > 0) {
        await tx.userPermission.createMany({
          data: activePermissions.map((p) => ({
            userId,
            screenId: p.screenId,
            actions: p.actions || [],
            deniedActions: p.deniedActions || [],
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/users/[id]/permissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
