import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatApp } from '../src/react/ChatApp';
import { createMockAdapter } from '../src/mock/mockAdapter';

describe('ChatApp', () => {
  it('renders conversations, opens a thread, sends optimistically', async () => {
    const user = userEvent.setup();
    render(<ChatApp adapter={createMockAdapter({ latencyMs: 5, echo: false })} locale="pt-BR" />);

    // list loads
    const row = await screen.findByRole('button', { name: /Maria Souza/ });
    expect(screen.getByPlaceholderText('Buscar conversas…')).toBeInTheDocument();

    // open thread
    await user.click(row);
    await screen.findByRole('heading', { name: 'Maria Souza' });
    await waitFor(() => expect(screen.getByText(/em estoque\?/)).toBeInTheDocument());

    // formatted text rendered as tokens (bold), never raw markers
    expect(screen.getByText('obrigada').tagName).toBe('STRONG');

    // optimistic send: bubble appears immediately
    const input = screen.getByPlaceholderText('Escreva uma mensagem…');
    await user.type(input, 'chegando em 10 min');
    await user.keyboard('{Enter}');
    expect(await screen.findByText('chegando em 10 min')).toBeInTheDocument();
    // reconciles to sent (mock returns ids)
    await waitFor(() =>
      expect(screen.getAllByRole('img', { name: 'Enviada' }).length).toBeGreaterThan(0),
    );
  });

  it('opens a conversation the host deep-linked, and reports every change', async () => {
    const user = userEvent.setup();
    const seen: (string | null)[] = [];
    const { container, unmount } = render(
      <ChatApp
        adapter={createMockAdapter({ latencyMs: 5, echo: false })}
        locale="pt-BR"
        initialConversationId="conv-joao"
        onConversationChange={(id) => seen.push(id)}
      />,
    );
    // The thread opens on its own once the list knows the id.
    await within(container).findByRole('heading', { name: 'João Pereira' });
    await waitFor(() => expect(seen).toContain('conv-joao'));

    // Going back must stick — a deep link is applied once, not re-applied.
    await user.click(within(container).getByRole('button', { name: '←' }));
    await waitFor(() => expect(seen[seen.length - 1]).toBeNull());
    expect(
      within(container).queryByRole('heading', { name: 'João Pereira' }),
    ).not.toBeInTheDocument();
    unmount();
  });

  it('colours the account badge when the host assigns accountColor', async () => {
    // Earlier renders stay mounted (no global cleanup) — scope to this one.
    const { container, unmount } = render(
      <ChatApp adapter={createMockAdapter({ latencyMs: 5 })} locale="pt-BR" />,
    );
    await within(container).findByRole('button', { name: /Maria Souza/ });
    const badge = container.querySelector('.wck-account-badge-colored') as HTMLElement | null;
    expect(badge).not.toBeNull();
    expect(badge).toHaveTextContent('Loja Centro');
    expect(badge?.style.getPropertyValue('--wck-account-color')).toBe('#5fa9f0');
    expect(badge?.querySelector('.wck-account-dot')).not.toBeNull();
    unmount();
  });

  it('shows the closed-window composer for expired sessions', async () => {
    const user = userEvent.setup();
    render(<ChatApp adapter={createMockAdapter({ latencyMs: 5 })} locale="pt-BR" />);
    await user.click(await screen.findByRole('button', { name: /Ana Lima/ }));
    // header pill + composer panel both announce it
    expect(await screen.findAllByText('Janela de 24h fechada')).toHaveLength(2);
    expect(screen.queryByPlaceholderText('Escreva uma mensagem…')).not.toBeInTheDocument();
  });
});
