import React from 'react';
import { render, screen } from '@testing-library/react';
import { Pagination } from './pagination';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('Pagination', () => {
  it('renders nothing when totalPages is 1', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when totalPages is 0', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders pagination for multiple pages', () => {
    render(<Pagination currentPage={1} totalPages={5} />);

    // Check page numbers
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} />);

    const prevButton = screen.getByLabelText('Предыдущая страница');
    expect(prevButton.tagName).toBe('SPAN'); // Disabled state is a span, not link
  });

  it('enables previous button on other pages', () => {
    render(<Pagination currentPage={3} totalPages={5} />);

    const prevButton = screen.getByLabelText('Предыдущая страница');
    expect(prevButton.tagName).toBe('A');
    expect(prevButton).toHaveAttribute('href', '/?page=2');
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} />);

    const nextButton = screen.getByLabelText('Следующая страница');
    expect(nextButton.tagName).toBe('SPAN');
  });

  it('enables next button on other pages', () => {
    render(<Pagination currentPage={3} totalPages={5} />);

    const nextButton = screen.getByLabelText('Следующая страница');
    expect(nextButton.tagName).toBe('A');
    expect(nextButton).toHaveAttribute('href', '/?page=4');
  });

  it('highlights current page', () => {
    render(<Pagination currentPage={3} totalPages={5} />);

    const currentPageLink = screen.getByLabelText('Страница 3');
    expect(currentPageLink).toHaveAttribute('aria-current', 'page');
    expect(currentPageLink).toHaveClass('bg-primary');
  });

  it('preserves search params in URLs', () => {
    render(<Pagination currentPage={2} totalPages={5} searchParams={{ category: 'phones' }} />);

    const page3Link = screen.getByLabelText('Страница 3');
    expect(page3Link).toHaveAttribute('href', '/?category=phones&page=3');
  });

  it('omits page param for page 1', () => {
    render(<Pagination currentPage={2} totalPages={5} />);

    const page1Link = screen.getByLabelText('Страница 1');
    expect(page1Link).toHaveAttribute('href', '/');
    expect(page1Link.getAttribute('href')).not.toContain('page=1');
  });

  it('shows ellipsis for many pages', () => {
    render(<Pagination currentPage={5} totalPages={10} />);

    // Should show: 1 ... 4 5 6 ... 10
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
