import React from 'react';

export default function IPhoneMockup() {
  return (
    <div className="relative w-full h-auto aspect-[391/800]">
      <img
        className="absolute inset-0 w-full h-full object-contain"
        src="/images/Iphone.png"
        alt="iPhone 16 Pro - Black Titanium - Portrait"
      />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[2%] flex w-[32%] items-center justify-center">
        <div className="w-full h-[3px] sm:h-[3.5px] md:h-[4px] rounded-full bg-white"></div>
      </div>
    </div>
  );
}
