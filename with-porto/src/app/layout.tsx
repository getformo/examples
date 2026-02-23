import "./globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { type ReactNode } from "react";
import { cookieToInitialState } from "wagmi";

import { getConfig } from "../wagmi";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Porto + Formo SDK Demo",
  description:
    "Example app demonstrating Porto wallet integration with Formo Analytics SDK",
};

export default async function RootLayout(props: { children: ReactNode }) {
  const initialState = cookieToInitialState(
    getConfig(),
    (await headers()).get("cookie")
  );
  return (
    <html lang="en">
      <body>
        <Providers initialState={initialState}>{props.children}</Providers>
      </body>
    </html>
  );
}
