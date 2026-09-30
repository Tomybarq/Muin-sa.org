import { getTranslations } from "next-intl/server";
import ReportsClient from "@/components/portal/ReportsClient";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <ReportsClient locale={locale} />;
}
