'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  createLiquidButton,
  LiquidButtonEventMap,
  LiquidButtonHandle,
  LiquidButtonOptions,
} from '@avenra/liquid-glass';

/**
 * Fully type-safe event handler mapping
 */
type LiquidButtonEvents = {
  [K in keyof LiquidButtonEventMap]?: (event: LiquidButtonEventMap[K]) => void;
};

export interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  options?: LiquidButtonOptions;
  events?: LiquidButtonEvents;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ label, options, events, onClick, ...props }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const handleRef = useRef<LiquidButtonHandle | null>(null);

    useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

    /**
     * Initialize + cleanup lifecycle
     */
    useEffect(() => {
      if (!buttonRef.current) return;

      handleRef.current = createLiquidButton(buttonRef.current, {
        label,
        glassThickness: 100,
        bezelWidth: 12,
        refractiveIndex: 1.5,
        profile: "convexSquircle",
        ...options,
      });

      return () => {
        handleRef.current?.destroy();
        handleRef.current = null;
      };
    }, []);

    /**
     * Sync label updates
     */
    useEffect(() => {
      handleRef.current?.setLabel(label);
    }, [label]);

    /**
     * Strictly typed event binding (no unsafe iteration tricks)
     */
    useEffect(() => {
      if (!handleRef.current) return;
      
      if (events) {
        (Object.keys(events) as (keyof LiquidButtonEventMap)[]).forEach((event) => {
          const handler = events[event];
          if (handler) {
            handleRef.current?.on(event, handler as (e: LiquidButtonEventMap[typeof event]) => void);
          }
        });
      }

      if (onClick) {
        handleRef.current?.on('click', onClick as unknown as (e: LiquidButtonEventMap['click']) => void);
      }

      return () => {
        if (!handleRef.current) return;
        if (events) {
          (Object.keys(events) as (keyof LiquidButtonEventMap)[]).forEach((event) => {
            handleRef.current?.off?.(event);
          });
        }
      };
    }, [events, onClick]);

    return (
      <button 
        ref={buttonRef} 
        onClick={(e) => {
          if (props.disabled) return;
          if (onClick) onClick(e);
          if (events?.click) events.click(e as unknown as LiquidButtonEventMap['click']);
        }} 
        {...props} 
      />
    );
  },
);

LiquidButton.displayName = 'LiquidButton';
