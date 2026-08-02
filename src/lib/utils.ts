import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The single class-composition helper for the entire platform (T0.7 §4).
 * Merges conditional classes and resolves Tailwind conflicts so variant
 * classes and consumer layout classes compose predictably.
 *
 * tailwind-merge is extended with our design-token type scale: without
 * this, custom font-size utilities (text-h1 … text-numeric) are mistaken
 * for text-color utilities and wrongly dropped when combined with color
 * classes like text-content (bug found in T1.3 verification).
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-h1',
        'text-h2',
        'text-h3',
        'text-body-lg',
        'text-body',
        'text-caption',
        'text-numeric',
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
