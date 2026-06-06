interface ImportIconProps {
  className?: string;
}

/**
 * Import icon from Icons8 (licensed).
 * https://icons8.de/icon/set/import/all
 */
export function ImportIcon({ className }: ImportIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50 50"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <polyline strokeWidth="2" strokeLinecap="round" strokeMiterlimit="10" points="24.89,33.89 16,25 24.89,16.11" />
      <line strokeWidth="2" strokeLinecap="round" strokeMiterlimit="10" x1="48" y1="25" x2="16.555" y2="25" />
      <polyline strokeWidth="2.08" strokeLinejoin="round" strokeMiterlimit="10" points="32,39 32,49 2,49 2,1 32,1 32,11" />
    </svg>
  );
}
