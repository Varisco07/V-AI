'use client'

export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  const uniqueId = `logo-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${uniqueId}-gradient1`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        
        <linearGradient id={`${uniqueId}-gradient2`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <radialGradient id={`${uniqueId}-radial`}>
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Glowing background */}
      <circle cx="50" cy="50" r="45" fill={`url(#${uniqueId}-radial)`}>
        <animate attributeName="r" values="42;48;42" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.6;0.4" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Outer rotating ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="38" 
        stroke={`url(#${uniqueId}-gradient1)`}
        strokeWidth="1.5" 
        strokeDasharray="4 8"
        fill="none"
        opacity="0.4"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="20s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Middle ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="32" 
        stroke={`url(#${uniqueId}-gradient2)`}
        strokeWidth="1" 
        strokeDasharray="3 6"
        fill="none"
        opacity="0.3"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="360 50 50"
          to="0 50 50"
          dur="15s"
          repeatCount="indefinite"
        />
      </circle>
      
      {/* Main V shape with glow */}
      <g filter={`url(#${uniqueId}-glow)`}>
        <path 
          d="M 28 28 L 50 68 L 72 28" 
          stroke={`url(#${uniqueId}-gradient1)`}
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      
      {/* Central core */}
      <circle cx="50" cy="50" r="8" fill={`url(#${uniqueId}-gradient1)`} opacity="0.8">
        <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
      </circle>
      
      <circle cx="50" cy="50" r="5" fill="#ffffff" opacity="0.9" />
      
      {/* Orbiting particles */}
      <circle r="2.5" fill="#6366F1" opacity="0.8">
        <animateMotion dur="4s" repeatCount="indefinite" path="M 50,20 A 30,30 0 1,1 50,80 A 30,30 0 1,1 50,20 Z" />
      </circle>
      
      <circle r="2.5" fill="#06B6D4" opacity="0.8">
        <animateMotion dur="4s" repeatCount="indefinite" path="M 50,80 A 30,30 0 1,1 50,20 A 30,30 0 1,1 50,80 Z" />
      </circle>

      <circle r="2.5" fill="#8B5CF6" opacity="0.8">
        <animateMotion dur="5s" repeatCount="indefinite" path="M 20,50 A 30,30 0 1,1 80,50 A 30,30 0 1,1 20,50 Z" />
      </circle>
      
      {/* Corner tech accents */}
      <g opacity="0.5">
        <circle cx="30" cy="33" r="2" fill="#6366F1">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="33" r="2" fill="#06B6D4">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="78" r="2" fill="#8B5CF6">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="1s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Connection lines to V */}
      <line x1="30" y1="33" x2="38" y2="42" stroke="#6366F1" strokeWidth="1" opacity="0.3" strokeDasharray="2 2" />
      <line x1="70" y1="33" x2="62" y2="42" stroke="#06B6D4" strokeWidth="1" opacity="0.3" strokeDasharray="2 2" />
      <line x1="50" y1="78" x2="50" y2="68" stroke="#8B5CF6" strokeWidth="1" opacity="0.3" strokeDasharray="2 2" />
    </svg>
  )
}
