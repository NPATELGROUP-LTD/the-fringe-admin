'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingProps {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

export function Onboarding({ steps, onComplete, onSkip, autoStart = false }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(autoStart);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      const element = document.querySelector(steps[currentStep].target);
      if (element) {
        setTargetElement(element);
        updateTooltipPosition(element, steps[currentStep].position || 'bottom');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, isActive, steps]);

  const updateTooltipPosition = (element: Element, position: string) => {
    const rect = element.getBoundingClientRect();
    const tooltipHeight = 120; // approximate
    const tooltipWidth = 300; // approximate

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - 10;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + 10;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - 10;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + 10;
        break;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 10) left = 10;
    if (left + tooltipWidth > viewportWidth - 10) left = viewportWidth - tooltipWidth - 10;
    if (top < 10) top = 10;
    if (top + tooltipHeight > viewportHeight - 10) top = viewportHeight - tooltipHeight - 10;

    setTooltipPosition({ top, left });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    setTargetElement(null);
    onComplete?.();
  };

  const skipTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    setTargetElement(null);
    onSkip?.();
  };

  const startTour = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  if (!isActive) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 pointer-events-none" />

      {/* Highlight target element */}
      {targetElement && (
        <div
          className="fixed z-50 border-2 border-primary rounded-lg pointer-events-none"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-primary text-secondary p-4 rounded-lg shadow-xl max-w-sm"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{step.title}</h3>
            <span className="text-sm text-secondary opacity-75">
              {currentStep + 1} of {steps.length}
            </span>
          </div>
          <p className="text-secondary">{step.content}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={skipTour}
              className="text-secondary border-secondary hover:bg-secondary hover:text-primary"
            >
              Skip Tour
            </Button>
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={prevStep}>
                Previous
              </Button>
            )}
          </div>

          <Button onClick={nextStep} size="sm">
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </>
  );
}

// Hook to manage onboarding state
export function useOnboarding(tourId: string) {
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(`onboarding_${tourId}_completed`);
    setHasCompleted(completed === 'true');
  }, [tourId]);

  const markCompleted = () => {
    localStorage.setItem(`onboarding_${tourId}_completed`, 'true');
    setHasCompleted(true);
  };

  const reset = () => {
    localStorage.removeItem(`onboarding_${tourId}_completed`);
    setHasCompleted(false);
  };

  return { hasCompleted, markCompleted, reset };
}