
"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function ComingSoonBanner() {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
      "relative w-full p-3 text-center text-white",
      "bg-gradient-to-r from-red-500 via-rose-500 to-red-600", 
      "shadow-md print:hidden transition-opacity duration-300 ease-out",
      !isVisible && "opacity-0"
    )}>
      <p className="font-semibold text-sm sm:text-base">
        🚀 Talkzii 1.0 is Coming Soon! Get ready for an even better experience. ✨
      </p>
      <button
        onClick={handleClose}
        aria-label="Dismiss coming soon banner"
        className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
