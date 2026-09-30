import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { associationSchema } from "@/lib/zodSchemas";
import { decodeId } from "@/lib/idObfuscator";
import { logAudit } from "@/lib/auditLogger";

async function hasPermission(userId: number, action: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            where: { screen: { path: "/portal/associations" } },
            include: { screen: true }
          }
        }
      }
    }
  });

  if (!user) return false;
  if (user.role.type === "superadmin") return true;

  const perm = user.role.permissions[0];
  if (!perm) return false;

  if (action === "unarchive") {
    return perm.actions.includes("unarchive") || perm.actions.includes("archive");
  }
  return perm.actions.includes(action);
}

import { checkEmailUniqueness } from "@/lib/checkEmailUniqueness";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await hasPermission(session.userId, "view");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const assocId = decodeId(id);
    if (!assocId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const association = await prisma.association.findUnique({
      where: { id: assocId },
      include: {
        category: true,
        governorate: true,
        logo: {
          select: {
            id: true,
            originalName: true,
            mimetype: true,
            fileSize: true,
            width: true,
            height: true,
          }
        },
        city: {
          include: { governorate: true }
        },
        managerUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!association) {
      return NextResponse.json({ error: "Association not found" }, { status: 404 });
    }

    const { logo, ...rest } = association;
    return NextResponse.json({ 
      association: { 
        ...rest, 
        logoUrl: logo ? `/api/attachments/${logo.id}/file` : null, 
        logo 
      } 
    });
  } catch (error) {
    console.error("GET /api/associations/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await hasPermission(session.userId, "edit");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const assocId = decodeId(id);
    if (!assocId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const result = associationSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Validation error";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const {
      name,
      manager,
      managerId,
      phone,
      email,
      governorateId,
      cityId,
      categoryId,
      donationUrl,
      logoId
    } = result.data;

    if (email) {
      const emailCheck = await checkEmailUniqueness(email, { associationId: assocId }, body.locale || "ar");
      if (emailCheck.inUse) {
        return NextResponse.json({ error: emailCheck.message }, { status: 400 });
      }
    }

    // Check if category exists
    const categoryExists = await prisma.associationCategory.findUnique({
      where: { id: categoryId }
    });
    if (!categoryExists) {
      return NextResponse.json({ error: "Selected category does not exist" }, { status: 400 });
    }

    // Check if governorate exists
    const governorateExists = await prisma.governorate.findUnique({
      where: { id: governorateId }
    });
    if (!governorateExists) {
      return NextResponse.json({ error: "Selected governorate does not exist" }, { status: 400 });
    }

    // Check if city exists
    const cityExists = await prisma.city.findUnique({
      where: { id: cityId }
    });
    if (!cityExists) {
      return NextResponse.json({ error: "Selected city does not exist" }, { status: 400 });
    }

    // Check manager user
    if (managerId) {
      const userExists = await prisma.user.findUnique({
        where: { id: managerId }
      });
      if (!userExists) {
        return NextResponse.json({ error: "Selected manager user does not exist" }, { status: 400 });
      }
    }

    const association = await prisma.association.update({
      where: { id: assocId },
      data: {
        name,
        manager,
        managerId: managerId || null,
        phone,
        email,
        governorateId,
        cityId,
        categoryId,
        donationUrl: donationUrl || null,
        logoId: logoId || null
      },
      include: {
        category: true,
        governorate: true,
        logo: {
          select: {
            id: true,
            originalName: true,
            mimetype: true,
            fileSize: true,
            width: true,
            height: true,
          }
        },
        city: {
          include: { governorate: true }
        },
        managerUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const { logo, ...rest } = association;
    return NextResponse.json({ association: { ...rest, logoUrl: logo ? `/api/attachments/${logo.id}/file` : null, logo } });
  } catch (error) {
    console.error("PUT /api/associations/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await hasPermission(session.userId, "delete");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const assocId = decodeId(id);
    if (!assocId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await logAudit({
      userId: session.userId,
      action: "DELETE",
      screen: "associations",
      recordId: assocId,
    });

    // Delete association
    await prisma.association.delete({
      where: { id: assocId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/associations/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await hasPermission(session.userId, "edit");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const assocId = decodeId(id);
    if (!assocId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { isActive, isArchived } = body;

    const dataToUpdate: { isActive?: boolean; isArchived?: boolean } = {};
    if (typeof isActive === "boolean") dataToUpdate.isActive = isActive;
    if (typeof isArchived === "boolean") dataToUpdate.isArchived = isArchived;

    const association = await prisma.association.update({
      where: { id: assocId },
      data: dataToUpdate,
    });

    let actionName = "UPDATE";
    if (typeof isArchived === "boolean") actionName = isArchived ? "ARCHIVE" : "UNARCHIVE";
    else if (typeof isActive === "boolean") actionName = isActive ? "ACTIVATE" : "DEACTIVATE";

    await logAudit({
      userId: session.userId,
      action: actionName,
      screen: "associations",
      recordId: assocId,
      details: { name: association.name, ...dataToUpdate },
    });

    return NextResponse.json({ association });
  } catch (error) {
    console.error("PATCH /api/associations/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
