import { render, screen } from '@testing-library/react';
import { ProductCard } from './product-card';
import { Product } from '@/types';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
  }) {
    return (
      <img
        src={props.src}
        alt={props.alt}
        className={props.className}
        data-testid="product-image"
      />
    );
  },
}));

const mockProduct: Product = {
  id: 'test-product-1',
  externalId: 'ext-123',
  name: 'Test Product Name',
  slug: 'test-product-name',
  description: 'Test product description',
  originalPriceRub: 15000,
  finalPriceRub: 14000,
  finalPriceUsd: null,
  imageUrl: 'https://example.com/image.jpg',
  externalUrl: 'https://store77.net/product/123',
  category: { id: 'category-1', name: 'Category', slug: 'category' },
  isActive: true,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
};

describe('ProductCard', () => {
  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product Name')).toBeInTheDocument();
  });

  it('renders product image when imageUrl is provided', () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByTestId('product-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Test Product Name');
  });

  it('renders placeholder when imageUrl is null', () => {
    const productWithoutImage = { ...mockProduct, imageUrl: null };
    render(<ProductCard product={productWithoutImage} />);

    expect(screen.getByText('📦')).toBeInTheDocument();
    expect(screen.queryByTestId('product-image')).not.toBeInTheDocument();
  });

  it('renders price in rubles', () => {
    render(<ProductCard product={mockProduct} />);

    // Check for price - format may vary based on locale
    expect(screen.getByText(/14[\s\u00A0]?000/)).toBeInTheDocument();
  });

  it('renders price in USD when finalPriceUsd is provided', () => {
    const productWithUsd = { ...mockProduct, finalPriceUsd: 145.83 };
    render(<ProductCard product={productWithUsd} />);

    expect(screen.getByText(/≈.*\$145\.83/)).toBeInTheDocument();
  });

  it('does not render USD price when finalPriceUsd is null', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.queryByText(/≈/)).not.toBeInTheDocument();
  });

  it('has link to product detail page', () => {
    render(<ProductCard product={mockProduct} />);

    const links = screen.getAllByRole('link');
    const productLinks = links.filter(
      (link) => link.getAttribute('href') === '/products/test-product-1'
    );
    expect(productLinks.length).toBeGreaterThan(0);
  });

  it('has external link to original site', () => {
    render(<ProductCard product={mockProduct} />);

    const externalLink = screen.getByText('Открыть на сайте').closest('a');
    expect(externalLink).toHaveAttribute('href', 'https://store77.net/product/123');
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('applies custom className', () => {
    const { container } = render(<ProductCard product={mockProduct} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
