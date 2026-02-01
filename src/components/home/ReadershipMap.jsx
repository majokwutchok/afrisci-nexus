import React from 'react';

export default function ReadershipMap({ stats, isLoading }) {
  return (
    <div className="p-8 bg-slate-100/50 rounded-2xl">
      <h3 className="text-3xl font-bold">Our Global Reach</h3>
      <p className="mt-2 text-slate-600">
        Connecting African research with the world. See where our publications are making an impact.
      </p>
      <div className="mt-6 relative">
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7); }
              70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(45, 212, 191, 0); }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(45, 212, 191, 0); }
            }
            .pulse-dot {
              position: absolute;
              width: 10px;
              height: 10px;
              background-color: #2dd4bf;
              border-radius: 50%;
              box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7);
              transform: scale(1);
              animation: pulse 2s infinite;
            }
          `}
        </style>
        <img src="https://simplemaps.com/static/demos/resources/svg-library/svgs/world.svg" alt="World Map" className="w-full h-auto opacity-70" />
        {/* Animated Dots - positions are approximate */}
        <div className="pulse-dot" style={{ top: '35%', left: '50%' }}></div> {/* Europe */}
        <div className="pulse-dot" style={{ top: '55%', left: '48%' }}></div> {/* West Africa */}
        <div className="pulse-dot" style={{ top: '65%', left: '53%' }}></div> {/* East Africa */}
        <div className="pulse-dot" style={{ top: '40%', left: '20%' }}></div> {/* North America */}
        <div className="pulse-dot" style={{ top: '70%', left: '30%' }}></div> {/* South America */}
        <div className="pulse-dot" style={{ top: '45%', left: '75%' }}></div> {/* Asia */}
      </div>
    </div>
  );
}