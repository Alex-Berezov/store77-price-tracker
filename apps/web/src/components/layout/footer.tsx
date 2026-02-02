export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container flex h-16 items-center justify-between">
        <p className="text-sm text-muted-foreground">
          © {currentYear} Store77 Price Tracker. Тестовое задание.
        </p>
        <p className="text-sm text-muted-foreground">Данные обновляются каждые 10 минут</p>
      </div>
    </footer>
  );
}
