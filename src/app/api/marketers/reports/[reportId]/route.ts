import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId: rawId } = await params;
    const reportId = Number(rawId);

    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const body = await request.json();
    const { description, reportDate, attachment } = body;

    const existingReport = await prisma.marketerMonthlyReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "التقرير غير موجود" }, { status: 404 });
    }

    let attachmentId = existingReport.attachmentId;

    // Handle updating attachment
    if (attachment && attachment.id && attachment.id !== existingReport.attachmentId) {
      // A different pre-uploaded attachment was chosen — link it and delete old
      attachmentId = attachment.id;
      if (existingReport.attachmentId) {
        await prisma.attachment.delete({
          where: { id: existingReport.attachmentId },
        }).catch(() => {});
      }
    } else if (attachment && attachment.id && attachment.id === existingReport.attachmentId) {
      // Same attachment, no change needed
      attachmentId = existingReport.attachmentId;
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
          resId: existingReport.marketerId,
          checksum,
        },
      });

      attachmentId = createdAttachment.id;

      // Delete old attachment if exists
      if (existingReport.attachmentId) {
        await prisma.attachment.delete({
          where: { id: existingReport.attachmentId },
        }).catch(() => {});
      }
    }

    const updatedReport = await prisma.marketerMonthlyReport.update({
      where: { id: reportId },
      data: {
        description: description || existingReport.description,
        reportDate: reportDate ? new Date(reportDate) : existingReport.reportDate,
        attachmentId,
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

    return NextResponse.json({ report: updatedReport, message: "تم تحديث التقرير بنجاح" });
  } catch (error: any) {
    console.error("Failed to update marketer report:", error);
    return NextResponse.json({ error: error?.message || "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId: rawId } = await params;
    const reportId = Number(rawId);

    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const report = await prisma.marketerMonthlyReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "التقرير غير موجود" }, { status: 404 });
    }

    await prisma.marketerMonthlyReport.delete({
      where: { id: reportId },
    });

    if (report.attachmentId) {
      await prisma.attachment.delete({
        where: { id: report.attachmentId },
      }).catch(() => {});
    }

    return NextResponse.json({ message: "تم حذف التقرير بنجاح" });
  } catch (error: any) {
    console.error("Failed to delete marketer report:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
