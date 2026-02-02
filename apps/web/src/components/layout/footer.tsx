export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-2 py-4 sm:h-16 sm:flex-row sm:py-0">
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          © {currentYear} Store77 Price Tracker. Тестовое задание.
        </p>
        <p className="text-center text-sm text-muted-foreground sm:text-right">
          Данные обновляются каждые 10 минут
        </p>
      </div>
    </footer>
  );
}
