import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
  stories: [
    '../design-system/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-controls',
    '@storybook/addon-docs'
  ],
  framework: {
    name: '@storybook/html-vite',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  staticDirs: ['../design-system'],
  
  // Viewports customizados para mobile-first testing
  viewport: {
    viewports: {
      'mobile-small': {
        name: 'Mobile Small (320px)',
        styles: { width: '320px', height: '568px' },
        type: 'mobile'
      },
      'mobile-medium': {
        name: 'Mobile Medium (375px)',
        styles: { width: '375px', height: '667px' },
        type: 'mobile'
      },
      'mobile-large': {
        name: 'Mobile Large (414px)',
        styles: { width: '414px', height: '896px' },
        type: 'mobile'
      },
      'tablet': {
        name: 'Tablet (768px)',
        styles: { width: '768px', height: '1024px' },
        type: 'tablet'
      },
      'desktop-small': {
        name: 'Desktop Small (1024px)',
        styles: { width: '1024px', height: '768px' },
        type: 'desktop'
      },
      'desktop-medium': {
        name: 'Desktop Medium (1280px)',
        styles: { width: '1280px', height: '800px' },
        type: 'desktop'
      },
      'desktop-large': {
        name: 'Desktop Large (1536px)',
        styles: { width: '1536px', height: '864px' },
        type: 'desktop'
      }
    }
  }
};

export default config;
