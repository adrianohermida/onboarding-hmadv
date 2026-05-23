import type { Preview } from '@storybook/html-vite';
import '../design-system/tokens/core-v2.css';
import '../design-system/components/base-v2.css';
import '../styles/components.css';
import { initUiKit } from '../components/ui/index.js';

// Decorador global para injetar contexto de auth simulado ou herdado
const withAuthContext = (story: () => HTMLElement) => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '100%';
  
  // Tenta detectar se está rodando dentro do Shell Admin
  const isInIframe = window.location !== window.parent.location;
  
  if (isInIframe) {
    // Escuta mensagem do pai (Shell Admin) com dados de auth
    window.addEventListener('message', (event) => {
      if (event.data.type === 'AUTH_SYNC') {
        console.log('[Storybook] Auth sincronizada do Admin:', event.data.user);
        // Aqui você pode injetar o user em variáveis globais se seus componentes precisarem
        window.__STORYBOOK_USER__ = event.data.user;
      }
    });
    
    // Solicita auth ao pai
    window.parent.postMessage({ type: 'REQUEST_AUTH' }, '*');
  }

  wrapper.appendChild(story());
  initUiKit(wrapper);
  return wrapper;
};

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'padded',

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  decorators: [withAuthContext],
};

export default preview;