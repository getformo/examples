"use client";

import Link from "next/link";
import { WalletButton } from "@/components/wallet/WalletButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NetworkSwitcher } from "@/components/wallet/NetworkSwitcher";
import { FormoStatus } from "@/components/FormoStatus";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className="bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-xl font-bold text-transparent">
            Formo Solana
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <FormoStatus />
          <NetworkSwitcher />
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
