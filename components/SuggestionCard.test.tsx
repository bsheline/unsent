import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SuggestionCard from './SuggestionCard';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe('SuggestionCard', () => {
  const defaultProps = {
    reply: 'This is a great reply!',
    rationale: 'Because it is polite and direct.',
    tone: 'Playful',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the reply, rationale, and tone', () => {
    render(<SuggestionCard {...defaultProps} />);

    expect(screen.getByText(`"${defaultProps.reply}"`)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.rationale)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.tone)).toBeInTheDocument();
  });

  it('copies the reply to clipboard and triggers fetch when copy button is clicked', async () => {
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    render(<SuggestionCard {...defaultProps} />);

    const copyButton = screen.getByRole('button', { name: /copy reply/i });

    await userEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.reply);

    expect(global.fetch).toHaveBeenCalledWith('/api/style-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: defaultProps.reply }),
    });
  });

  it('applies correct tone colors based on tone text', () => {
    const { rerender } = render(<SuggestionCard {...defaultProps} tone="Playful" />);
    let toneBadge = screen.getByText('Playful');
    expect(toneBadge).toHaveClass('bg-pink-100');

    rerender(<SuggestionCard {...defaultProps} tone="Direct" />);
    toneBadge = screen.getByText('Direct');
    expect(toneBadge).toHaveClass('bg-blue-100');

    rerender(<SuggestionCard {...defaultProps} tone="Warm" />);
    toneBadge = screen.getByText('Warm');
    expect(toneBadge).toHaveClass('bg-orange-100');

    rerender(<SuggestionCard {...defaultProps} tone="Neutral" />);
    toneBadge = screen.getByText('Neutral');
    expect(toneBadge).toHaveClass('bg-gray-100');
  });
});
