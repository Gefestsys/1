"use client";

const CRYPTO_ICONS = [
  { id: "bitcoin", src: "/images/bitcoin.svg", alt: "Bitcoin", top: "12%", left: "12%" },
  { id: "ethereum", src: "/images/ethereum.svg", alt: "Ethereum", top: "22%", left: "82%" },
  { id: "tether", src: "/images/tether.svg", alt: "Tether", top: "22%", left: "31%" },
  { id: "bnb", src: "/images/bnb.svg", alt: "BNB", top: "15%", left: "62%" },
  { id: "sol", src: "/images/sol.svg", alt: "Solana", top: "37%", left: "5%" },
  { id: "xrp", src: "/images/xrp.svg", alt: "XRP", top: "42%", left: "88%" },
];

const ANIMATION_STYLES = `
  @keyframes crypto-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  @keyframes crypto-pulse {
    0%, 100% { opacity: 0.15; }
    50% { opacity: 0.05; }
  }

  .crypto-icon {
    animation: crypto-float 5s ease-in-out infinite, crypto-pulse 7s ease-in-out infinite;
  }

  .crypto-icon-bitcoin { animation-delay: 0s; }
  .crypto-icon-ethereum { animation-delay: 0.5s; }
  .crypto-icon-tether { animation-delay: 1s; }
  .crypto-icon-bnb { animation-delay: 1.5s; }
  .crypto-icon-sol { animation-delay: 2s; }
  .crypto-icon-xrp { animation-delay: 2.5s; }
`;

export default function CryptoIconsPanel() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{ANIMATION_STYLES}</style>
      {CRYPTO_ICONS.map((icon) => (
        <div
          key={icon.id}
          className={`absolute hover:opacity-50 transition-opacity duration-300 crypto-icon crypto-icon-${icon.id}`}
          style={{
            top: icon.top,
            left: icon.left,
            width: "27px",
            height: "27px",
            filter: "brightness(0) invert(1) drop-shadow(0 0 2px rgba(34, 197, 94, 0.5))",
          }}
        >
          <img
            src={icon.src}
            alt={icon.alt}
            className="w-full h-full object-contain"
            draggable="false"
          />
        </div>
      ))}
    </div>
  );
}
