import "./globals.css";
import { AppProviders } from "../src/app/providers/AppProviders";

export const metadata = {
  title: "CollabResearch",
  description: "Plataforma de Gerenciamento de Iniciacao Cientifica",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
