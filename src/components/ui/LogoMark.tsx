import { cn } from "@/utils/cn";

export interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-beam/50 bg-beam/10 shadow-glow-sm",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 text-beam"
        aria-hidden="true"
        fill="none"
      >
        <path
          d="M8 5h9M12.5 5v14"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}