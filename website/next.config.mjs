import { createMDX } from 'fumadocs-mdx/next';
import { fileURLToPath } from 'node:url';
import { basePath } from './lib/site.ts';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    root: fileURLToPath(new URL('..', import.meta.url)),
  },
};

export default withMDX(config);
