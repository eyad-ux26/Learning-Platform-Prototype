"use client";

import type { ReactNode } from "react";
import type { Device } from "@/domain/types";
import { cn } from "@/components/ui";

/**
 * The window a product screen is drawn in. From lg it sits inside a device (laptop by default) so the preview reads
 * as a live product; below lg the phone itself is the device, so only the plain window remains.
 */
export function DeviceFrame({ device = "laptop", bar, label, className, children }: { device?: Device; bar?: ReactNode; label: string; className?: string; children: ReactNode }) {
  const laptop = device === "laptop";
  const handheld = !laptop;
  return (
    <div role="group" aria-label={label} className={cn(device === "phone" && "lg:mx-auto lg:max-w-[400px]", device === "tablet" && "lg:mx-auto lg:max-w-[680px]", className)}>
      <div
        className={cn(
          "lg:relative lg:border lg:border-[#4a4a58] lg:bg-[#0b0b0f] lg:shadow-[0_18px_40px_rgba(0,0,0,0.45)]",
          laptop && "lg:rounded-t-[18px] lg:rounded-b-md lg:px-3 lg:pb-3 lg:pt-6",
          device === "tablet" && "lg:rounded-[30px] lg:p-5 lg:pt-7",
          device === "phone" && "lg:rounded-[44px] lg:px-3 lg:pb-6 lg:pt-11",
        )}
      >
        {/* Camera: a dot on a laptop or tablet, a pill on a phone */}
        <span aria-hidden className={cn("absolute inset-x-0 mx-auto hidden rounded-full bg-[#26262e] lg:block", device === "phone" ? "top-3.5 h-5 w-24" : "top-2.5 h-1.5 w-1.5")} />
        <div className={cn("rounded-xl border border-line-strong bg-pv-bg p-1.5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]", "lg:rounded-md lg:border-0", handheld && "lg:rounded-[30px] lg:p-0 lg:pt-1")}>
          <div className={cn("flex items-center justify-between gap-2 px-2 pb-1.5 pt-0.5", handheld && "lg:hidden")}>
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-[#d4d8e0]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#d4d8e0]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#d4d8e0]" />
            </div>
            {bar}
          </div>
          {children}
        </div>
      </div>
      {laptop && (
        <div aria-hidden className="relative -mx-[5%] hidden h-3.5 rounded-b-[14px] border border-t-0 border-[#4a4a58] bg-gradient-to-b from-[#34343f] to-[#18181e] lg:block">
          <span className="absolute inset-x-0 top-0 mx-auto h-1.5 w-24 rounded-b-md bg-[#0b0b0f]" />
        </div>
      )}
    </div>
  );
}
