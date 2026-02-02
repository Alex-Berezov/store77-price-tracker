import { render, screen } from '@testing-library/react';
import { CategoryMenu } from './category-menu';
import { Category } from '@/types';

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Смартфоны', slug: 'smartphones', url: '/smartphones', productCount: 25 },
  { id: 'cat-2', name: 'Ноутбуки', slug: 'laptops', url: '/laptops', productCount: 15 },
  { id: 'cat-3', name: 'Планшеты', slug: 'tablets', url: '/tablets', productCount: 10 },
];

describe('CategoryMenu', () => {
  beforeEach(() => {
    // Reset search params before each test
    mockSearchParams.delete('category');
  });

  it('renders category heading', () => {
    render(<CategoryMenu categories={mockCategories} />);

    expect(screen.getByText('Категории')).toBeInTheDocument();
  });

  it('renders "All Products" link', () => {
    render(<CategoryMenu categories={mockCategories} />);

    expect(screen.getByText('Все товары')).toBeInTheDocument();
  });

  it('renders all category names', () => {
    render(<CategoryMenu categories={mockCategories} />);

    expect(screen.getByText('Смартфоны')).toBeInTheDocument();
    expect(screen.getByText('Ноутбуки')).toBeInTheDocument();
    expect(screen.getByText('Планшеты')).toBeInTheDocument();
  });

  it('renders product counts', () => {
    render(<CategoryMenu categories={mockCategories} />);

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('generates correct links for categories', () => {
    render(<CategoryMenu categories={mockCategories} />);

    const smartphonesLink = screen.getByText('Смартфоны').closest('a');
    expect(smartphonesLink).toHaveAttribute('href', '/?category=smartphones');

    const laptopsLink = screen.getByText('Ноутбуки').closest('a');
    expect(laptopsLink).toHaveAttribute('href', '/?category=laptops');
  });

  it('"All Products" links to homepage', () => {
    render(<CategoryMenu categories={mockCategories} />);

    const allProductsLink = screen.getByText('Все товары').closest('a');
    expect(allProductsLink).toHaveAttribute('href', '/');
  });

  it('highlights "All Products" when no category is selected', () => {
    render(<CategoryMenu categories={mockCategories} />);

    const allProductsLink = screen.getByText('Все товары').closest('a');
    expect(allProductsLink).toHaveClass('bg-primary/10');
  });

  it('highlights active category based on URL param', () => {
    mockSearchParams.set('category', 'laptops');

    render(<CategoryMenu categories={mockCategories} />);

    const laptopsLink = screen.getByText('Ноутбуки').closest('a');
    expect(laptopsLink).toHaveClass('bg-primary/10');

    const allProductsLink = screen.getByText('Все товары').closest('a');
    expect(allProductsLink).not.toHaveClass('bg-primary/10');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CategoryMenu categories={mockCategories} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders empty list when no categories', () => {
    render(<CategoryMenu categories={[]} />);

    expect(screen.getByText('Все товары')).toBeInTheDocument();
    expect(screen.queryByText('Смартфоны')).not.toBeInTheDocument();
  });
});
