import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
  stories: [
    {
      directory: '../design-system/stories',
      files: '**/*.stories.@(js|jsx|mjs|ts|tsx)'
    },
    {
      directory: '../components',
      files: '**/*.stories.@(js|jsx|mjs|ts|tsx)'
    }
  ],

  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-links',
    '@storybook/addon-a11y',
    '@storybook/addon-mcp'
  ],

  framework: {
    name: '@storybook/html-vite',
    options: {}
  },

  staticDirs: ['../design-system']
};

export default config;
