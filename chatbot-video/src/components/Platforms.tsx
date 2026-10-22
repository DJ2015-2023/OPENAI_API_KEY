import React from 'react';
import {C, DISPLAY} from '../theme';

const Tile: React.FC<{size: number; bg: string; children: React.ReactNode; round?: boolean}> = ({size, bg, children, round}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: round ? '50%' : size * 0.26,
      background: bg,
      border: `${Math.max(4, size * 0.035)}px solid ${C.ink}`,
      boxShadow: `${size * 0.05}px ${size * 0.05}px 0 ${C.ink}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    {children}
  </div>
);

export const Telegram = ({size = 200}) => (
  <Tile size={size} bg="#2AABEE" round>
    <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 64 64" style={{marginLeft: -size * 0.05}}>
      <path d="M8 30.5 52 13.6c2-.8 3.8.5 3.2 3.6l-7.5 35.4c-.5 2.5-2 3.1-4.1 1.9L32.2 46l-5.5 5.3c-.6.6-1.1 1.1-2.3 1.1l.8-11.6 21.2-19.1c.9-.8-.2-1.3-1.4-.5L18.8 37.7 7.6 34.2c-2.4-.8-2.5-2.4.4-3.7z" fill="#fff" />
    </svg>
  </Tile>
);

export const WhatsApp = ({size = 200}) => (
  <Tile size={size} bg="#25D366" round>
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 64 64">
      <path d="M32 6C17.6 6 6 17.4 6 31.5c0 4.9 1.4 9.5 3.9 13.4L6.5 58l13.5-3.4c3.6 1.9 7.7 3 12 3 14.4 0 26-11.4 26-25.5S46.4 6 32 6z" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinejoin="round" />
      <path
        d="M24.2 19.5c-.7-1.5-1.4-1.5-2.1-1.5h-1.8c-.6 0-1.6.2-2.5 1.2s-3.3 3.2-3.3 7.8 3.4 9 3.8 9.6c.5.6 6.5 10.4 16.1 14.2 8 3.1 9.6 2.5 11.4 2.3 1.7-.2 5.6-2.3 6.4-4.5.8-2.2.8-4.1.5-4.5-.2-.4-.9-.6-1.8-1.1s-5.6-2.7-6.4-3c-.9-.3-1.5-.5-2.1.5-.6.9-2.4 3-3 3.6-.5.6-1.1.7-2 .2-.9-.5-4-1.5-7.6-4.7-2.8-2.5-4.7-5.6-5.3-6.5-.5-.9-.1-1.4.4-1.9.4-.4.9-1.1 1.4-1.6.5-.5.6-.9.9-1.5.3-.6.2-1.2-.1-1.6-.1-.6-2-5.2-2.8-7.1z"
        fill="#fff"
      />
    </svg>
  </Tile>
);

export const VK = ({size = 200}) => (
  <Tile size={size} bg="#0077FF">
    <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 64 64">
      <path d="M34.6 47C17.8 47 8.2 35.5 7.8 16.3h8.4c.3 14.1 6.5 20 11.4 21.3V16.3h7.9v12.1c4.9-.5 10-6 11.7-12.1h7.9c-1.3 7.5-6.8 13-10.7 15.3 3.9 1.8 10.2 6.6 12.6 15.4h-8.7c-1.9-5.9-6.5-10.4-12.8-11V47h-1z" fill="#fff" />
    </svg>
  </Tile>
);

export const Max = ({size = 200}) => (
  <Tile size={size} bg="linear-gradient(135deg,#4FC3FF 0%,#7B5CFF 55%,#C44BFF 100%)">
    <span style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: size * 0.27, color: '#fff', letterSpacing: '-0.02em'}}>MAX</span>
  </Tile>
);

export const PLATFORMS = [
  {name: 'Telegram', Icon: Telegram, bg: '#D9F1FF'},
  {name: 'WhatsApp', Icon: WhatsApp, bg: '#D7F8E4'},
  {name: 'VK', Icon: VK, bg: '#DCE8FF'},
  {name: 'MAX', Icon: Max, bg: '#EBDDFF'},
];
