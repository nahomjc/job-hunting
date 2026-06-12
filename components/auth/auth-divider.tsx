export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card/60 px-3 text-muted-foreground tracking-wider backdrop-blur-sm">
          or continue with email
        </span>
      </div>
    </div>
  );
}
