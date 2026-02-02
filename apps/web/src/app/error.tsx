'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="h-20 w-20 text-destructive" />

      <h1 className="mt-6 text-2xl font-bold sm:text-3xl">Что-то пошло не так</h1>

      <p className="mt-3 max-w-md text-muted-foreground">
        Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить страницу или вернитесь на
        главную.
      </p>

      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-muted p-4 text-left text-sm">
          {error.message}
        </pre>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-5 w-5" />
          Попробовать снова
        </button>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-6 py-3 font-medium transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
          На главную
        </Link>
      </div>
    </div>
  );
}
