import { useCallback, useEffect, useRef } from "react";

/* Based on https://github.com/xnimorz/use-debounce#debounced-callbacks
 *
 * HOW TO USE (debounced InputText with suggestions):
 * const fetchSuggestionsDebounced = useDebouncedCallback(query => {
 *   dispatch(actionCreatorRequest(query))
 * }, DEBOUNCE_TIMING);
 *
 * onInputTextChange = e => {
 *   setInput(e.target.value);
 *   fetchSuggestionsDebounced(e.target.value);
 * }
 */
export function useDebouncedCallback<T>(
  callback: (arg0: T) => void,
  delay: number
): (arg0?: T) => void {
  const { debouncedCallback } = useCancellableDebouncedCallback(callback, delay);
  return debouncedCallback;
}

export function useCancellableDebouncedCallback<T>(
  callback: (arg0: T) => void,
  delay: number
): {
  debouncedCallback: (arg0?: T) => void;
  cancelDebouncedCallback: () => void;
} {
  type Timeout = ReturnType<typeof setTimeout>;
  const functionTimeoutHandler = useRef<Timeout | null>(null);
  const isComponentUnmounted: {
    current: boolean;
  } = useRef(false);

  const debouncedFunction = useRef(callback);
  debouncedFunction.current = callback;
  const cancelDebouncedCallback: () => void = useCallback(() => {
    clearTimeout(functionTimeoutHandler.current as unknown as Timeout);
    functionTimeoutHandler.current = null;
  }, []);

  // clear timer on component unmount
  useEffect(() => {
    return () => {
      cancelDebouncedCallback();
    };
  }, [cancelDebouncedCallback]);

  const debouncedCallback = useCallback(
    (...args: [any]) => {
      clearTimeout(functionTimeoutHandler.current as unknown as Timeout);
      functionTimeoutHandler.current = setTimeout(() => {
        cancelDebouncedCallback();

        if (!isComponentUnmounted.current) {
          debouncedFunction.current(...args);
        }
      }, delay);
    },
    [delay, cancelDebouncedCallback]
  );
  return { cancelDebouncedCallback, debouncedCallback };
}
