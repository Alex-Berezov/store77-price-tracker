import { render, screen, waitFor } from '@testing-library/react';
import { CurrencyIndicator } from './currency-indicator';

// Mock the API module
const mockGetRate = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    currency: {
      getRate: () => mockGetRate(),
    },
  },
}));

describe('CurrencyIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockGetRate.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CurrencyIndicator />);

    expect(screen.getByText(/загрузка/i)).toBeInTheDocument();
  });

  it('displays the currency rate when loaded', async () => {
    mockGetRate.mockResolvedValue({ rate: 95.5, updatedAt: new Date().toISOString() });

    render(<CurrencyIndicator />);

    await waitFor(() => {
      expect(screen.getByText(/1 usdt = 95\.50 ₽/i)).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    mockGetRate.mockRejectedValue(new Error('API Error'));

    render(<CurrencyIndicator />);

    await waitFor(() => {
      expect(screen.getByText(/ошибка загрузки курса/i)).toBeInTheDocument();
    });
  });

  it('formats rate with 2 decimal places', async () => {
    mockGetRate.mockResolvedValue({ rate: 100.123, updatedAt: new Date().toISOString() });

    render(<CurrencyIndicator />);

    await waitFor(() => {
      expect(screen.getByText(/1 usdt = 100\.12 ₽/i)).toBeInTheDocument();
    });
  });
});
