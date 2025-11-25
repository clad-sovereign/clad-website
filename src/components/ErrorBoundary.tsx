import { ErrorBoundary as SolidErrorBoundary } from "solid-js";
import type { JSX } from "solid-js";

interface ErrorBoundaryProps {
  children: JSX.Element;
  fallback?: (error: Error, reset: () => void) => JSX.Element;
}

export default function ErrorBoundary(props: ErrorBoundaryProps) {
  const defaultFallback = (error: Error, reset: () => void) => (
    <div class="max-w-xl mx-auto">
      <div class="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            class="w-6 h-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-red-800 mb-2">
          Something went wrong
        </h3>
        <p class="text-sm text-red-600 mb-4">
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          type="button"
          onClick={reset}
          class="btn btn-secondary text-sm py-2 px-4"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <SolidErrorBoundary fallback={props.fallback || defaultFallback}>
      {props.children}
    </SolidErrorBoundary>
  );
}
