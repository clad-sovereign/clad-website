// @ts-check
import { defineConfig } from 'astro/config';

import solidJs from '@astrojs/solid-js';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://clad.so',
  integrations: [
    solidJs(),
    sitemap({
      // Automatically generate sitemap with current lastmod date
      changefreq: 'monthly',
      priority: 1.0,
    })
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});