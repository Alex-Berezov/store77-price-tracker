import { render, screen } from '@testing-library/react';
import { ProductGrid } from './product-grid';
import { Product } from '@/types';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: { src: string; alt: string }) {
    return <img src={props.src} alt={props.alt} data-testid="product-image" />;
  },
}));

const mockProducts: Product[] = [
  {
    id: 'product-1',
    externalId: 'ext-1',
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    description: 'Latest iPhone',
    originalPriceRub: 150000,
    finalPriceRub: 149000,
    finalPriceUsd: 1490.0,
    imageUrl: 'https://example.com/iphone.jpg',
    externalUrl: 'https://store77.net/iphone',
    category: { id: 'phones', name: 'Phones', slug: 'phones' },
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'product-2',
    externalId: 'ext-2',
    name: 'MacBook Pro',
    slug: 'macbook-pro',
    description: 'Powerful laptop',
    originalPriceRub: 250000,
    finalPriceRub: 249000,
    finalPriceUsd: 2490.0,
    imageUrl: 'https://example.com/macbook.jpg',
    externalUrl: 'https://store77.net/macbook',
    category: { id: 'laptops', name: 'Laptops', slug: 'laptops' },
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
];

describe('ProductGrid', () => {
  it('renders all products', () => {
    render(<ProductGrid products={mockProducts} />);

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
  });

  it('renders empty state when no products', () => {
    render(<ProductGrid products={[]} />);

    expect(screen.getByText('Товары не найдены')).toBeInTheDocument();
    expect(screen.getByText(/Попробуйте изменить фильтры/)).toBeInTheDocument();
  });

  it('renders USD prices when finalPriceUsd is provided', () => {
    render(<ProductGrid products={mockProducts} />);

    // finalPriceUsd: 1490.00
    expect(screen.getByText(/≈.*\$1,490\.00/)).toBeInTheDocument();
    // finalPriceUsd: 2490.00
    expect(screen.getByText(/≈.*\$2,490\.00/)).toBeInTheDocument();
  });

  it('does not show USD prices when finalPriceUsd is null', () => {
    const productsWithoutUsd = mockProducts.map((p) => ({ ...p, finalPriceUsd: null }));
    render(<ProductGrid products={productsWithoutUsd} />);

    expect(screen.queryByText(/≈/)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ProductGrid products={mockProducts} className="custom-grid-class" />
    );

    expect(container.firstChild).toHaveClass('custom-grid-class');
  });
});
