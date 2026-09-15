export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" className="brand__mark">
      <circle cx="18" cy="18" r="17" fill="var(--leaf-soft)" />
      <g fill="none" stroke="var(--leaf)" strokeWidth="2.6" strokeLinecap="round">
        <path d="M18 5.2A12.8 12.8 0 0 1 29.1 11.6" />
        <path d="M29.9 24.2A12.8 12.8 0 0 1 18 30.8" />
        <path d="M6.9 11.6A12.8 12.8 0 0 0 6.9 24.4" opacity="0.45" />
      </g>
      <path
        d="M18.2 24.4c-2.9 0-5.2-2.3-5.2-5.2 0-3.6 3.4-6.8 9.5-8.2-.6 7.6-2.3 13.4-4.3 13.4z"
        fill="var(--leaf)"
      />
    </svg>
  )
}
