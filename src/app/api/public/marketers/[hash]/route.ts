import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decodeId } from "@/lib/idObfuscator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;
    const marketerId = decodeId(hash);

    if (!marketerId) {
      return NextResponse.json({ error: "Invalid marketer reference" }, { status: 400 });
    }

    const marketer = await prisma.marketer.findUnique({
      where: { id: marketerId },
      include: {
        governorate: true,
        city: true,
        image: {
          select: { id: true, originalName: true, mimetype: true },
        },
        associations: {
          include: {
            association: {
              select: { id: true, name: true, phone: true, email: true },
            },
          },
        },
      },
    });

    if (!marketer || !marketer.isActive || marketer.isArchived) {
      return NextResponse.json({ error: "Marketer profile not found or inactive" }, { status: 404 });
    }

    const publicProfile = {
      hash,
      name: marketer.name,
      type: marketer.type,
      email: marketer.email,
      phone: marketer.phone,
      governorate: marketer.governorate ? { name: marketer.governorate.name, nameAr: marketer.governorate.nameAr } : null,
      city: marketer.city ? { name: marketer.city.name, nameAr: marketer.city.nameAr } : null,
      avatarUrl: marketer.imageId ? `/api/public/marketers/${hash}/avatar` : null,
      createdAt: marketer.createdAt,
      associations: marketer.associations.map((ma) => ({
        id: ma.association.id,
        name: ma.association.name,
        phone: ma.association.phone,
        email: ma.association.email,
        phoneNumbers: ma.phoneNumbers || [],
      })),
    };

    return NextResponse.json({ marketer: publicProfile });
  } catch (err: any) {
    console.error("[PUBLIC MARKETER GET ERROR]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
