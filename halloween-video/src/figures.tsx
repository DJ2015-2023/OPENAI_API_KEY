import React from 'react';

// Stylised costume silhouettes, drawn in local coords: feet at (0,0), head centre near (0,-640).
export type Costume = 'witch' | 'vampire' | 'devil' | 'cat' | 'skull' | 'lead' | 'follow';

export const Person: React.FC<{
  kind: Costume;
  fill?: string;
  rim?: string;
  headTilt?: number;
  armUp?: number; // 0..1 raises the right arm
  skirt?: number; // -1..1 dress swing
}> = ({kind, fill = '#0b0710', rim = 'rgba(233,194,122,.55)', headTilt = 0, armUp = 0, skirt = 0}) => {
  const female = kind === 'witch' || kind === 'cat' || kind === 'follow' || kind === 'devil';
  const stroke = {stroke: rim, strokeWidth: 4, strokeLinejoin: 'round' as const};
  const sw = skirt * 40;
  return (
    <g>
      {/* legs */}
      {female ? null : (
        <path d="M-70 -380 L-60 0 L-15 0 L-5 -330 L5 -330 L15 0 L60 0 L70 -380 Z" fill={fill} {...stroke} />
      )}
      {/* body */}
      {female ? (
        <path
          d={`M-62 -560 C-90 -470 -60 -420 -55 -380 C-120 -250 ${-160 + sw} -80 ${-170 + sw} 0 L${170 + sw} 0 C${160 + sw} -80 120 -250 55 -380 C60 -420 90 -470 62 -560 Z`}
          fill={fill}
          {...stroke}
        />
      ) : (
        <path d="M-95 -560 C-110 -470 -85 -400 -75 -360 L75 -360 C85 -400 110 -470 95 -560 Z" fill={fill} {...stroke} />
      )}
      {/* shoulders */}
      <path d={female ? 'M-90 -560 Q0 -600 90 -560 L70 -520 L-70 -520 Z' : 'M-125 -560 Q0 -615 125 -560 L105 -500 L-105 -500 Z'} fill={fill} {...stroke} />
      {/* left arm */}
      <path d={female ? 'M-82 -555 C-115 -470 -110 -400 -95 -330' : 'M-118 -555 C-140 -470 -130 -390 -120 -320'} stroke={fill} strokeWidth={female ? 34 : 44} strokeLinecap="round" fill="none" />
      {/* right arm, optionally raised */}
      <path
        d={
          armUp > 0
            ? `M${female ? 82 : 118} -555 C${150} ${-600 - armUp * 60} ${170} ${-680 - armUp * 90} ${150} ${-720 - armUp * 120}`
            : female
              ? 'M82 -555 C115 -470 110 -400 95 -330'
              : 'M118 -555 C140 -470 130 -390 120 -320'
        }
        stroke={fill}
        strokeWidth={female ? 34 : 44}
        strokeLinecap="round"
        fill="none"
      />
      {/* vampire cape collar */}
      {kind === 'vampire' && (
        <>
          <path d="M-125 -560 C-200 -400 -230 -200 -240 -30 L-90 -200 L-75 -360 Z" fill="#14040a" {...stroke} stroke="rgba(196,16,42,.7)" />
          <path d="M125 -560 C200 -400 230 -200 240 -30 L90 -200 L75 -360 Z" fill="#14040a" {...stroke} stroke="rgba(196,16,42,.7)" />
          <path d="M-70 -575 L-120 -700 L-40 -610 Z M70 -575 L120 -700 L40 -610 Z" fill="#2a0410" stroke="rgba(196,16,42,.8)" strokeWidth={3} />
        </>
      )}
      <g transform={`rotate(${headTilt} 0 -600)`}>
        {/* neck + head */}
        <rect x={-18} y={-615} width={36} height={60} rx={14} fill={fill} />
        <ellipse cx={0} cy={-660} rx={female ? 50 : 56} ry={female ? 62 : 66} fill={fill} {...stroke} />
        {female && kind !== 'witch' && (
          <path d="M-52 -680 C-60 -600 -80 -560 -70 -520 L-40 -560 M52 -680 C60 -600 80 -560 70 -520 L40 -560" stroke={fill} strokeWidth={30} fill="none" strokeLinecap="round" />
        )}
        {kind === 'witch' && (
          <>
            <path d="M-60 -690 C-70 -600 -95 -560 -85 -500 M60 -690 C70 -600 95 -560 85 -500" stroke={fill} strokeWidth={34} fill="none" strokeLinecap="round" />
            <ellipse cx={0} cy={-700} rx={130} ry={22} fill={fill} {...stroke} />
            <path d="M-62 -705 C-40 -800 -10 -880 60 -930 C30 -870 40 -790 62 -705 Z" fill={fill} {...stroke} />
          </>
        )}
        {kind === 'devil' && <path d="M-40 -710 Q-70 -760 -60 -800 Q-40 -760 -20 -720 Z M40 -710 Q70 -760 60 -800 Q40 -760 20 -720 Z" fill="#7a0a18" {...stroke} stroke="rgba(255,60,60,.8)" />}
        {kind === 'cat' && <path d="M-45 -700 L-50 -770 L-12 -718 Z M45 -700 L50 -770 L12 -718 Z" fill={fill} {...stroke} />}
        {(kind === 'lead' || kind === 'skull') && (
          <>
            <ellipse cx={0} cy={-712} rx={110} ry={18} fill={fill} {...stroke} />
            <path d="M-58 -715 L-50 -790 Q0 -805 50 -790 L58 -715 Z" fill={fill} {...stroke} />
            <rect x={-56} y={-735} width={112} height={14} fill="#6e0a18" />
          </>
        )}
        {kind === 'skull' && (
          <g opacity={0.85}>
            <ellipse cx={-20} cy={-668} rx={13} ry={15} fill="#e8dccb" />
            <ellipse cx={20} cy={-668} rx={13} ry={15} fill="#e8dccb" />
            <path d="M-22 -630 L22 -630" stroke="#e8dccb" strokeWidth={5} strokeDasharray="5 4" />
          </g>
        )}
      </g>
    </g>
  );
};
