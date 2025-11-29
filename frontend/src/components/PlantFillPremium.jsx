import React from "react";

export default function PlantFillPremium({ progress = 0 }) {
  const p = Math.max(0, Math.min(1, progress));
  const H = 160,
    W = 100;
  const fillH = H * p;
  const fillY = H - fillH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
      <defs>
        <clipPath id="clipPremium">
          <rect
            x="0"
            y={fillY}
            width={W}
            height={fillH}
            style={{ transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </clipPath>

        <linearGradient id="gradPremium" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#2e7d32" />
          <stop offset="50%" stopColor="#43a047" />
          <stop offset="100%" stopColor="#81c784" />
        </linearGradient>

        <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#66bb6a" />
          <stop offset="50%" stopColor="#81c784" />
          <stop offset="100%" stopColor="#a5d6a7" />
        </linearGradient>

        {/* Pulse animation for the glow effect */}
        <filter id="pulseGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* OUTLINE - Tilted narrow stem with spreading leaves */}
      <g
        stroke="#8bc34a"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        style={{
          animation: "plantPulse 3s ease-in-out infinite",
          transformOrigin: "50% 85%",
        }}
      >
        {/* Main tilted stem - narrower and curved */}
        <path d="M52 150 Q48 120, 46 90 Q45 60, 48 30" strokeWidth="3" />

        {/* Left leaf cluster - opening outward */}
        <path
          d="M46 100 Q20 95, 15 75 Q12 60, 25 55 Q35 58, 40 70 Q42 85, 46 100 Z"
          style={{
            transformOrigin: "46px 100px",
            animation: "leafSway1 4s ease-in-out infinite",
          }}
        />

        {/* Right leaf cluster - opening outward */}
        <path
          d="M48 85 Q75 80, 82 60 Q85 45, 70 40 Q58 43, 52 55 Q50 70, 48 85 Z"
          style={{
            transformOrigin: "48px 85px",
            animation: "leafSway2 3.5s ease-in-out infinite",
          }}
        />

        {/* Top left leaf - smaller, more spread */}
        <path
          d="M47 65 Q25 58, 20 45 Q18 35, 28 32 Q35 34, 38 45 Q42 55, 47 65 Z"
          style={{
            transformOrigin: "47px 65px",
            animation: "leafSway3 3s ease-in-out infinite",
          }}
        />

        {/* Top right leaf - smaller, more spread */}
        <path
          d="M49 50 Q70 45, 75 30 Q77 20, 67 17 Q60 19, 57 30 Q54 40, 49 50 Z"
          style={{
            transformOrigin: "49px 50px",
            animation: "leafSway4 4.5s ease-in-out infinite",
          }}
        />

        {/* Small top crown leaves */}
        <path
          d="M48 35 Q40 28, 38 20 Q37 15, 42 14 Q46 16, 47 25 Q47 30, 48 35 Z"
          style={{
            transformOrigin: "48px 35px",
            animation: "leafSway5 2.8s ease-in-out infinite",
          }}
        />

        <path
          d="M48 35 Q56 28, 58 20 Q59 15, 54 14 Q50 16, 49 25 Q49 30, 48 35 Z"
          style={{
            transformOrigin: "48px 35px",
            animation: "leafSway6 3.2s ease-in-out infinite",
          }}
        />
      </g>

      {/* FILL - Same structure with gradient fill */}
      <g
        clipPath="url(#clipPremium)"
        fill="url(#gradPremium)"
        filter="url(#pulseGlow)"
        style={{
          animation:
            "plantPulse 3s ease-in-out infinite, glowPulse 2s ease-in-out infinite alternate",
          transformOrigin: "50% 85%",
        }}
      >
        {/* Main tilted stem - filled */}
        <path
          d="M52 150 Q48 120, 46 90 Q45 60, 48 30"
          strokeWidth="3"
          stroke="url(#gradPremium)"
        />

        {/* Left leaf cluster - filled */}
        <path
          d="M46 100 Q20 95, 15 75 Q12 60, 25 55 Q35 58, 40 70 Q42 85, 46 100 Z"
          fill="url(#leafGrad)"
          style={{
            transformOrigin: "46px 100px",
            animation: "leafSway1 4s ease-in-out infinite",
          }}
        />

        {/* Right leaf cluster - filled */}
        <path
          d="M48 85 Q75 80, 82 60 Q85 45, 70 40 Q58 43, 52 55 Q50 70, 48 85 Z"
          fill="url(#leafGrad)"
          style={{
            transformOrigin: "48px 85px",
            animation: "leafSway2 3.5s ease-in-out infinite",
          }}
        />

        {/* Top left leaf - filled */}
        <path
          d="M47 65 Q25 58, 20 45 Q18 35, 28 32 Q35 34, 38 45 Q42 55, 47 65 Z"
          fill="url(#leafGrad)"
          style={{
            transformOrigin: "47px 65px",
            animation: "leafSway3 3s ease-in-out infinite",
          }}
        />

        {/* Top right leaf - filled */}
        <path
          d="M49 50 Q70 45, 75 30 Q77 20, 67 17 Q60 19, 57 30 Q54 40, 49 50 Z"
          fill="url(#leafGrad)"
          style={{
            transformOrigin: "49px 50px",
            animation: "leafSway4 4.5s ease-in-out infinite",
          }}
        />

        {/* Small top crown leaves - filled */}
        <path
          d="M48 35 Q40 28, 38 20 Q37 15, 42 14 Q46 16, 47 25 Q47 30, 48 35 Z"
          fill="url(#leafGrad)"
          style={{
            transformOrigin: "48px 35px",
            animation: "leafSway5 2.8s ease-in-out infinite",
          }}
        />

        <path
          d="M48 35 Q56 28, 58 20 Q59 15, 54 14 Q50 16, 49 25 Q49 30, 48 35 Z"
          fill="url(#leafGrad)"
          style={{
            transformOrigin: "48px 35px",
            animation: "leafSway6 3.2s ease-in-out infinite",
          }}
        />
      </g>

      {/* CSS animations defined in style tag */}
      <style jsx>{`
        @keyframes plantPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.03);
            opacity: 0.95;
          }
        }

        @keyframes glowPulse {
          0% {
            filter: url(#pulseGlow) brightness(1);
          }
          100% {
            filter: url(#pulseGlow) brightness(1.15);
          }
        }

        @keyframes leafSway1 {
          0%,
          100% {
            transform: rotate(-2deg);
          }
          50% {
            transform: rotate(1deg);
          }
        }

        @keyframes leafSway2 {
          0%,
          100% {
            transform: rotate(1deg);
          }
          50% {
            transform: rotate(-2deg);
          }
        }

        @keyframes leafSway3 {
          0%,
          100% {
            transform: rotate(-1deg);
          }
          50% {
            transform: rotate(2deg);
          }
        }

        @keyframes leafSway4 {
          0%,
          100% {
            transform: rotate(2deg);
          }
          50% {
            transform: rotate(-1deg);
          }
        }

        @keyframes leafSway5 {
          0%,
          100% {
            transform: rotate(-1.5deg);
          }
          50% {
            transform: rotate(1.5deg);
          }
        }

        @keyframes leafSway6 {
          0%,
          100% {
            transform: rotate(1.5deg);
          }
          50% {
            transform: rotate(-1.5deg);
          }
        }
      `}</style>
    </svg>
  );
}
