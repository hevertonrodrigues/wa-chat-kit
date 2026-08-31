import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('shows the closed-window composer for expired sessions', async () => {
    const user = userEvent.setup();
    render(<ChatApp adapter={createMockAdapter({ latencyMs: 5 })} locale="pt-BR" />);
    await user.click(await screen.findByRole('button', { name: /Ana Lima/ }));
    // header pill + composer panel both announce it
    expect(await screen.findAllByText('Janela de 24h fechada')).toHaveLength(2);
    expect(screen.queryByPlaceholderText('Escreva uma mensagem…')).not.toBeInTheDocument();
  });
});
