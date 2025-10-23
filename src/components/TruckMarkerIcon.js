export const createTruckIcon = (color = '#3B82F6') => {
  // SVG truck icon with custom color
  const truckSvg = `
    <svg width="48" height="48" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <!-- Drop shadow -->
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Main truck body -->
      <g filter="url(#shadow)">
        <!-- Cargo area -->
        <rect x="8" y="24" width="28" height="18" fill="${color}" stroke="white" stroke-width="2" rx="2"/>
        
        <!-- Cabin -->
        <path d="M 36 24 L 50 24 L 50 35 C 50 36 49 37 48 37 L 36 37 L 36 24 Z" 
              fill="${color}" stroke="white" stroke-width="2"/>
        
        <!-- Window -->
        <rect x="38" y="26" width="8" height="6" fill="#E0F2FE" stroke="white" stroke-width="1" rx="1"/>
        
        <!-- Wheels -->
        <circle cx="16" cy="42" r="5" fill="#1F2937" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="42" r="2.5" fill="#6B7280"/>
        
        <circle cx="44" cy="42" r="5" fill="#1F2937" stroke="white" stroke-width="2"/>
        <circle cx="44" cy="42" r="2.5" fill="#6B7280"/>
        
        <!-- Front bumper detail -->
        <rect x="48" y="33" width="3" height="4" fill="#FCD34D" stroke="white" stroke-width="0.5" rx="0.5"/>
        
        <!-- Cargo lines (detail) -->
        <line x1="14" y1="28" x2="32" y2="28" stroke="white" stroke-width="0.5" opacity="0.5"/>
        <line x1="14" y1="32" x2="32" y2="32" stroke="white" stroke-width="0.5" opacity="0.5"/>
        <line x1="14" y1="36" x2="32" y2="36" stroke="white" stroke-width="0.5" opacity="0.5"/>
      </g>
      
      <!-- Pulsing effect circle (optional) -->
      <circle cx="32" cy="32" r="28" fill="none" stroke="${color}" stroke-width="1" opacity="0.3">
        <animate attributeName="r" from="28" to="32" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `;

  return truckSvg;
};

// Helper to create Leaflet DivIcon with truck
export const createTruckDivIcon = (L, color = '#3B82F6') => {
  return L.divIcon({
    html: createTruckIcon(color),
    className: 'truck-marker', // Custom class for styling
    iconSize: [48, 48],
    iconAnchor: [24, 40], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -40] // Point from which the popup should open relative to the iconAnchor
  });
};