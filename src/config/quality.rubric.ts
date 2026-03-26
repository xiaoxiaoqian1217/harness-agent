import { QualityRubric } from '../types/quality';

export const defaultQualityRubric: QualityRubric = {
  weights: {
    designQuality: 0.35,
    originality: 0.30,
    craftExecution: 0.20,
    functionalUsability: 0.15,
  },

  passThreshold: 85,
  pivotThreshold: 60,

  scoringGuidelines: {
    designQuality: [
      '90-100: Award-winning design, museum-grade aesthetics, strong visual identity, perfect alignment with brand guidelines',
      '80-89: Excellent design, professional quality, consistent visual language, modern aesthetic',
      '70-79: Good design, solid fundamentals, minor issues with visual hierarchy',
      '60-69: Average design, functional but lacks personality, inconsistent styling',
      '0-59: Poor design, broken layout, inconsistent styling, bad user experience',
    ],

    originality: [
      '90-100: Highly original, unique design language, no generic patterns, highly creative solutions',
      '80-89: Very original, mostly custom design, minimal use of default UI patterns',
      '70-79: Somewhat original, mix of custom and standard components, minor generic elements',
      '60-69: Low originality, heavy reliance on default UI library styles, few custom decisions',
      '0-59: Generic design, identical to common templates, no original creative decisions',
    ],

    craftExecution: [
      '90-100: Perfect execution, pixel-perfect, consistent spacing, typography, and color usage across all devices',
      '80-89: Excellent execution, very few minor imperfections, consistent design system usage',
      '70-79: Good execution, minor inconsistencies in spacing or typography',
      '60-69: Average execution, noticeable inconsistencies, some alignment or spacing issues',
      '0-59: Poor execution, broken layouts, inconsistent styling, accessibility issues',
    ],

    functionalUsability: [
      '90-100: Perfect functionality, all features work flawlessly, intuitive user experience, zero bugs',
      '80-89: Excellent functionality, almost no bugs, very intuitive to use',
      '70-79: Good functionality, minor bugs that don\'t affect core usage',
      '60-69: Average functionality, core features work but have noticeable bugs, some usability issues',
      '0-59: Poor functionality, core features broken, major bugs, bad user experience',
    ],
  },
};
