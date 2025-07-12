
"use client";

import { cn } from '@/lib/utils';

export function ComingSoonBanner() {
  return (
    <div className={cn(
      "relative w-full p-3 text-center text-white",
      "bg-gradient-to-r from-red-500 via-rose-500 to-red-600", 
      "shadow-md print:hidden"
    )}>
      <p className="font-semibold text-sm sm:text-base">
        🚀 Talkzii 1.0 is Coming Soon! Get ready for an even better experience. ✨
      </p>
    </div>
  );
}
