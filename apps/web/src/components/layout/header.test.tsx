import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './header';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock the API module
jest.mock('@/lib/api', () => ({
  api: {
    currency: {
      getRate: jest.fn().mockResolvedValue({ rate: 95.5, updatedAt: new Date().toISOString() }),
    },
  },
  CurrencyRateResponse: {},
}));

describe('Header', () => {
  it('renders the logo with correct text', () => {
    render(<Header />);

    expect(screen.getByText('Store77')).toBeInTheDocument();
    expect(screen.getByText('Price Tracker')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);

    // Desktop and mobile nav both have these links, so we use getAllByRole
    const catalogLinks = screen.getAllByRole('link', { name: /каталог/i });
    const categoryLinks = screen.getAllByRole('link', { name: /категории/i });

    expect(catalogLinks.length).toBeGreaterThanOrEqual(1);
    expect(categoryLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('has a link to homepage on logo', () => {
    render(<Header />);

    const logoLink = screen.getByRole('link', { name: /store77/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders the currency indicator', () => {
    render(<Header />);

    // Currency indicator should be present (either loading or showing rate)
    expect(screen.getByText(/загрузка|usdt/i)).toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    render(<Header />);

    const menuButton = screen.getByRole('button', { name: /открыть меню/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('toggles mobile menu on button click', () => {
    render(<Header />);

    const menuButton = screen.getByRole('button', { name: /открыть меню/i });

    // Initially, mobile menu should be closed
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    // Click to open
    fireEvent.click(menuButton);
    expect(screen.getByRole('button', { name: /закрыть меню/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    // Click to close
    fireEvent.click(screen.getByRole('button', { name: /закрыть меню/i }));
    expect(screen.getByRole('button', { name: /открыть меню/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('closes mobile menu when navigation link is clicked', () => {
    render(<Header />);

    // Open mobile menu
    fireEvent.click(screen.getByRole('button', { name: /открыть меню/i }));
    expect(screen.getByRole('button', { name: /закрыть меню/i })).toBeInTheDocument();

    // Click on a navigation link in mobile menu (find all and click the last one which is in mobile nav)
    const catalogLinks = screen.getAllByRole('link', { name: /каталог/i });
    fireEvent.click(catalogLinks[catalogLinks.length - 1]);

    // Menu should close
    expect(screen.getByRole('button', { name: /открыть меню/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });
});
