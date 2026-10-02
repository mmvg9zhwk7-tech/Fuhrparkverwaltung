// Rahmen für Login und Passwort-Seiten: zentrierte Karte, kein App-Menü.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <p className="mb-6 text-lg font-bold tracking-tight text-brand">
        🚗 Fuhrparkverwaltung
      </p>
      {children}
    </main>
  );
}
