import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    const roleId = parseInt(id);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: "Invalid Role ID" }, { status: 400 });
    }

    const { permissions, screenIds, name, nameAr } = await request.json();

    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.type === "superadmin") {
      return NextResponse.json({ error: "لا يمكن تعديل هذا الدور" }, { status: 400 });
    }

    const permsScreen = await prisma.screen.findUnique({
      where: { name: "settings-permissions" },
    });

    // Update role permissions in a transaction: delete existing and insert new
    await prisma.$transaction(async (tx) => {
      // Update role name if provided
      if (name && name.trim() !== "") {
        const uppercaseName = name.trim().toUpperCase().replace(/\s+/g, "_");
        
        // Check if name is already taken by another role
        const existing = await tx.role.findFirst({
          where: {
            name: uppercaseName,
            NOT: { id: roleId },
          },
        });
        if (existing) {
          throw new Error("Role name already exists");
        }

        await tx.role.update({
          where: { id: roleId },
          data: { 
            name: uppercaseName,
            nameAr: nameAr && nameAr.trim() !== "" ? nameAr.trim() : null
          },
        });
      } else if (nameAr !== undefined) {
        await tx.role.update({
          where: { id: roleId },
          data: { 
            nameAr: nameAr && nameAr.trim() !== "" ? nameAr.trim() : null
          },
        });
      }

      // Delete existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Insert new permissions
      if (Array.isArray(permissions)) {
        const activePermissions = permsScreen
          ? permissions.filter((p: { screenId: number }) => p.screenId !== permsScreen.id)
          : permissions;

        if (activePermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: activePermissions.map((p: { screenId: number; actions: string[] }) => ({
              roleId,
              screenId: p.screenId,
              actions: p.actions,
            })),
          });
        }
      } else if (Array.isArray(screenIds)) {
        const activeScreenIds = permsScreen
          ? screenIds.filter((screenId: number) => screenId !== permsScreen.id)
          : screenIds;

        if (activeScreenIds.length > 0) {
          await tx.rolePermission.createMany({
            data: activeScreenIds.map((screenId: number) => ({
              roleId,
              screenId,
              actions: [],
            })),
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/roles/[id] error:", error);
    if (error?.message === "Role name already exists") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
