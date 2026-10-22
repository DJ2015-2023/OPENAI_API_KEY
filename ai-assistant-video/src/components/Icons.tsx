import React from 'react';

type P = {size?: number; style?: React.CSSProperties};

const Tile: React.FC<P & {bg: string; radius?: string; children: React.ReactNode; glow: string}> = ({
  size = 140,
  bg,
  radius = '30%',
  children,
  glow,
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 0 ${size * 0.35}px ${glow}, inset 0 ${size * 0.04}px ${size * 0.08}px rgba(255,255,255,0.35)`,
      ...style,
    }}
  >
    {children}
  </div>
);

export const WhatsAppIcon: React.FC<P> = ({size = 140, style}) => (
  <Tile size={size} bg="linear-gradient(160deg,#5dfc8d,#1ebe57)" radius="50%" glow="rgba(37,211,102,0.6)" style={style}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 64 64">
      <path
        d="M32 6C17.6 6 6 17.4 6 31.5c0 4.9 1.4 9.5 3.9 13.4L6.5 58l13.5-3.4c3.6 1.9 7.7 3 12 3 14.4 0 26-11.4 26-25.5S46.4 6 32 6z"
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M24.2 19.5c-.7-1.5-1.4-1.5-2.1-1.5h-1.8c-.6 0-1.6.2-2.5 1.2s-3.3 3.2-3.3 7.8 3.4 9 3.8 9.6c.5.6 6.5 10.4 16.1 14.2 8 3.1 9.6 2.5 11.4 2.3 1.7-.2 5.6-2.3 6.4-4.5.8-2.2.8-4.1.5-4.5-.2-.4-.9-.6-1.8-1.1s-5.6-2.7-6.4-3c-.9-.3-1.5-.5-2.1.5-.6.9-2.4 3-3 3.6-.5.6-1.1.7-2 .2-.9-.5-4-1.5-7.6-4.7-2.8-2.5-4.7-5.6-5.3-6.5-.5-.9-.1-1.4.4-1.9.4-.4.9-1.1 1.4-1.6.5-.5.6-.9.9-1.5.3-.6.2-1.2-.1-1.6-.1-.6-2-5.2-2.8-7.1z"
        fill="#fff"
      />
    </svg>
  </Tile>
);

export const TelegramIcon: React.FC<P> = ({size = 140, style}) => (
  <Tile size={size} bg="linear-gradient(160deg,#5ccfff,#1c93e3)" radius="50%" glow="rgba(42,171,238,0.6)" style={style}>
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 64 64" style={{marginLeft: -size * 0.05}}>
      <path d="M8 30.5 52 13.6c2-.8 3.8.5 3.2 3.6l-7.5 35.4c-.5 2.5-2 3.1-4.1 1.9L32.2 46l-5.5 5.3c-.6.6-1.1 1.1-2.3 1.1l.8-11.6 21.2-19.1c.9-.8-.2-1.3-1.4-.5L18.8 37.7 7.6 34.2c-2.4-.8-2.5-2.4.4-3.7z" fill="#fff" />
    </svg>
  </Tile>
);

export const InstagramIcon: React.FC<P> = ({size = 140, style}) => (
  <Tile
    size={size}
    bg="radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)"
    glow="rgba(214,36,159,0.6)"
    style={style}
  >
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 64 64">
      <rect x="8" y="8" width="48" height="48" rx="14" fill="none" stroke="#fff" strokeWidth="5" />
      <circle cx="32" cy="32" r="11" fill="none" stroke="#fff" strokeWidth="5" />
      <circle cx="46" cy="18" r="3.4" fill="#fff" />
    </svg>
  </Tile>
);

export const VKIcon: React.FC<P> = ({size = 140, style}) => (
  <Tile size={size} bg="linear-gradient(160deg,#3b9bff,#0062e0)" glow="rgba(0,119,255,0.6)" style={style}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 64 64">
      <path
        d="M34.6 47C17.8 47 8.2 35.5 7.8 16.3h8.4c.3 14.1 6.5 20 11.4 21.3V16.3h7.9v12.1c4.9-.5 10-6 11.7-12.1h7.9c-1.3 7.5-6.8 13-10.7 15.3 3.9 1.8 10.2 6.6 12.6 15.4h-8.7c-1.9-5.9-6.5-10.4-12.8-11V47h-1z"
        fill="#fff"
      />
    </svg>
  </Tile>
);

export const WebIcon: React.FC<P> = ({size = 140, style}) => (
  <Tile size={size} bg="linear-gradient(160deg,#b28bff,#6a3df0)" radius="50%" glow="rgba(141,92,255,0.6)" style={style}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth="4">
      <circle cx="32" cy="32" r="24" />
      <ellipse cx="32" cy="32" rx="10" ry="24" />
      <path d="M8 32h48M12 20h40M12 44h40" />
    </svg>
  </Tile>
);

export const CHANNELS = [
  {name: 'WhatsApp', Icon: WhatsAppIcon, color: '#25D366'},
  {name: 'Telegram', Icon: TelegramIcon, color: '#2AABEE'},
  {name: 'Instagram', Icon: InstagramIcon, color: '#E1306C'},
  {name: 'ВКонтакте', Icon: VKIcon, color: '#0077FF'},
  {name: 'Сайт', Icon: WebIcon, color: '#8d5cff'},
];

export const BoltIcon = ({size = 64, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill={color} />
  </svg>
);
export const FormIcon = ({size = 64, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <rect x="4" y="3" width="16" height="18" rx="3" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);
export const CalendarIcon = ({size = 64, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
    <path d="m9 15 2 2 4-4" />
  </svg>
);
export const ChartIcon = ({size = 64, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20h18" />
    <path d="m4 16 5-5 4 3 7-8" />
    <path d="M15 6h5v5" />
  </svg>
);
