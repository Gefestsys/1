"use client";

import { useState } from "react";

export default function ClientNavHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 h-[68px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center rounded">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
              <path d="M14 17H4L8 13H12L21 4H27L14 17Z" fill="#FAFAFA"/>
              <path d="M15 20V18L28 5V7L15 20Z" fill="#FAFAFA"/>
              <path d="M15 24V22L28 9V11L15 24Z" fill="#FAFAFA"/>
              <path d="M15 28V26L20 21V23L15 28Z" fill="#FAFAFA"/>
            </svg>
          </div>
          <span className="text-xl font-semibold leading-none bg-gradient-to-r from-foreground via-muted-foreground to-muted-foreground bg-clip-text text-transparent" style={{textShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'}}>SpikeTrading</span>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden lg:flex items-center gap-0">
            <div className="px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors">
              <span className="text-sm font-medium">Product</span>
            </div>
            <div className="px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors">
              <span className="text-sm font-medium">Features</span>
            </div>
            <div className="px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors">
              <span className="text-sm font-medium">Technologies</span>
            </div>
            <div className="px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors">
              <span className="text-sm font-medium">About</span>
            </div>
          </nav>

          <div className="hidden sm:flex items-center gap-4">
            <button className="p-2 rounded-md hover:bg-white/10 transition-colors" aria-label="Language selector">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FAFAFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12H22" stroke="#FAFAFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2V2Z" stroke="#FAFAFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="px-4 py-2 text-sm font-medium rounded-md bg-gradient-to-b from-primary to-primary-foreground/80 shadow-sm hover:shadow-md transition-all text-primary">
              Get started
            </button>
          </div>

          <button
            className="lg:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="#FAFAFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="#FAFAFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/20">
          <div className="px-4 py-4 space-y-2">
            <div className="px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors">
              <span className="text-sm font-medium">Product</span>
            </div>
            <div className="px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors">
              <span className="text-sm font-medium">Features</span>
            </div>
            <div className="px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors">
              <span className="text-sm font-medium">Technologies</span>
            </div>
            <div className="px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors">
              <span className="text-sm font-medium">About</span>
            </div>
            <div className="pt-2 border-t border-white/20 flex items-center gap-4">
              <button className="p-2 rounded-md hover:bg-white/10 transition-colors" aria-label="Language selector">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FAFAFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12H22" stroke="#FAFAFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2V2Z" stroke="#FAFAFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-gradient-to-b from-primary to-primary-foreground/80 shadow-sm hover:shadow-md transition-all text-primary">
                Get started
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
