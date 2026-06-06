interface ExcelIconProps {
  className?: string;
}

/**
 * Microsoft Excel icon from Icons8 (licensed).
 * https://icons8.de/icon/24032/ms-excel
 */
export function ExcelIcon({ className }: ExcelIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 26 26"
      width="20"
      height="20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path fillRule="nonzero" d="M12.875 1l-.094.03-11 2.44-.78.186v18.688l.78.187 11 2.44.095.03H15v-3h10V4H15V1h-2.125zM13 3.03v19.94L3 20.78V5.22l10-2.19zM15 6h8v14h-8v-2h2v-2h-2v-1h2v-2h-2v-1h2v-2h-2V9h2V7h-2V6zm3 1v2h4V7h-4zm-6.844 1l-2.28.28-1.25 2.69c-.134.385-.23.678-.282.874h-.032c-.078-.324-.152-.606-.25-.844l-.625-2.313-2.125.25L4.22 9 6 13l-2 4 2.156.25.875-2.47c.107-.31.193-.565.22-.717h.03c.06.324.1.566.157.687l1.344 2.938 2.44.312-2.658-5.03L11.156 8zM18 10v2h4v-2h-4zm0 3v2h4v-2h-4zm0 3v2h4v-2h-4z" />
    </svg>
  );
}
