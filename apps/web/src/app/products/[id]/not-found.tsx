import Link from 'next/link';
import { ArrowLeft, PackageX } from 'lucide-react';

export default function ProductNotFound() {
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center py-12 text-center">
      <PackageX className="h-20 w-20 text-muted-foreground" />

      <h1 className="mt-6 text-2xl font-bold sm:text-3xl">Товар не найден</h1>

      <p className="mt-3 max-w-md text-muted-foreground">
        К сожалению, запрашиваемый товар не существует или был удалён. Попробуйте вернуться к
        каталогу и выбрать другой товар.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="h-5 w-5" />
        Вернуться к каталогу
      </Link>
    </div>
  );
}
