import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const typescript = createRequire(import.meta.url).resolve('typescript/bin/tsc');
const consumer = mkdtempSync(join(tmpdir(), 'spectrum-package-test-'));
const run = (command, args, cwd = consumer) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, npm_config_cache: join(consumer, '.npm-cache') },
  });
try {
  const [packed] = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', consumer], root));
  assert.ok(
    packed.files.every(
      ({ path }) => path === 'LICENSE' || path === 'README.md' || path === 'package.json' || path.startsWith('dist/')
    )
  );
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', join(consumer, packed.filename)]);
  writeFileSync(
    join(consumer, 'check.mjs'),
    `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import * as api from '@audiovisualizer/spectrum';
    assert.equal(typeof api.createSpectrumVisualizer, 'function');
    assert.equal(api.DEFAULT_NOTE_HUES.length, 12);
    assert.equal('SpectrumVisualizer' in api, false);
    assert.throws(() => createRequire(import.meta.url).resolve('react'), { code: 'MODULE_NOT_FOUND' });
    console.log('Installed core imports without React or browser globals.');
  `
  );
  process.stdout.write(run(process.execPath, ['check.mjs']));
  writeFileSync(
    join(consumer, 'check.ts'),
    `
    import { createSpectrumVisualizer, type SpectrumVisualizerOptions } from '@audiovisualizer/spectrum';
    const options: SpectrumVisualizerOptions = { maxHeight: 300, showScroll: true };
    const instance = createSpectrumVisualizer(document.createElement('div'), options);
    instance.update({ analyser: null, brightnessPower: 2 });
    instance.destroy();
  `
  );
  writeFileSync(
    join(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        module: 'NodeNext',
        target: 'ES2022',
        lib: ['ES2022', 'DOM'],
        types: [],
      },
      files: ['check.ts'],
    })
  );
  run(process.execPath, [typescript, '-p', join(consumer, 'tsconfig.json')]);
  console.log('Installed core declarations typecheck without React types.');
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
