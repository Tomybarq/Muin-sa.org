import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function SettingsRootPage(props: PageProps) {
  const { locale } = await props.params;
  redirect(`/${locale}/portal/settings/general`);
}
