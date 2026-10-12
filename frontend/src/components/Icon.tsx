const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  route: 'M5 5h11a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h11 M5 2v6 M19 18v5',
  shield: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z M8 12l3 3 5-6',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  wind: 'M3 8h12a3 3 0 1 0-3-3 M3 12h16a3 3 0 1 1-3 3 M3 16h5',
  rain: 'M7 14H6a4 4 0 0 1 0-8 6 6 0 0 1 11-1 4 4 0 0 1 1 9 M8 17l-1 3 M13 17l-1 3 M18 17l-1 3',
  snow: 'M12 2v20 M3 7l18 10 M3 17 21 7 M9 4l3 3 3-3 M9 20l3-3 3 3',
  load: 'M4 7l8-4 8 4v11l-8 4-8-4z M4 7l8 4 8-4 M12 11v11 M8 5l8 4',
  book: 'M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1z M12 5v15',
  check: 'M5 12l4 4L19 6',
  refresh: 'M20 7V2l-3 3a8 8 0 1 0 3 11 M20 7h-5',
  info: 'M12 11v6 M12 7v.1 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
