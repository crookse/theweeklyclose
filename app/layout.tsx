import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { env } from "process";
import { concatClassNames } from "@/components/utils/classNames.ts";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: env.NODE_ENV === "development"
    ? "[d] The Weekly Close | Eric Crooks"
    : "The Weekly Close | Eric Crooks",
  description: "The Weekly Close: build and export weekly trading recap graphs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div
          className={concatClassNames(
            montserrat.className,
            "min-h-screen min-w-[350px]",
          )}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
