import './global.css';
import { Provider } from '@/components/provider';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL('https://cardforest.github.io/master-class/'),
  title: {
    default: 'Master-Class',
    template: '%s | Master-Class',
  },
  description: 'JavaScript classes with runtime typing, change control, serialization, and state machines.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>
          <DocsLayout
            tree={source.pageTree}
            nav={{ title: 'Master-Class', url: '/' }}
            githubUrl="https://github.com/CardForest/master-class"
          >
            {children}
          </DocsLayout>
        </Provider>
      </body>
    </html>
  );
}
