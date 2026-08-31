import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatApp } from '../../src/react/ChatApp';
import { createMockAdapter } from '../../src/mock/mockAdapter';
import '../../src/styles.css';

function Demo() {
  const adapter = useMemo(() => createMockAdapter(), []);
  const [light, setLight] = useState(false);
  const [locale, setLocale] = useState<'pt-BR' | 'en' | 'es'>('pt-BR');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header>
        <h1>wa-chat-kit — demo</h1>
        <button type="button" onClick={() => setLight((v) => !v)}>
          {light ? 'dark' : 'light'}
        </button>
        <button
          type="button"
          onClick={() => setLocale((l) => (l === 'pt-BR' ? 'en' : l === 'en' ? 'es' : 'pt-BR'))}
        >
          {locale}
        </button>
      </header>
      <div id="root-inner" style={{ flex: 1, minHeight: 0, padding: '0 20px 20px' }}>
        <div className={light ? 'wck-light' : ''} style={{ height: '100%' }}>
          <ChatApp
            adapter={adapter}
            locale={locale}
            renderSessionClosedAction={() => (
              <button
                type="button"
                style={{
                  alignSelf: 'center',
                  background: '#00a884',
                  color: '#06281a',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => alert('host abre o seletor de templates aqui')}
              >
                Enviar template
              </button>
            )}
          />
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
