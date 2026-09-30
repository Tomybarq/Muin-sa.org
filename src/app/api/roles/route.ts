import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.roleType !== "superadmin" && session.roleType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = session.roleType === "superadmin";

    const roles = await prisma.role.findMany({
      where: isSuperAdmin ? {} : { type: { in: ["admin", "user"] } },
      include: {
        permissions: {
          select: {
            screenId: true,
            actions: true,
            screen: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                path: true,
              },
            },
          },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("GET /api/roles error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.roleType !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, nameAr, permissions, screenIds } = await request.json();
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const uppercaseName = name.trim().toUpperCase().replace(/\s+/g, "_");

    // Check if role name already exists
    const existing = await prisma.role.findUnique({
      where: { name: uppercaseName },
    });

    if (existing) {
      return NextResponse.json({ error: "Role already exists" }, { status: 400 });
    }

    const permsScreen = await prisma.screen.findUnique({
      where: { name: "settings-permissions" },
    });

    // Create role and optionally its permissions in a transaction
    const newRole = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: { 
          name: uppercaseName,
          nameAr: nameAr && nameAr.trim() !== "" ? nameAr.trim() : null
        },
      });

      if (Array.isArray(permissions) && permissions.length > 0) {
        const activePermissions = permsScreen
          ? permissions.filter((p: { screenId: number }) => p.screenId !== permsScreen.id)
          : permissions;

        if (activePermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: activePermissions.map((p: { screenId: number; actions: string[] }) => ({
              roleId: role.id,
              screenId: p.screenId,
              actions: p.actions,
            })),
          });
        }
      } else if (Array.isArray(screenIds) && screenIds.length > 0) {
        const activeScreenIds = permsScreen
          ? screenIds.filter((screenId: number) => screenId !== permsScreen.id)
          : screenIds;

        if (activeScreenIds.length > 0) {
          await tx.rolePermission.createMany({
            data: activeScreenIds.map((screenId: number) => ({
              roleId: role.id,
              screenId,
              actions: [],
            })),
          });
        }
      }

      return role;
    });

    return NextResponse.json({ success: true, role: newRole });
  } catch (error) {
    console.error("POST /api/roles error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
