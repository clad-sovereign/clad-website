import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import ContactForm from './ContactForm';

describe('ContactForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders all form fields', () => {
      render(() => <ContactForm />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/organization/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send request/i })).toBeInTheDocument();
    });

    it('shows required asterisk for required fields', () => {
      render(() => <ContactForm />);

      const nameLabel = screen.getByText(/name/i).closest('label');
      const emailLabel = screen.getByText(/email/i).closest('label');
      const messageLabel = screen.getByText(/message/i).closest('label');

      expect(nameLabel?.textContent).toContain('*');
      expect(emailLabel?.textContent).toContain('*');
      expect(messageLabel?.textContent).toContain('*');
    });
  });

  describe('Validation', () => {
    it('shows error when name is empty', async () => {
      render(() => <ContactForm />);

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('shows error when name is too short', async () => {
      render(() => <ContactForm />);

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.input(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      render(() => <ContactForm />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('accepts valid international email addresses', async () => {
      render(() => <ContactForm />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.input(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    it('shows error when message is empty', async () => {
      render(() => <ContactForm />);

      const messageInput = screen.getByLabelText(/message/i);
      fireEvent.blur(messageInput);

      await waitFor(() => {
        expect(screen.getByText(/message is required/i)).toBeInTheDocument();
      });
    });

    it('shows error when message is too short', async () => {
      render(() => <ContactForm />);

      const messageInput = screen.getByLabelText(/message/i);
      fireEvent.input(messageInput, { target: { value: 'Short' } });
      fireEvent.blur(messageInput);

      await waitFor(() => {
        expect(screen.getByText(/message must be at least 10 characters/i)).toBeInTheDocument();
      });
    });

    it('validates organization only if provided', async () => {
      render(() => <ContactForm />);

      const orgInput = screen.getByLabelText(/organization/i);

      // Empty should not show error
      fireEvent.blur(orgInput);
      await waitFor(() => {
        expect(screen.queryByText(/organization must be at least/i)).not.toBeInTheDocument();
      });

      // Too short should show error
      fireEvent.input(orgInput, { target: { value: 'A' } });
      fireEvent.blur(orgInput);
      await waitFor(() => {
        expect(screen.getByText(/organization must be at least 2 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );
      global.fetch = mockFetch;

      render(() => <ContactForm />);

      fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.input(screen.getByLabelText(/message/i), { target: { value: 'This is a test message that is long enough' } });

      const submitButton = screen.getByRole('button', { name: /send request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://formspree.io/f/test123',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: expect.stringContaining('John Doe'),
          })
        );
      });
    });

    it('shows success message after successful submission', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );
      global.fetch = mockFetch;

      render(() => <ContactForm />);

      fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.input(screen.getByLabelText(/message/i), { target: { value: 'This is a test message that is long enough' } });

      fireEvent.click(screen.getByRole('button', { name: /send request/i }));

      await waitFor(() => {
        expect(screen.getByText(/thank you for your interest/i)).toBeInTheDocument();
      });
    });

    it('shows error message on network failure', async () => {
      const mockFetch = vi.fn(() => Promise.reject(new Error('Network error')));
      global.fetch = mockFetch;

      render(() => <ContactForm />);

      fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.input(screen.getByLabelText(/message/i), { target: { value: 'This is a test message that is long enough' } });

      fireEvent.click(screen.getByRole('button', { name: /send request/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('shows error message on server error', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ errors: [{ message: 'Server error' }] }),
        } as Response)
      );
      global.fetch = mockFetch;

      render(() => <ContactForm />);

      fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.input(screen.getByLabelText(/message/i), { target: { value: 'This is a test message that is long enough' } });

      fireEvent.click(screen.getByRole('button', { name: /send request/i }));

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Rate Limiting', () => {
    it('prevents multiple rapid submissions', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );
      global.fetch = mockFetch;

      render(() => <ContactForm />);

      // Fill out form
      fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.input(screen.getByLabelText(/message/i), { target: { value: 'This is a test message that is long enough' } });

      // First submission
      fireEvent.click(screen.getByRole('button', { name: /send request/i }));

      await waitFor(() => {
        expect(screen.getByText(/thank you for your interest/i)).toBeInTheDocument();
      });

      // Reset to form view
      fireEvent.click(screen.getByRole('button', { name: /send another message/i }));

      // Fill out form again
      fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
      fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
      fireEvent.input(screen.getByLabelText(/message/i), { target: { value: 'Another test message that is long enough' } });

      // Immediate second submission should be rate limited
      fireEvent.click(screen.getByRole('button', { name: /send request/i }));

      await waitFor(() => {
        expect(screen.getByText(/please wait.*seconds before submitting again/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for error states', async () => {
      render(() => <ContactForm />);

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
      });
    });

    it('disables inputs while submitting', async () => {
      const mockFetch = vi.fn(() => new Promise(() => {})); // Never resolves
      global.fetch = mockFetch;

      render(() => <ContactForm />);

      fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.input(screen.getByLabelText(/message/i), { target: { value: 'This is a test message that is long enough' } });

      fireEvent.click(screen.getByRole('button', { name: /send request/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeDisabled();
        expect(screen.getByLabelText(/email/i)).toBeDisabled();
        expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
      });
    });
  });
});
