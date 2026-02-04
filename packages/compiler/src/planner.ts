/**
 * Step 3: Generate file plan from analysis
 */

import type { Analysis, FilePlan } from './types.js';

export class Planner {
  plan(analysis: Analysis): FilePlan[] {
    const plans: FilePlan[] = [];

    // Config files
    plans.push({
      path: 'package.json',
      purpose: 'Project configuration and dependencies',
      dependencies: [],
      type: 'config',
    });

    plans.push({
      path: 'tsconfig.json',
      purpose: 'TypeScript configuration',
      dependencies: [],
      type: 'config',
    });

    plans.push({
      path: 'vite.config.ts',
      purpose: 'Vite build configuration',
      dependencies: [],
      type: 'config',
    });

    plans.push({
      path: 'index.html',
      purpose: 'HTML entry point',
      dependencies: [],
      type: 'entry',
    });

    plans.push({
      path: 'tailwind.config.js',
      purpose: 'Tailwind CSS configuration',
      dependencies: [],
      type: 'config',
    });

    plans.push({
      path: 'postcss.config.js',
      purpose: 'PostCSS configuration',
      dependencies: [],
      type: 'config',
    });

    // Data models
    for (const model of analysis.dataModels) {
      plans.push({
        path: `src/types/${model.name}.ts`,
        purpose: `TypeScript interface and Zod schema for ${model.name}`,
        dependencies: [],
        type: 'model',
      });
    }

    // Storage/state management
    if (analysis.storage || analysis.dataModels.length > 0) {
      plans.push({
        path: 'src/store/index.ts',
        purpose: 'State management and storage',
        dependencies: analysis.dataModels.map((m) => `src/types/${m.name}.ts`),
        type: 'logic',
      });
    }

    // API client (if API endpoints exist)
    if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) {
      plans.push({
        path: 'src/api/client.ts',
        purpose: 'API client for backend communication',
        dependencies: analysis.dataModels.map((m) => `src/types/${m.name}.ts`),
        type: 'logic',
      });
    }

    // Behaviors/hooks
    for (const behavior of analysis.behaviors) {
      const fileName = behavior.name
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
      plans.push({
        path: `src/hooks/use-${fileName}.ts`,
        purpose: `Hook for ${behavior.description}`,
        dependencies: [
          'src/store/index.ts',
          ...analysis.dataModels.map((m) => `src/types/${m.name}.ts`),
        ],
        type: 'logic',
      });
    }

    // UI Components
    for (const component of analysis.uiComponents) {
      plans.push({
        path: `src/components/${component.name}.tsx`,
        purpose: `React component: ${component.description}`,
        dependencies: [
          'src/store/index.ts',
          ...analysis.dataModels.map((m) => `src/types/${m.name}.ts`),
          ...analysis.behaviors.map((b) => {
            const fileName = b.name
              .replace(/([A-Z])/g, '-$1')
              .toLowerCase()
              .replace(/^-/, '');
            return `src/hooks/use-${fileName}.ts`;
          }),
        ],
        type: 'component',
      });
    }

    // Main App entry
    plans.push({
      path: 'src/App.tsx',
      purpose: 'Main application component',
      dependencies: analysis.uiComponents.map((c) => `src/components/${c.name}.tsx`),
      type: 'component',
    });

    plans.push({
      path: 'src/main.tsx',
      purpose: 'Application entry point',
      dependencies: ['src/App.tsx'],
      type: 'entry',
    });

    plans.push({
      path: 'src/index.css',
      purpose: 'Global styles',
      dependencies: [],
      type: 'config',
    });

    return plans;
  }
}

export function createPlanner(): Planner {
  return new Planner();
}
