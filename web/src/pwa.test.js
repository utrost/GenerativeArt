import { describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..');
const readText = (path) => readFileSync(resolve(root, path), 'utf8');

describe('PWA document metadata', () => {
  it('links the web app manifest and install icons from index.html with /genart/ URLs', () => {
    const html = readText('index.html');

    expect(html).toContain('<link rel="manifest" href="/genart/manifest.webmanifest"');
    expect(html).toContain('<meta name="theme-color" content="#111827"');
    expect(html).toContain('<link rel="apple-touch-icon" href="/genart/icons/icon-192.png"');
  });

  it('keeps mobile.html PWA-ready when that entry point exists', () => {
    const mobilePath = resolve(root, 'mobile.html');
    if (!existsSync(mobilePath)) return;

    const html = readFileSync(mobilePath, 'utf8');
    expect(html).toContain('<link rel="manifest" href="/genart/manifest.webmanifest"');
    expect(html).toContain('<meta name="theme-color" content="#111827"');
    expect(html).toContain('<link rel="apple-touch-icon" href="/genart/icons/icon-192.png"');
  });
});

describe('service worker registration', () => {
  it('registers the service worker under the /genart/ base path after window load', async () => {
    const listeners = new Map();
    const register = vi.fn(() => Promise.resolve({ scope: '/genart/' }));
    const fakeWindow = {
      addEventListener: vi.fn((event, handler) => listeners.set(event, handler)),
    };
    const fakeNavigator = { serviceWorker: { register } };

    const { registerServiceWorker } = await import('./registerServiceWorker.js');
    const registered = registerServiceWorker({ windowRef: fakeWindow, navigatorRef: fakeNavigator });

    expect(fakeWindow.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
    await listeners.get('load')();
    await registered;

    expect(register).toHaveBeenCalledWith('/genart/sw.js', { scope: '/genart/' });
  });
});

describe('web app manifest', () => {
  it('defines install metadata, /genart/ scope/start URL, and maskable PNG icons', () => {
    const manifest = JSON.parse(readText('public/manifest.webmanifest'));

    expect(manifest.name).toBe('Generative Art');
    expect(manifest.short_name).toBe('GenArt');
    expect(manifest.start_url).toBe('/genart/');
    expect(manifest.scope).toBe('/genart/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#111827');
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/genart/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: expect.stringContaining('maskable') }),
        expect.objectContaining({ src: '/genart/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: expect.stringContaining('maskable') }),
      ]),
    );
  });
});

describe('service worker cache', () => {
  it('pre-caches the app shell and PWA assets using /genart/ paths', () => {
    const source = readText('public/sw.js');

    expect(source).toMatch(/const\s+CACHE_NAME\s*=\s*['"]genart-/);
    expect(source).toContain("'/genart/'");
    expect(source).toContain("'/genart/manifest.webmanifest'");
    expect(source).toContain("'/genart/icons/icon-192.png'");
    expect(source).toContain("'/genart/icons/icon-512.png'");
    expect(source).toContain('self.addEventListener(\'install\'');
    expect(source).toContain('self.addEventListener(\'activate\'');
    expect(source).toContain('self.addEventListener(\'fetch\'');
  });
});
