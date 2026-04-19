import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversationInput from './ConversationInput';

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

// Mock FileReader
class MockFileReader {
  onload: ((event: any) => void) | null = null;
  readAsDataURL = jest.fn(function (this: any, file: File) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({
          target: {
            result: 'data:image/png;base64,mockBase64',
          },
        });
      }
    }, 0);
  });
}
global.FileReader = MockFileReader as any;

// Mock alert
global.alert = jest.fn();

describe('ConversationInput', () => {
  const mockOnSuggestions = jest.fn();
  const defaultProps = {
    matchId: 'test-match-id',
    onSuggestions: mockOnSuggestions,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<ConversationInput {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Paste the latest message from them.../i)).toBeInTheDocument();
    expect(screen.getByTitle(/Upload screenshot/i)).toBeInTheDocument();
  });

  it('updates textarea value on change', async () => {
    render(<ConversationInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Paste the latest message from them.../i);
    await userEvent.type(textarea, 'Hello, how are you?');
    expect(textarea).toHaveValue('Hello, how are you?');
  });

  it('disables submit button when input is empty', () => {
    render(<ConversationInput {...defaultProps} />);
    const submitButton = screen.getByTitle('Send');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when text is entered', async () => {
    render(<ConversationInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Paste the latest message from them.../i);
    const submitButton = screen.getByTitle('Send');

    await userEvent.type(textarea, 'Hi');
    expect(submitButton).not.toBeDisabled();
  });

  it('submits the form and calls onSuggestions on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestions: [{ reply: 'Hey!', rationale: 'Friendly', tone: 'Warm' }] }),
    });

    render(<ConversationInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Paste the latest message from them.../i);
    await userEvent.type(textarea, 'How is it going?');

    const submitButton = screen.getByTitle('Send');

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/suggest', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-id',
          input: 'How is it going?',
          imageBase64: null,
          mediaType: null
        }),
      }));
    });

    expect(mockOnSuggestions).toHaveBeenCalledWith([{ reply: 'Hey!', rationale: 'Friendly', tone: 'Warm' }]);
    expect(textarea).toHaveValue('');
  });

  it('handles image upload and submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestions: [] }),
    });

    render(<ConversationInput {...defaultProps} />);

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const hiddenFileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(hiddenFileInput, file);

    // Check if preview is rendered
    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
    });

    const submitButton = screen.getByTitle('Send');

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/suggest', expect.objectContaining({
        body: JSON.stringify({
          matchId: 'test-match-id',
          input: '',
          imageBase64: 'mockBase64',
          mediaType: 'image/png'
        }),
      }));
    });
  });

  it('can clear the uploaded image', async () => {
    render(<ConversationInput {...defaultProps} />);

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const hiddenFileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(hiddenFileInput, file);

    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
    });

    const clearButton = screen.getByTitle('Remove image');
    await userEvent.click(clearButton);

    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
  });

  it('shows alert on API failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<ConversationInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Paste the latest message from them.../i);
    await userEvent.type(textarea, 'Failure test');

    const submitButton = screen.getByTitle('Send');

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Failed to get suggestions. Make sure you are on the PRO plan.");
    });
  });
});
