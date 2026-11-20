'use client';

import { FrameworkProvider, type Router } from 'fumadocs-core/framework';
import { RootProvider } from 'fumadocs-ui/provider/base';
import { useParams, usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';
import { siteUrl } from '@/lib/site';

function StaticLink({ href, prefetch: _prefetch, ...props }: ComponentProps<'a'> & { prefetch?: boolean }) {
  return <a {...props} href={href ? siteUrl(href) : href} />;
}

// GitHub Pages serves static files, so navigation must not require Next's RSC transport.
function useStaticRouter(): Router {
  return {
    push(url) { location.assign(siteUrl(url)); },
    refresh() { location.reload(); },
  };
}

export function Provider({ children }: { children: ReactNode }) {
  return (
    <FrameworkProvider
      Link={StaticLink}
      useRouter={useStaticRouter}
      useParams={useParams}
      usePathname={usePathname}
    >
      <RootProvider search={{ options: { type: 'static', api: siteUrl('/search.json') } }}>
        {children}
      </RootProvider>
    </FrameworkProvider>
  );
}
