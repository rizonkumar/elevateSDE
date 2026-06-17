'use client';

import * as React from 'react';
import { motion, useReducedMotion, type Target, type Transition } from 'framer-motion';

interface InterviewerWaveformProps {
  micLevel: number;
  isAiSpeaking: boolean;
  isMicActive: boolean;
}

const BAR_COUNT = 28;
const MULTIPLIERS = Array.from({ length: BAR_COUNT }, (_, index) =>
  0.4 + 0.6 * Math.abs(Math.sin(index * 1.7)),
);

export function InterviewerWaveform({
  micLevel,
  isAiSpeaking,
  isMicActive,
}: InterviewerWaveformProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="flex h-28 w-full items-center justify-center gap-1 sm:h-32 sm:gap-1.5"
    >
      {MULTIPLIERS.map((multiplier, index) => {
        let animate: Target;
        let transition: Transition;

        if (isAiSpeaking && !reduceMotion) {
          const peak = 16 + multiplier * 84;
          animate = { height: [14, peak, 20, peak * 0.7, 14] };
          transition = {
            duration: 1.1,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.03,
          };
        } else if (isMicActive) {
          animate = { height: 12 + micLevel * 100 * multiplier };
          transition = { duration: 0.12, ease: 'easeOut' };
        } else {
          animate = { height: 10 + multiplier * 8 };
          transition = { duration: 0.3, ease: 'easeOut' };
        }

        return (
          <motion.span
            key={index}
            className="w-1 rounded-full bg-(--color-accent) sm:w-1.5"
            style={{ height: 14 }}
            animate={animate}
            transition={transition}
          />
        );
      })}
    </div>
  );
}
