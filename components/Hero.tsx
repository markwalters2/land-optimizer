interface HeroProps {
  onStart: () => void;
}

export default function Hero({ onStart }: HeroProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-4xl text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-neon-green to-green-400 bg-clip-text text-transparent">
          Design Your Facility in 5 Minutes
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8">
          AI-powered land use optimization for specialty recreation facilities
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <span className="px-4 py-2 bg-gray-800 rounded-full text-sm border border-neon-green/30">
            🎯 Paintball Fields
          </span>
          <span className="px-4 py-2 bg-gray-800 rounded-full text-sm border border-neon-green/30">
            🔫 Airsoft Arenas
          </span>
          <span className="px-4 py-2 bg-gray-800 rounded-full text-sm border border-neon-green/30">
            🤸 Trampoline Parks
          </span>
          <span className="px-4 py-2 bg-gray-800 rounded-full text-sm border border-neon-green/30">
            💧 Gellyball Fields
          </span>
          <span className="px-4 py-2 bg-gray-800 rounded-full text-sm border border-neon-green/30">
            🎉 Family Entertainment Centers
          </span>
        </div>
        
        <button
          onClick={onStart}
          className="px-8 py-4 bg-neon-green text-black font-bold text-lg rounded-lg hover:bg-neon-greenDark transition-all transform hover:scale-105 shadow-lg shadow-neon-green/50"
        >
          Start Designing Now →
        </button>
        
        <p className="mt-8 text-gray-400 text-sm">
          No credit card required • Get your optimized layout instantly
        </p>
      </div>
      
      <div className="absolute bottom-8 text-center">
        <p className="text-gray-500 text-sm">
          Powered by AI • Built for specialty insurance leads
        </p>
      </div>
    </div>
  );
}
