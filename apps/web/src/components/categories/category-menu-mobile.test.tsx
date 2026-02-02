import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryMenuMobile } from './category-menu-mobile';
import { Category } from '@/types';

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Смартфоны', slug: 'smartphones', url: '/smartphones', productCount: 25 },
  { id: 'cat-2', name: 'Ноутбуки', slug: 'laptops', url: '/laptops', productCount: 15 },
];

describe('CategoryMenuMobile', () => {
  beforeEach(() => {
    mockSearchParams.delete('category');
  });

  it('renders toggle button with "All Products" when no category selected', () => {
    render(<CategoryMenuMobile categories={mockCategories} />);

    expect(screen.getByText('Все товары')).toBeInTheDocument();
  });

  it('shows current category name in toggle button', () => {
    mockSearchParams.set('category', 'smartphones');

    render(<CategoryMenuMobile categories={mockCategories} />);

    expect(screen.getByText('Смартфоны')).toBeInTheDocument();
  });

  it('opens dropdown when toggle is clicked', () => {
    render(<CategoryMenuMobile categories={mockCategories} />);

    const toggleButton = screen.getByRole('button', { name: /открыть меню категорий/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText('Выберите категорию')).toBeInTheDocument();
  });

  it('shows all categories in dropdown', () => {
    render(<CategoryMenuMobile categories={mockCategories} />);

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /открыть меню категорий/i }));

    // Categories should be visible in dropdown
    expect(screen.getByText('Ноутбуки')).toBeInTheDocument();
    // Note: Смартфоны is already shown in toggle, look for it in dropdown context
    const laptopsLink = screen.getByText('Ноутбуки').closest('a');
    expect(laptopsLink).toHaveAttribute('href', '/?category=laptops');
  });

  it('closes dropdown when close button is clicked', () => {
    render(<CategoryMenuMobile categories={mockCategories} />);

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /открыть меню категорий/i }));
    expect(screen.getByText('Выберите категорию')).toBeInTheDocument();

    // Close dropdown
    fireEvent.click(screen.getByRole('button', { name: /закрыть/i }));
    expect(screen.queryByText('Выберите категорию')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CategoryMenuMobile categories={mockCategories} className="custom-mobile-class" />
    );

    expect(container.firstChild).toHaveClass('custom-mobile-class');
  });
});
