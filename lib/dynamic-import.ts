import { Suspense } from 'react';
import type { ComponentType } from 'react';

interface DynamicImportOptions {
  loading?: ComponentType;
  ssr?: boolean;
  fallback?: React.ReactNode;
}

export function dynamicImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
) {
  const { loading: LoadingComponent, ssr = true, fallback = null } = options;

  const DynamicComponent = (props: any) => {
    const Component = React.lazy(importFn);

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

// Example usage:
// const DynamicChart = dynamicImport(
//   () => import('@/components/Chart'),
//   {
//     loading: () => <div>Loading chart...</div>,
//     ssr: false
//   }
// ); 