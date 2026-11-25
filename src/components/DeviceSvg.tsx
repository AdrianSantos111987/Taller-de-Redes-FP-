import React from 'react';
import { ComponentId } from '../data/componentsData';

interface DeviceSvgProps {
  type: ComponentId | 'bandeja';
  className?: string;
  activeLeds?: boolean[];
  hubMode?: boolean;
}

export const DeviceSvg: React.FC<DeviceSvgProps> = ({
  type,
  className = 'w-full h-24',
  activeLeds = [],
  hubMode = false,
}) => {
  switch (type) {
    case 'sai':
      return (
        <svg
          viewBox="0 0 320 96"
          className={className}
          role="img"
          aria-label="Ilustración técnica de SAI (UPS) 2U"
        >
          {/* Rack ears */}
          <rect x="4" y="6" width="12" height="84" rx="2" fill="#475569" />
          <rect x="304" y="6" width="12" height="84" rx="2" fill="#475569" />
          <circle cx="10" cy="20" r="3" fill="#CBD5E1" />
          <circle cx="10" cy="76" r="3" fill="#CBD5E1" />
          <circle cx="310" cy="20" r="3" fill="#CBD5E1" />
          <circle cx="310" cy="76" r="3" fill="#CBD5E1" />
          {/* Chassis */}
          <rect x="16" y="4" width="288" height="88" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="2" />
          {/* Ventilation grille left */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={28 + i * 10} y="18" width="5" height="60" rx="2" fill="#0F172A" />
          ))}
          {/* LCD Status Panel */}
          <rect x="114" y="20" width="94" height="56" rx="4" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
          <rect x="122" y="28" width="56" height="24" rx="2" fill="#0369A1" />
          <text x="127" y="44" fill="#E0F2FE" fontSize="11" fontFamily="monospace" fontWeight="600">
            230V · 100%
          </text>
          <circle cx="192" cy="36" r="4" fill="#10B981" />
          <rect x="122" y="60" width="24" height="8" rx="2" fill="#334155" />
          <rect x="152" y="60" width="24" height="8" rx="2" fill="#334155" />
          {/* Rear / front Schuko power sockets representation */}
          <g transform="translate(222, 22)">
            <rect x="0" y="0" width="68" height="52" rx="3" fill="#0F172A" stroke="#334155" />
            <circle cx="20" cy="26" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="16" cy="26" r="2" fill="#E2E8F0" />
            <circle cx="24" cy="26" r="2" fill="#E2E8F0" />
            <circle cx="48" cy="26" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="44" cy="26" r="2" fill="#E2E8F0" />
            <circle cx="52" cy="26" r="2" fill="#E2E8F0" />
          </g>
        </svg>
      );

    case 'pdu':
      return (
        <svg
          viewBox="0 0 320 52"
          className={className}
          role="img"
          aria-label="Ilustración técnica de Regleta PDU 1U"
        >
          <rect x="4" y="6" width="12" height="40" rx="2" fill="#64748B" />
          <rect x="304" y="6" width="12" height="40" rx="2" fill="#64748B" />
          <circle cx="10" cy="14" r="2.5" fill="#F1F5F9" />
          <circle cx="10" cy="38" r="2.5" fill="#F1F5F9" />
          <circle cx="310" cy="14" r="2.5" fill="#F1F5F9" />
          <circle cx="310" cy="38" r="2.5" fill="#F1F5F9" />
          <rect x="16" y="6" width="288" height="40" rx="3" fill="#334155" stroke="#475569" strokeWidth="1.5" />
          {/* Red master switch */}
          <rect x="26" y="15" width="22" height="22" rx="2" fill="#DC2626" stroke="#991B1B" />
          <line x1="37" y1="20" x2="37" y2="32" stroke="#FEF2F2" strokeWidth="2" />
          {/* 6 Schuko outlets */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const cx = 78 + i * 38;
            return (
              <g key={i}>
                <circle cx={cx} cy="26" r="12" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
                <circle cx={cx - 4} cy="26" r="2" fill="#CBD5E1" />
                <circle cx={cx + 4} cy="26" r="2" fill="#CBD5E1" />
              </g>
            );
          })}
        </svg>
      );

    case 'bandeja':
      return (
        <svg
          viewBox="0 0 320 52"
          className={className}
          role="img"
          aria-label="Ilustración técnica de Bandeja metálica 1U"
        >
          <rect x="4" y="6" width="12" height="40" rx="2" fill="#64748B" />
          <rect x="304" y="6" width="12" height="40" rx="2" fill="#64748B" />
          <circle cx="10" cy="14" r="2.5" fill="#F1F5F9" />
          <circle cx="10" cy="38" r="2.5" fill="#F1F5F9" />
          <circle cx="310" cy="14" r="2.5" fill="#F1F5F9" />
          <circle cx="310" cy="38" r="2.5" fill="#F1F5F9" />
          {/* Shelf lip and perforated surface */}
          <polygon points="16,32 304,32 294,10 26,10" fill="#94A3B8" stroke="#64748B" strokeWidth="1.5" />
          <rect x="16" y="32" width="288" height="12" rx="2" fill="#475569" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <rect key={i} x={40 + i * 24} y="16" width="14" height="8" rx="2" fill="#CBD5E1" />
          ))}
        </svg>
      );

    case 'router':
      return (
        <svg
          viewBox="0 0 320 56"
          className={className}
          role="img"
          aria-label="Ilustración técnica de Router de operadora"
        >
          {/* Antennas */}
          <rect x="36" y="2" width="6" height="18" rx="3" fill="#334155" />
          <rect x="278" y="2" width="6" height="18" rx="3" fill="#334155" />
          {/* Main body */}
          <rect x="20" y="16" width="280" height="36" rx="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
          <rect x="28" y="22" width="68" height="24" rx="2" fill="#0F172A" />
          <text x="34" y="38" fill="#38BDF8" fontSize="9.5" fontFamily="monospace" fontWeight="600">
            ROUTER
          </text>
          {/* WAN port (Yellow/Amber) */}
          <g transform="translate(110, 23)">
            <rect x="0" y="0" width="24" height="22" rx="2" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
            <rect x="5" y="5" width="14" height="10" fill="#713F12" />
            <text x="2" y="20" fill="#854D0E" fontSize="6" fontFamily="monospace" fontWeight="700">
              WAN
            </text>
          </g>
          {/* 4 LAN ports */}
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${148 + i * 26}, 23)`}>
              <rect x="0" y="0" width="20" height="22" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
              <rect x="4" y="5" width="12" height="10" fill="#0C4A6E" />
              <text x="3" y="20" fill="#0369A1" fontSize="5.5" fontFamily="monospace" fontWeight="700">
                L{i + 1}
              </text>
            </g>
          ))}
          {/* LEDs */}
          <circle cx="264" cy="28" r="3" fill="#10B981" />
          <circle cx="276" cy="28" r="3" fill="#0EA5E9" />
          <circle cx="288" cy="28" r="3" fill="#EAB308" />
        </svg>
      );

    case 'switch':
    case 'hub': {
      const isHub = type === 'hub' || hubMode;
      const portCount = isHub ? 8 : 12;
      const bodyColor = isHub ? '#475569' : '#0F172A';
      return (
        <svg
          viewBox="0 0 320 52"
          className={className}
          role="img"
          aria-label={isHub ? 'Ilustración técnica de Hub de 8 puertos' : 'Ilustración técnica de Switch de 24 puertos'}
        >
          <rect x="4" y="6" width="12" height="40" rx="2" fill="#64748B" />
          <rect x="304" y="6" width="12" height="40" rx="2" fill="#64748B" />
          <circle cx="10" cy="14" r="2.5" fill="#F1F5F9" />
          <circle cx="10" cy="38" r="2.5" fill="#F1F5F9" />
          <circle cx="310" cy="14" r="2.5" fill="#F1F5F9" />
          <circle cx="310" cy="38" r="2.5" fill="#F1F5F9" />
          <rect x="16" y="6" width="288" height="40" rx="3" fill={bodyColor} stroke="#334155" strokeWidth="1.5" />
          <text x="26" y="24" fill="#F8FAFC" fontSize="9.5" fontFamily="monospace" fontWeight="700">
            {isHub ? 'HUB 8P' : 'SWITCH 24P'}
          </text>
          <text x="26" y="36" fill={isHub ? '#FCA5A5' : '#7DD3FC'} fontSize="7" fontFamily="monospace">
            {isHub ? 'REPETIDOR' : 'CONMUTADOR'}
          </text>
          {/* RJ45 Ports + LEDs */}
          {Array.from({ length: portCount }).map((_, i) => {
            const x = 96 + i * (isHub ? 24 : 16);
            const ledOn = activeLeds[i] ?? (i < 2 && !isHub);
            return (
              <g key={i} transform={`translate(${x}, 14)`}>
                <circle
                  cx={isHub ? 8 : 6}
                  cy="-2"
                  r="2"
                  fill={ledOn ? '#10B981' : '#334155'}
                />
                <rect
                  x="0"
                  y="4"
                  width={isHub ? 16 : 12}
                  height="18"
                  rx="1.5"
                  fill="#1E293B"
                  stroke="#94A3B8"
                  strokeWidth="1"
                />
                <rect x="3" y="8" width={isHub ? 10 : 6} height="9" fill="#020617" />
              </g>
            );
          })}
        </svg>
      );
    }

    case 'patch_panel':
      return (
        <svg
          viewBox="0 0 320 52"
          className={className}
          role="img"
          aria-label="Ilustración técnica de Patch Panel de 24 puertos"
        >
          <rect x="4" y="6" width="12" height="40" rx="2" fill="#64748B" />
          <rect x="304" y="6" width="12" height="40" rx="2" fill="#64748B" />
          <circle cx="10" cy="14" r="2.5" fill="#F1F5F9" />
          <circle cx="10" cy="38" r="2.5" fill="#F1F5F9" />
          <circle cx="310" cy="14" r="2.5" fill="#F1F5F9" />
          <circle cx="310" cy="38" r="2.5" fill="#F1F5F9" />
          <rect x="16" y="6" width="288" height="40" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
          <text x="26" y="23" fill="#E2E8F0" fontSize="8.5" fontFamily="monospace" fontWeight="700">
            PATCH PANEL
          </text>
          <rect x="26" y="28" width="56" height="10" rx="1" fill="#F8FAFC" />
          <text x="30" y="36" fill="#0F172A" fontSize="6.5" fontFamily="monospace" fontWeight="600">
            AULA 01-24
          </text>
          {/* 12 visible front jacks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const x = 94 + i * 16.5;
            return (
              <g key={i} transform={`translate(${x}, 11)`}>
                <rect x="0" y="0" width="12" height="6" rx="1" fill="#F8FAFC" />
                <text x="2" y="5" fill="#0F172A" fontSize="5" fontFamily="monospace" fontWeight="700">
                  {String(i + 1).padStart(2, '0')}
                </text>
                <rect x="0" y="9" width="12" height="18" rx="1.5" fill="#0F172A" stroke="#94A3B8" strokeWidth="1" />
                <rect x="3" y="13" width="6" height="9" fill="#020617" />
              </g>
            );
          })}
        </svg>
      );

    case 'pcs_roseta':
      return (
        <svg
          viewBox="0 0 320 96"
          className={className}
          role="img"
          aria-label="Ilustración de Ordenador de aula y Roseta de pared RJ45"
        >
          {/* Wall Outlet / Roseta */}
          <g transform="translate(24, 18)">
            <rect x="0" y="0" width="58" height="58" rx="6" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
            <rect x="14" y="14" width="30" height="24" rx="2" fill="#E2E8F0" stroke="#64748B" />
            <rect x="21" y="19" width="16" height="14" fill="#0F172A" />
            <text x="11" y="50" fill="#334155" fontSize="8" fontFamily="monospace" fontWeight="700">
              ROSETA
            </text>
          </g>
          {/* Blue UTP Cable connecting Roseta to PC */}
          <path
            d="M 82 47 C 115 47, 115 70, 148 70"
            fill="none"
            stroke="#0284C7"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* PC Monitor & Tower */}
          <g transform="translate(148, 12)">
            {/* Monitor */}
            <rect x="0" y="0" width="104" height="60" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="2" />
            <rect x="6" y="6" width="92" height="46" rx="2" fill="#E0F2FE" />
            <path d="M 38 40 L 66 40 L 52 20 Z" fill="#0284C7" opacity="0.25" />
            <rect x="44" y="60" width="16" height="10" fill="#475569" />
            <rect x="30" y="70" width="44" height="5" rx="2" fill="#334155" />
            {/* Tower */}
            <rect x="116" y="10" width="36" height="65" rx="3" fill="#334155" stroke="#1E293B" strokeWidth="2" />
            <rect x="122" y="18" width="24" height="6" rx="1" fill="#0F172A" />
            <circle cx="134" cy="36" r="4" fill="#10B981" />
            <text x="122" y="66" fill="#E2E8F0" fontSize="8" fontFamily="monospace" fontWeight="700">
              PC
            </text>
          </g>
        </svg>
      );
  }
};
