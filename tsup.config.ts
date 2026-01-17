import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'editor/index': 'src/editor/index.ts',
    'formula-spec': 'src/formula-spec.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  noExternal: ['subscript'],
});
