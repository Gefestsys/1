import React from "react";
import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}): JSX.Element => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-2 md:auto-rows-[12.6rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}): JSX.Element => {
  return (
    <div
      className={cn(
        "group/bento row-span-1 relative overflow-hidden flex flex-col justify-between space-y-4 rounded-lg border border-foreground/20 bg-black p-4 transition duration-200",
        className,
      )}
    >
      {/* Glow background - centered, non-interactive, does not affect layout */}
      <div className="bento-glow absolute inset-0 pointer-events-none z-0" aria-hidden="true" />

      <div className="transition duration-200 relative z-10">
        <div className="card-title-font text-neutral-400 dark:text-neutral-200">
          {title}
        </div>
        <div className="card-body-font text-xs font-normal text-neutral-400 dark:text-neutral-300 mt-2">
          {description}
        </div>
      </div>
      {header}
    </div>
  );
};
