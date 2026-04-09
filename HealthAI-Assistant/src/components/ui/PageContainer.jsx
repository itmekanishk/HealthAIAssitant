import React from 'react';
import { cn } from '@/lib/utils';

const sizeToWidthClass = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
};

export function PageContainer({
    icon,
    title,
    description,
    size = 'md',
    className,
    children
}) {
    return (<section className={cn("w-full mx-auto rounded-3xl border border-border/70 bg-card/90 shadow-[0_1px_0_0_hsl(var(--border)/0.6),0_18px_50px_-30px_rgba(0,0,0,0.75)] p-4 sm:p-6", sizeToWidthClass[size] ?? sizeToWidthClass.md, className)}>
      <header className="flex flex-col items-center justify-center gap-2 mb-6 text-center">
        {icon ? <div className="flex items-center justify-center">{icon}</div> : null}
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? (<p className="mt-1 text-sm sm:text-base text-muted-foreground">{description}</p>) : null}
        </div>
      </header>
      {children}
    </section>);
}
