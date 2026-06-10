// Flat inline SVG illustrations for the welcome carousel — FreshMart palette only.
// Only import this module from Server Components: the slides are passed into
// WelcomeScreen as rendered nodes so the SVGs never enter the client JS bundle.

export function welcomeIllustrations() {
  return [
    <BasketIllustration key="basket" />,
    <DeliveryIllustration key="delivery" />,
    <FreshnessIllustration key="freshness" />,
  ]
}

export function BasketIllustration() {
  return (
    <svg viewBox="0 0 320 240" width="100%" aria-hidden="true" focusable="false">
      {/* ground shadow */}
      <ellipse cx="160" cy="206" rx="92" ry="10" fill="#1f2520" opacity="0.08" />

      {/* leafy greens poking out */}
      <path d="M118 96 C104 70 112 50 132 44 C136 64 132 84 124 98 Z" fill="#2a6a47" />
      <path d="M138 92 C134 62 148 42 170 40 C172 64 162 84 150 96 Z" fill="#1f4d34" />
      {/* carrot */}
      <path d="M196 100 L210 56 L222 102 Z" fill="#d3893a" />
      <path d="M206 56 C202 46 208 38 216 36 C218 44 214 52 210 58 Z" fill="#2a6a47" />
      {/* baguette */}
      <path d="M172 96 C176 72 192 52 214 44 C222 52 222 62 216 72 C202 84 188 94 180 100 Z" fill="#fbeed8" />
      <path d="M190 74 L200 66 M198 84 L208 76" stroke="#d3893a" strokeWidth="4" strokeLinecap="round" />
      {/* orange */}
      <circle cx="110" cy="104" r="18" fill="#d3893a" />
      <path d="M108 90 C108 84 112 80 118 80" stroke="#2a6a47" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* paper bag */}
      <path d="M92 100 L228 100 L216 204 L104 204 Z" fill="#d3893a" />
      <path d="M92 100 L228 100 L224 134 L96 134 Z" fill="#1f2520" opacity="0.12" />
      {/* bag crease */}
      <path d="M160 104 L160 200" stroke="#1f2520" strokeWidth="3" opacity="0.14" />
      {/* FM label */}
      <rect x="134" y="146" width="52" height="34" rx="8" fill="#fafaf6" />
      <text x="160" y="170" textAnchor="middle" fontFamily="Helvetica, sans-serif" fontWeight="800" fontSize="18" fill="#1f4d34">FM</text>

      {/* sparkles */}
      <path d="M62 70 L62 86 M54 78 L70 78" stroke="#2a6a47" strokeWidth="4" strokeLinecap="round" />
      <path d="M258 110 L258 124 M251 117 L265 117" stroke="#d3893a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function DeliveryIllustration() {
  return (
    <svg viewBox="0 0 320 240" width="100%" aria-hidden="true" focusable="false">
      {/* house */}
      <rect x="244" y="118" width="52" height="50" rx="4" fill="#fbeed8" />
      <path d="M238 122 L270 94 L302 122 Z" fill="#2a6a47" />
      <rect x="262" y="140" width="16" height="28" rx="2" fill="#1f4d34" />

      {/* ground */}
      <path d="M24 196 L300 196" stroke="#1f2520" strokeWidth="4" strokeLinecap="round" opacity="0.18" />

      {/* motion lines */}
      <path d="M28 130 L62 130 M20 150 L56 150 M32 170 L60 170" stroke="#d3893a" strokeWidth="5" strokeLinecap="round" />

      {/* delivery box */}
      <rect x="86" y="86" width="46" height="42" rx="8" fill="#d3893a" />
      <text x="109" y="113" textAnchor="middle" fontFamily="Helvetica, sans-serif" fontWeight="800" fontSize="16" fill="#fafaf6">FM</text>

      {/* scooter body */}
      <path d="M96 158 L138 158 C150 158 158 150 162 138 L172 138" stroke="#1f4d34" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M168 138 L192 122 L208 122" stroke="#1f4d34" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* seat post + rack */}
      <path d="M112 158 L112 132" stroke="#1f4d34" strokeWidth="8" strokeLinecap="round" />
      {/* wheels */}
      <circle cx="96" cy="176" r="20" fill="none" stroke="#1f2520" strokeWidth="8" />
      <circle cx="212" cy="176" r="20" fill="none" stroke="#1f2520" strokeWidth="8" />
      <circle cx="96" cy="176" r="5" fill="#1f2520" />
      <circle cx="212" cy="176" r="5" fill="#1f2520" />
      {/* front fork */}
      <path d="M208 126 L212 172" stroke="#1f4d34" strokeWidth="8" strokeLinecap="round" />

      {/* rider */}
      <circle cx="160" cy="86" r="16" fill="#2a6a47" />
      <path d="M156 102 C146 112 142 124 144 138 L168 138 C172 124 168 110 164 102 Z" fill="#2a6a47" />
      <path d="M162 116 L196 122" stroke="#2a6a47" strokeWidth="9" strokeLinecap="round" />

      {/* sun */}
      <circle cx="280" cy="48" r="18" fill="#d3893a" opacity="0.85" />
    </svg>
  )
}

export function FreshnessIllustration() {
  return (
    <svg viewBox="0 0 320 240" width="100%" aria-hidden="true" focusable="false">
      {/* rising sun */}
      <circle cx="160" cy="92" r="44" fill="#fbeed8" />
      <circle cx="160" cy="92" r="28" fill="#d3893a" />
      <path d="M104 92 L88 92 M232 92 L216 92 M120 56 L110 46 M200 56 L210 46 M160 36 L160 22"
        stroke="#d3893a" strokeWidth="5" strokeLinecap="round" />

      {/* produce on the crate */}
      <circle cx="124" cy="128" r="17" fill="#d3893a" />
      <circle cx="160" cy="122" r="19" fill="#2a6a47" />
      <circle cx="196" cy="128" r="17" fill="#d3893a" />
      <path d="M158 104 C158 98 162 94 168 94" stroke="#1f4d34" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* wooden crate */}
      <path d="M92 140 L228 140 L218 204 L102 204 Z" fill="#d3893a" opacity="0.55" />
      <path d="M92 140 L228 140 L226 154 L94 154 Z" fill="#1f4d34" opacity="0.18" />
      <path d="M110 158 L206 158 M108 176 L208 176" stroke="#fafaf6" strokeWidth="5" strokeLinecap="round" opacity="0.7" />

      {/* leaf badge with check */}
      <circle cx="244" cy="170" r="28" fill="#e6efe6" />
      <circle cx="244" cy="170" r="28" fill="none" stroke="#2a6a47" strokeWidth="3" />
      <path d="M232 170 L240 179 L257 160" stroke="#1f4d34" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M244 142 C238 134 240 126 248 122 C252 128 250 136 246 142 Z" fill="#2a6a47" />

      {/* grass tufts */}
      <path d="M58 204 C58 194 64 190 70 190 M70 204 C70 196 74 192 80 192" stroke="#2a6a47" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="160" cy="210" rx="100" ry="8" fill="#1f2520" opacity="0.08" />
    </svg>
  )
}
