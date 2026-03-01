'use client';

import { useState } from 'react';
import Hero from '@/components/Hero';
import MapInterface from '@/components/MapInterface';
import FacilitySelector from '@/components/FacilitySelector';
import ConstraintForm from '@/components/ConstraintForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import EmailCapture from '@/components/EmailCapture';
import { FacilityType, Constraints, PropertyBounds } from '@/lib/layoutOptimizer';

// Pre-set example: 5-acre paintball facility, Dallas TX (Commerce St south entry)
const EXAMPLE_PRESET = {
  facilityType: 'paintball' as FacilityType,
  propertyBounds: {
    type: 'Polygon' as const,
    coordinates: [[
      [-96.7969, 32.7767], [-96.7960, 32.7767],
      [-96.7960, 32.7755], [-96.7969, 32.7755],
      [-96.7969, 32.7767],
    ]],
  },
  constraints: { budget: 300000 } as Constraints,
};

export default function Home() {
  const [step, setStep] = useState<'hero' | 'facility' | 'map' | 'constraints' | 'results'>('hero');
  const [facilityType, setFacilityType] = useState<FacilityType>(null);
  const [propertyBounds, setPropertyBounds] = useState<PropertyBounds | null>(null);
  const [constraints, setConstraints] = useState<Constraints | null>(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isExample, setIsExample] = useState(false);
  const [isLoadingExample, setIsLoadingExample] = useState(false);

  const handleTryExample = async () => {
    setIsLoadingExample(true);
    try {
      // Pre-fill all state with example data — skip map + constraints steps entirely
      setFacilityType(EXAMPLE_PRESET.facilityType);
      setPropertyBounds(EXAMPLE_PRESET.propertyBounds);
      setConstraints(EXAMPLE_PRESET.constraints);
      setIsExample(true);
      setStep('results');
    } finally {
      setIsLoadingExample(false);
    }
  };

  const handleStart = () => {
    setIsExample(false);
    setStep('facility');
  };

  const handleFacilitySelect = (type: FacilityType) => {
    setFacilityType(type);
    setStep('map');
  };

  const handleMapComplete = (bounds: PropertyBounds) => {
    setPropertyBounds(bounds);
    setStep('constraints');
  };

  const handleConstraintsSubmit = (data: Constraints) => {
    setConstraints(data);
    setStep('results');
  };

  const handleSavePlan = () => {
    setShowEmailCapture(true);
  };

  const handleEmailSubmit = (_email: string) => {
    // API call + success state are handled inside EmailCapture component.
    // This callback fires after successful submission — nothing extra needed here.
    // The modal closes via its own onClose button after showing the success state.
  };

  return (
    <main className="min-h-screen">
      {step === 'hero' && (
        <Hero
          onStart={handleStart}
          onTryExample={handleTryExample}
          isLoadingExample={isLoadingExample}
        />
      )}
      
      {step === 'facility' && (
        <FacilitySelector 
          onSelect={handleFacilitySelect}
          onBack={() => setStep('hero')}
        />
      )}
      
      {step === 'map' && (
        <MapInterface 
          facilityType={facilityType!}
          onComplete={handleMapComplete}
          onBack={() => setStep('facility')}
        />
      )}
      
      {step === 'constraints' && (
        <ConstraintForm 
          facilityType={facilityType!}
          onSubmit={handleConstraintsSubmit}
          onBack={() => setStep('map')}
        />
      )}
      
      {step === 'results' && (
        <ResultsDisplay 
          facilityType={facilityType!}
          propertyBounds={propertyBounds!}
          constraints={constraints!}
          onSave={handleSavePlan}
          onBack={() => isExample ? setStep('hero') : setStep('constraints')}
          isExample={isExample}
          onStartOwn={() => { setIsExample(false); setStep('hero'); }}
        />
      )}

      {showEmailCapture && (
        <EmailCapture 
          onSubmit={handleEmailSubmit}
          onClose={() => setShowEmailCapture(false)}
          facilityType={facilityType ?? undefined}
          budget={constraints?.budget}
        />
      )}
    </main>
  );
}
