'use client';

import { useForm } from 'react-hook-form';
import { FacilityType, Constraints } from '@/lib/layoutOptimizer';

interface ConstraintFormProps {
  facilityType: FacilityType;
  onSubmit: (data: Constraints) => void;
  onBack: () => void;
}

export default function ConstraintForm({ facilityType, onSubmit, onBack }: ConstraintFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<Constraints>();

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="mb-8 text-gray-400 hover:text-neon-green transition-colors"
        >
          ← Back
        </button>
        
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Tell Us About Your Project
        </h2>
        <p className="text-gray-400 mb-12">
          Provide details to help us optimize your {facilityType} facility layout
        </p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Budget */}
          <div>
            <label className="block text-lg font-semibold mb-2">
              Project Budget (USD)
            </label>
            <p className="text-gray-400 text-sm mb-3">
              Total budget for construction and setup
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                {...register('budget', { 
                  required: 'Budget is required',
                  min: { value: 10000, message: 'Minimum budget is $10,000' }
                })}
                className="w-full bg-[#111111] border-2 border-white/[0.08] rounded-lg px-4 pl-8 py-3 focus:border-neon-green focus:outline-none transition-colors"
                placeholder="100000"
              />
            </div>
            {errors.budget && (
              <p className="text-red-400 text-sm mt-2">{errors.budget.message}</p>
            )}
          </div>

          {/* Existing Structures */}
          <div>
            <label className="block text-lg font-semibold mb-2">
              Existing Structures
            </label>
            <p className="text-gray-400 text-sm mb-3">
              Describe any buildings, utilities, or features already on the property
            </p>
            <textarea
              {...register('existingStructures')}
              rows={4}
              className="w-full bg-[#111111] border-2 border-white/[0.08] rounded-lg px-4 py-3 focus:border-neon-green focus:outline-none transition-colors resize-none"
              placeholder="e.g., One warehouse building (5000 sq ft), power lines on east side, small shed..."
            />
          </div>

          {/* Parking Spaces */}
          <div>
            <label className="block text-lg font-semibold mb-2">
              Parking Spaces Needed
            </label>
            <p className="text-gray-400 text-sm mb-3">
              Estimated number of parking spaces required
            </p>
            <input
              type="number"
              {...register('parkingSpaces', { 
                required: 'Number of parking spaces is required',
                min: { value: 5, message: 'Minimum 5 parking spaces' }
              })}
              className="w-full bg-[#111111] border-2 border-white/[0.08] rounded-lg px-4 py-3 focus:border-neon-green focus:outline-none transition-colors"
              placeholder="50"
            />
            {errors.parkingSpaces && (
              <p className="text-red-400 text-sm mt-2">{errors.parkingSpaces.message}</p>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-lg font-semibold mb-2">
              Additional Requirements (Optional)
            </label>
            <p className="text-gray-400 text-sm mb-3">
              Any other constraints, preferences, or special needs
            </p>
            <textarea
              {...register('additionalNotes')}
              rows={4}
              className="w-full bg-[#111111] border-2 border-white/[0.08] rounded-lg px-4 py-3 focus:border-neon-green focus:outline-none transition-colors resize-none"
              placeholder="e.g., Need covered waiting area, prefer natural barriers, must have emergency vehicle access..."
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-8 py-4 bg-neon-green text-black font-bold text-lg rounded-lg hover:bg-neon-greenDark transition-all transform hover:scale-[1.02] shadow-lg shadow-neon-green/50"
            >
              Generate Optimized Layout →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
