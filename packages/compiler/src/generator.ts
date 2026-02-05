/**
 * Code Generator - Generate TypeScript code from analyzed entities and routes
 * Uses templates and simple string concatenation
 * 
 * TODO: Use LLM for more sophisticated code generation in v0.2
 */

import type { EntityInfo, RouteInfo, AnalysisResult } from './types.js';

export function generateTypeScriptInterfaces(entities: Map<string, EntityInfo>): string {
  let code = '// Generated TypeScript interfaces\n';
  code += '// TODO: This is template-based. Future versions will use LLM for better code generation.\n\n';

  for (const [name, entity] of entities) {
    code += generateInterface(name, entity);
    code += '\n';
  }

  return code;
}

function generateInterface(name: string, entity: EntityInfo): string {
  let code = `/**\n * ${name}\n`;
  
  if (entity.properties.length > 0) {
    code += ` * Properties: ${entity.properties.map(p => p.name).join(', ')}\n`;
  }
  
  code += ` */\n`;
  code += `export interface ${name} {\n`;

  for (const prop of entity.properties) {
    const optional = prop.required ? '' : '?';
    code += `  /** ${prop.description || prop.name} */\n`;
    code += `  ${prop.name}${optional}: ${prop.type};\n`;
  }

  code += '}\n';

  return code;
}

export function generateZodSchemas(entities: Map<string, EntityInfo>): string {
  let code = '// Generated Zod validation schemas\n';
  code += '// TODO: Template-based validation. Future versions will use LLM for comprehensive validation.\n\n';
  code += `import { z } from 'zod';\n\n`;

  for (const [name, entity] of entities) {
    code += generateZodSchema(name, entity);
    code += '\n';
  }

  return code;
}

function generateZodSchema(name: string, entity: EntityInfo): string {
  let code = `export const ${name}Schema = z.object({\n`;

  for (const prop of entity.properties) {
    let zodType = 'z.string()';
    
    switch (prop.type) {
      case 'string':
        zodType = 'z.string()';
        break;
      case 'number':
        zodType = 'z.number()';
        break;
      case 'boolean':
        zodType = 'z.boolean()';
        break;
      case 'Date':
        zodType = 'z.date()';
        break;
      case 'string[]':
        zodType = 'z.array(z.string())';
        break;
      default:
        zodType = 'z.string()';
    }

    // Apply validations
    for (const validation of entity.validations) {
      if (validation.field === prop.name) {
        if (validation.rule === 'length' && validation.constraint) {
          const [min, max] = validation.constraint.split('-').map(Number);
          zodType = `z.string().min(${min}).max(${max})`;
        }
      }
    }

    if (!prop.required) {
      zodType += '.optional()';
    }

    code += `  ${prop.name}: ${zodType},\n`;
  }

  code += '});\n';
  code += `\nexport type ${name} = z.infer<typeof ${name}Schema>;\n`;

  return code;
}

export function generateExpressRoutes(routes: RouteInfo[], entities: Map<string, EntityInfo>): string {
  let code = '// Generated Express routes\n';
  code += '// TODO: Template-based routes. Future versions will use LLM for complete API implementation.\n\n';
  code += `import express, { Request, Response } from 'express';\n`;
  code += `const router = express.Router();\n\n`;
  code += `// TODO: Implement data store (currently just in-memory Map)\n`;
  code += `const dataStore = new Map<string, any>();\n\n`;

  for (const route of routes) {
    code += generateRoute(route);
    code += '\n';
  }

  code += `export default router;\n`;

  return code;
}

function generateRoute(route: RouteInfo): string {
  const method = route.method.toLowerCase();
  const handlerName = `${method}${route.path.replace(/\//g, '_').replace(/:/g, '')}`;
  
  let code = `// ${route.description}\n`;
  code += `router.${method}('${route.path}', async (req: Request, res: Response) => {\n`;
  code += `  try {\n`;
  code += `    // TODO: Implement ${route.description}\n`;
  
  if (route.method === 'GET' && route.path.includes(':id')) {
    code += `    const id = req.params.id;\n`;
    code += `    const item = dataStore.get(id);\n`;
    code += `    if (!item) {\n`;
    code += `      return res.status(404).json({ error: 'Not found' });\n`;
    code += `    }\n`;
    code += `    res.json(item);\n`;
  } else if (route.method === 'GET') {
    code += `    const items = Array.from(dataStore.values());\n`;
    code += `    res.json(items);\n`;
  } else if (route.method === 'POST') {
    code += `    const data = req.body;\n`;
    code += `    const id = Math.random().toString(36).substr(2, 9);\n`;
    code += `    dataStore.set(id, { id, ...data });\n`;
    code += `    res.status(201).json({ id, ...data });\n`;
  } else if (route.method === 'PUT' || route.method === 'PATCH') {
    code += `    const id = req.params.id;\n`;
    code += `    const existing = dataStore.get(id);\n`;
    code += `    if (!existing) {\n`;
    code += `      return res.status(404).json({ error: 'Not found' });\n`;
    code += `    }\n`;
    code += `    const updated = { ...existing, ...req.body };\n`;
    code += `    dataStore.set(id, updated);\n`;
    code += `    res.json(updated);\n`;
  } else if (route.method === 'DELETE') {
    code += `    const id = req.params.id;\n`;
    code += `    if (!dataStore.has(id)) {\n`;
    code += `      return res.status(404).json({ error: 'Not found' });\n`;
    code += `    }\n`;
    code += `    dataStore.delete(id);\n`;
    code += `    res.status(204).send();\n`;
  }
  
  code += `  } catch (error) {\n`;
  code += `    console.error('Error:', error);\n`;
  code += `    res.status(500).json({ error: 'Internal server error' });\n`;
  code += `  }\n`;
  code += `});\n`;

  return code;
}

export function generatePackageJson(projectName: string): string {
  const pkg = {
    name: projectName,
    version: '0.1.0',
    description: 'Generated from Natural language specification',
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      dev: 'tsx watch src/index.ts',
      start: 'node dist/index.js',
    },
    dependencies: {
      express: '^4.18.0',
      zod: '^3.22.0',
    },
    devDependencies: {
      '@types/express': '^4.17.0',
      '@types/node': '^20.0.0',
      typescript: '^5.0.0',
      tsx: '^4.0.0',
    },
  };

  return JSON.stringify(pkg, null, 2);
}

export function generateTsConfig(): string {
  const config = {
    compilerOptions: {
      target: 'ES2020',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      lib: ['ES2020'],
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  return JSON.stringify(config, null, 2);
}

export function generateMainFile(): string {
  return `// Generated Express server
// TODO: Template-based server. Future versions will use LLM for complete implementation.

import express from 'express';
import router from './routes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', router);

app.get('/', (req, res) => {
  res.json({ message: 'API is running. See /api for endpoints.' });
});

app.listen(port, () => {
  console.log(\`Server running on http://localhost:\${port}\`);
});
`;
}

export function generateReadme(projectName: string): string {
  return `# ${projectName}

Generated from Natural language specification (.nl file).

## Setup

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
npm start
\`\`\`

## Notes

This is a template-based generation from Natural v0.1.
Future versions will use LLM-powered compilation for more sophisticated implementations.

Generated types and validation schemas are in the src/ directory.
API routes are defined in src/routes.ts.

---

Generated by Natural Language Compiler
https://github.com/offloadmywork/natural-lang
`;
}
