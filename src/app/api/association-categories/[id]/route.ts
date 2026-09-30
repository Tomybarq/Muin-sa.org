import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.roleType !== "superadmin" && session.roleType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Check if category is used by any association
    const associatedCount = await prisma.association.count({
      where: { categoryId },
    });
    if (associatedCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category because it is linked to associations" },
        { status: 400 }
      );
    }

    await prisma.associationCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/association-categories/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
