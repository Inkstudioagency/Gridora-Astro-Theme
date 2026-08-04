// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  build: {
    // Always emit stylesheets as external /_astro/*.css files. The default
    // ('auto') inlines small ones into a <style> tag, which would leave a page
    // with no stylesheet link at all.
    inlineStylesheets: 'never',
  },
});
