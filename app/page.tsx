'use client';

import { useState } from 'react';
import Hero from '@/components/Hero';
import MapInterface from '@/components/MapInterface';
import FacilitySelector from '@/components/FacilitySelector';
import ConstraintForm from '@/components/ConstraintForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import EmailCapture from '@/components/EmailCapture';
import { FacilityType, Constraints, PropertyBounds } from '@/lib/layoutOptimizer';

export default function Home() {
  const [step, setStep] = useState<'hero' | 'facility' | 'map' | 'constraints' | 'results'>('hero');
  const [facilityType, setFacilityType] = useState<FacilityType>(null);
  const [propertyBounds, setPropertyBounds] = useState<PropertyBounds | null>(null);
  const [constraints, setConstraints] = useState<Constraints | null>(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const handleStart = () => {
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
      {step === 'hero' && <Hero onStart={handleStart} />}
      
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
          onBack={() => setStep('constraints')}
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
