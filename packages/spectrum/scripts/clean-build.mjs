import { rmSync } from 'node:fs';

// Prevent removed entry points from surviving into a published tarball.
rmSync(new URL('../dist/', import.meta.url), { recursive: true, force: true });
