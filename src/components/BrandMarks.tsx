import { cn } from "@/lib/utils";

/** Line-art tea leaf: one leaf with a central vein and three pairs of side veins. */
export function TeaLeafMark({ className }: { className?: string | undefined }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-12", className)}
      aria-hidden
    >
      <path d="M13 51C10 31 25 12 53 11C54 36 37 53 13 51Z" fill="currentColor" fillOpacity={0.12} />
      <path d="M13 51C25 39 35 29 47 17" />
      <path d="M22.5 41.5L21 32M22.5 41.5L32 43" />
      <path d="M29.5 34.5L29.5 25M29.5 34.5L39 35.5" />
      <path d="M36.5 27.5L38 19.5M36.5 27.5L44 27" />
      <path d="M13 51L7 57" />
    </svg>
  );
}

/** Line-art coffee bean: tilted oval with the characteristic S-shaped crease. */
export function CoffeeBeanMark({ className }: { className?: string | undefined }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-12", className)}
      aria-hidden
    >
      <g transform="rotate(-32 32 32)">
        <ellipse cx="32" cy="32" rx="16.5" ry="23" fill="currentColor" fillOpacity={0.12} />
        <path d="M32 9.5C23 19 41 43 32 54.5" />
      </g>
    </svg>
  );
}
