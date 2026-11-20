import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { test } from 'node:test';

const output = new URL('../out/', import.meta.url);
const slugs = ['', 'strict-typing', 'change-control', 'serialization', 'state-pattern'];

test('exports every guide with working GitHub Pages links and assets', async () => {
  for (const slug of slugs) {
    const html = await readFile(new URL(`${slug ? `${slug}/` : ''}index.html`, output), 'utf8');
    assert.match(html, /<h1\b/);
    for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (!value.startsWith('/') || value.startsWith('//')) continue;
      const pathname = new URL(value, 'https://cardforest.github.io').pathname;
      assert.ok(pathname.startsWith('/master-class/'), `unprefixed URL: ${value}`);
      const relative = decodeURIComponent(pathname.slice('/master-class/'.length));
      await access(new URL(relative.endsWith('/') || relative === '' ? `${relative}index.html` : relative, output));
    }
  }
});

test('exports searchable content for every guide without a server endpoint', async () => {
  const index = JSON.parse(await readFile(new URL('search.json', output), 'utf8'));
  const records = Object.values(index.docs.docs);
  for (const slug of slugs) {
    assert.ok(records.some((record) => record.type === 'page' && record.url === `/${slug}`),
      `missing search page: ${slug || 'home'}`);
  }
});
