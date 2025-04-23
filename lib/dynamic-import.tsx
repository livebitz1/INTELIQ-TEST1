import React, { Suspense, lazy } from 'react';
import type { ComponentType, ReactNode } from 'react';

interface DynamicImportOptions {
  loading?: ComponentType;
  ssr?: boolean;
  fallback?: ReactNode;
}

export function dynamicImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
) {
  const { loading: LoadingComponent, ssr = true, fallback = null } = options;

  const DynamicComponent = (props: any) => {
    const Component = lazy(importFn);

    if (!ssr && typeof window === 'undefined') {
      return fallback;
    }

    return (
      <Suspense fallback={LoadingComponent ? <LoadingComponent {...props} /> : fallback}>
        <Component {...props} />
      </Suspense>
    );
  };

  // Add display name for better debugging
  DynamicComponent.displayName = `DynamicImport(${
    importFn.name || 'Anonymous'
  })`;

  return DynamicComponent;
} 