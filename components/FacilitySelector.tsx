import { FacilityType } from '@/lib/layoutOptimizer';

interface FacilitySelectorProps {
  onSelect: (type: FacilityType) => void;
  onBack: () => void;
}

const facilities = [
  {
    type: 'paintball' as const,
    name: 'Paintball Field',
    icon: '🎯',
    description: 'Outdoor/indoor tactical arenas with multiple zones'
  },
  {
    type: 'airsoft' as const,
    name: 'Airsoft Arena',
    icon: '🔫',
    description: 'Structured combat simulation facilities'
  },
  {
    type: 'trampoline' as const,
    name: 'Trampoline Park',
    icon: '🤸',
    description: 'Indoor bounce parks with obstacle courses'
  },
  {
    type: 'gellyball' as const,
    name: 'Gellyball Field',
    icon: '💧',
    description: 'Low-impact gel ball combat arenas'
  },
  {
    type: 'fec' as const,
    name: 'Family Entertainment Center',
    icon: '🎉',
    description: 'Multi-activity entertainment complexes'
  },
];

export default function FacilitySelector({ onSelect, onBack }: FacilitySelectorProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-8 text-gray-400 hover:text-neon-green transition-colors"
        >
          ← Back
        </button>
        
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
          Choose Your Facility Type
        </h2>
        <p className="text-gray-400 text-center mb-12">
          Select the type of facility you want to design
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((facility) => (
            <button
              key={facility.type}
              onClick={() => onSelect(facility.type)}
              className="bg-[#111111] border-2 border-white/[0.08] hover:border-neon-green rounded-xl p-6 text-left transition-all transform hover:scale-105 group"
            >
              <div className="text-5xl mb-4">{facility.icon}</div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-neon-green transition-colors">
                {facility.name}
              </h3>
              <p className="text-gray-400 text-sm">
                {facility.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
