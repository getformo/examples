import { type ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

function LogoBanner() {
  return (
    <div className="flex items-center gap-4 mb-10">
      <a href="https://formo.so" target="_blank" rel="noopener noreferrer" aria-label="Formo Analytics">
        <img src="/logo-formo.svg" alt="Formo" className="h-7 w-auto brightness-0 invert opacity-90 hover:opacity-100 transition-opacity" />
      </a>
      <span className="text-neutral-600 font-light text-xl select-none">×</span>
      <a href="https://openfort.io" target="_blank" rel="noopener noreferrer" aria-label="Openfort">
        <img src="/logo-openfort.png" alt="Openfort" className="h-7 w-auto brightness-0 invert opacity-90 hover:opacity-100 transition-opacity" />
      </a>
      <span className="text-neutral-600 font-light text-xl select-none">×</span>
      <a href="https://aave.com" target="_blank" rel="noopener noreferrer" aria-label="Aave">
        <img src="/logo-aave.png" alt="Aave" className="h-5 w-auto brightness-0 invert opacity-90 hover:opacity-100 transition-opacity" />
      </a>
    </div>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-black/95 flex justify-center p-4 font-figtree">
      <div className="w-full max-w-4xl mx-auto text-center flex flex-col items-center pt-10">
        <LogoBanner />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Openfort + Aave Example
        </h1>
        <p className="text-neutral-400 text-base mb-12">
          Openfort embedded wallet + Aave supply/withdraw, with automatic event tracking via the Formo SDK.
        </p>
        {children}
      </div>
    </div>
  );
}