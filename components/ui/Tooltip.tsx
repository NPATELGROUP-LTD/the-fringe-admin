'use client';

import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-primary';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-primary';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-primary';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-primary';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-primary';
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 px-3 py-2 text-sm text-secondary bg-primary rounded shadow-lg whitespace-nowrap ${getPositionClasses()}`}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`}
            style={{ borderWidth: '4px' }}
          />
        </div>
      )}
    </div>
  );
}