import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decodeId } from "@/lib/idObfuscator";
import crypto from "crypto";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const marketerId = decodeId(rawId);

    if (!marketerId) {
      return NextResponse.json({ error: "Invalid marketer ID" }, { status: 400 });
    }

    const reports = await prisma.marketerMonthlyReport.findMany({
      where: { marketerId },
      include: {
        attachment: {
          select: {
            id: true,
            name: true,
            originalName: true,
            mimetype: true,
            fileSize: true,
          },
        },
      },
      orderBy: { reportDate: "desc" },
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("Failed to fetch marketer reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const marketerId = decodeId(rawId);

    if (!marketerId) {
      return NextResponse.json({ error: "Invalid marketer ID" }, { status: 400 });
    }

    const body = await request.json();
    const { description, reportDate, attachment } = body;

    if (!description || !reportDate) {
      return NextResponse.json({ error: "الوصف وتاريخ التقرير مطلوبان" }, { status: 400 });
    }

    let attachmentId: number | undefined = undefined;

    // Handle attachment: either pre-uploaded (has id) or inline base64 (has data)
    if (attachment && attachment.id) {
      // File was already uploaded via /api/attachments — just link it
      attachmentId = attachment.id;
    } else if (attachment && attachment.data) {
      let buffer: Buffer;
      if (typeof attachment.data === "string" && attachment.data.startsWith("data:")) {
        const base64Data = attachment.data.split(",")[1];
        buffer = Buffer.from(base64Data, "base64");
      } else if (typeof attachment.data === "string") {
        buffer = Buffer.from(attachment.data, "base64");
      } else {
        buffer = Buffer.from(attachment.data);
      }

      const checksum = `${Date.now()}_${crypto.createHash("sha256").update(buffer).digest("hex")}`;
      const filename = attachment.filename || attachment.name || "monthly_report.xlsx";

      const createdAttachment = await prisma.attachment.create({
        data: {
          name: filename,
          originalName: filename,
          mimetype: attachment.mimetype || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          fileSize: buffer.length,
          data: new Uint8Array(buffer),
          resModel: "MarketerMonthlyReport",
          resId: marketerId,
          checksum,
        },
      });

      attachmentId = createdAttachment.id;
    }

    const newReport = await prisma.marketerMonthlyReport.create({
      data: {
        marketerId,
        description,
        reportDate: new Date(reportDate),
        attachmentId: attachmentId ?? null,
      },
      include: {
        attachment: {
          select: {
            id: true,
            name: true,
            originalName: true,
            mimetype: true,
            fileSize: true,
          },
        },
      },
    });

    return NextResponse.json({ report: newReport, message: "تم إضافة التقرير الشهري بنجاح" }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create marketer report:", error);
    return NextResponse.json({ error: error?.message || "Failed to create report" }, { status: 500 });
  }
}
