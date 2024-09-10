import type { Metadata } from "next";
import { Roboto, Poppins } from "next/font/google";

import ClientLayout from './ClientLayout'
import Header from '@/components/header';
import Main from "@/components/main";
import "bootstrap/dist/css/bootstrap.css";
import "./globals.scss";
import styles from "./layout.module.scss";

// NOTE: Roboto was used to match the BUMED website
const robotoFont = Roboto({
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap'
});  

export const metadata: Metadata = {
  title: "BUMED IKM",
  description: "The Bureau of Medicine and Surgery (BUMED) Information & Knowledge Management system.",
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className={robotoFont.className}>
          <ClientLayout>
            <Header />
            <Main>{children}</Main>
            <footer></footer>
          </ClientLayout>
      </body>
    </html>
  );
}
