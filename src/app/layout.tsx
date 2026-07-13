import "./globals.css";
import Nav from "@/components/Nav";
import { auth } from "@/auth";

export const metadata = { title: "资产看板" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="zh">
      <body className="bg-gray-50 min-h-screen">
        {session?.user && <Nav />}
        <main className="max-w-6xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
