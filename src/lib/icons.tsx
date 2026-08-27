/* Inline stroke icons — no icon dependency. 24x24, currentColor. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const S = (p: P) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const IcoPhone = (p: P) => (
  <svg {...S(p)}>
    <path d="M6.5 3h3l1.5 5-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 5 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 4.5 5a2 2 0 0 1 2-2Z" />
  </svg>
);
export const IcoChat = (p: P) => (
  <svg {...S(p)}>
    <path d="M4 5h16v11H8l-4 4V5Z" />
  </svg>
);
export const IcoMail = (p: P) => (
  <svg {...S(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
export const IcoUsers = (p: P) => (
  <svg {...S(p)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M16 5.5a3 3 0 0 1 0 5.5M21 20c0-2.6-1.7-4.9-4-5.7" />
  </svg>
);
export const IcoHome = (p: P) => (
  <svg {...S(p)}>
    <path d="M4 11 12 4l8 7" />
    <path d="M6 10v9h12v-9" />
  </svg>
);
export const IcoTarget = (p: P) => (
  <svg {...S(p)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const IcoCheckCircle = (p: P) => (
  <svg {...S(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5 5-5" />
  </svg>
);
export const IcoCheck = (p: P) => (
  <svg {...S(p)}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);
export const IcoHeart = (p: P) => (
  <svg {...S(p)}>
    <path d="M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9Z" />
  </svg>
);
export const IcoBars = (p: P) => (
  <svg {...S(p)}>
    <path d="M5 20V10M12 20V4M19 20v-7" />
  </svg>
);
export const IcoBell = (p: P) => (
  <svg {...S(p)}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);
export const IcoMenu = (p: P) => (
  <svg {...S(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IcoChevron = (p: P) => (
  <svg {...S(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const IcoPin = (p: P) => (
  <svg {...S(p)}>
    <path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
export const IcoCalendar = (p: P) => (
  <svg {...S(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
export const IcoId = (p: P) => (
  <svg {...S(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="12" r="2" />
    <path d="M14 10h4M14 14h4M6 16c.5-1.5 4.5-1.5 5 0" />
  </svg>
);
export const IcoBook = (p: P) => (
  <svg {...S(p)}>
    <path d="M5 4h11a2 2 0 0 1 2 2v13H7a2 2 0 0 0-2 2V4Z" />
    <path d="M5 19a2 2 0 0 0 2 2h11" />
  </svg>
);
export const IcoShare = (p: P) => (
  <svg {...S(p)}>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
  </svg>
);
export const IcoLink = (p: P) => (
  <svg {...S(p)}>
    <path d="M9 15 15 9" />
    <path d="M11 6.5 13 4.5a3.5 3.5 0 0 1 5 5l-2 2M13 17.5l-2 2a3.5 3.5 0 0 1-5-5l2-2" />
  </svg>
);
export const IcoCopy = (p: P) => (
  <svg {...S(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
  </svg>
);
export const IcoCar = (p: P) => (
  <svg {...S(p)}>
    <path d="M4 14 6 8h12l2 6" />
    <path d="M3 14h18v4H3zM7 18v2M17 18v2" />
  </svg>
);
export const IcoUser = (p: P) => (
  <svg {...S(p)}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
  </svg>
);
export const IcoShield = (p: P) => (
  <svg {...S(p)}>
    <path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" />
  </svg>
);
export const IcoInfo = (p: P) => (
  <svg {...S(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
export const IcoLogout = (p: P) => (
  <svg {...S(p)}>
    <path d="M15 4h4v16h-4" />
    <path d="M10 8 6 12l4 4M6 12h11" />
  </svg>
);
export const IcoQr = (p: P) => (
  <svg {...S(p)}>
    <rect x="4" y="4" width="6" height="6" />
    <rect x="14" y="4" width="6" height="6" />
    <rect x="4" y="14" width="6" height="6" />
    <path d="M14 14h3v3h-3zM20 14v6M17 20h3" />
  </svg>
);
export const IcoEdit = (p: P) => (
  <svg {...S(p)}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="m14 6 4 4" />
  </svg>
);
export const IcoSearch = (p: P) => (
  <svg {...S(p)}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4-4" />
  </svg>
);
export const IcoFacebook = (p: P) => (
  <svg {...S(p)} strokeWidth={0} fill="currentColor">
    <path d="M13 22v-8h2.7l.5-3.5H13V8.2c0-1 .3-1.7 1.8-1.7H16V3.3C15.6 3.2 14.5 3 13.3 3 10.7 3 9 4.6 9 7.5v3H6.5V14H9v8h4Z" />
  </svg>
);
export const IcoX = (p: P) => (
  <svg {...S(p)} strokeWidth={0} fill="currentColor">
    <path d="M17.5 3H21l-7.3 8.3L22 21h-6.4l-5-6.1L4.8 21H2l7.8-8.9L2 3h6.5l4.5 5.6L17.5 3Zm-1.1 16h1.8L7.7 4.8H5.8L16.4 19Z" />
  </svg>
);
export const IcoTruth = (p: P) => (
  <svg {...S(p)} strokeWidth={0} fill="currentColor">
    <path d="M4 4h16v4h-6v12h-4V8H4V4Z" />
  </svg>
);
export const IcoStar = (p: P) => (
  <svg {...S(p)}>
    <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3Z" />
  </svg>
);
export const IcoPlus = (p: P) => (
  <svg {...S(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IcoWarn = (p: P) => (
  <svg {...S(p)}>
    <path d="M12 4 3 19h18L12 4Z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);
