import { AppHeader } from "@/components/app-header";
import { requireProfile } from "@/lib/auth/profile";

// Alle Seiten in (app) sind nur mit aktivem Konto erreichbar.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await requireProfile();

  return (
    <>
      <AppHeader profile={profile} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
    </>
  );
}
