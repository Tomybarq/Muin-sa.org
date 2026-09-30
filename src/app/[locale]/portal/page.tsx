import { getSession } from "@/lib/auth";
import DashboardClient from "@/components/portal/DashboardClient";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function DashboardPage(props: PageProps) {
  const { locale } = await props.params;
  const session = await getSession();
  const userName = session?.name || "User";

  return <DashboardClient userName={userName} locale={locale} />;
}
