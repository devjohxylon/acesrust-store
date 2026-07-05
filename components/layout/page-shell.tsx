type PageShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
};

const WIDTH = {
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
} as const;

export function PageShell({ title, description, children, width = 'lg' }: PageShellProps) {
  return (
    <div className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className={`${WIDTH[width]} mx-auto space-y-8`}>
          <header className="border-b border-border pb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
            {description ? <p className="text-muted mt-2 text-sm md:text-base">{description}</p> : null}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
