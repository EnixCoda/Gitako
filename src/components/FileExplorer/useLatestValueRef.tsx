import * as React from 'react';

function useLatestValueRef<T>(value: T) {
  const ref = React.useRef(value);
  React.useEffect(() => {
    ref.current = value;
  });
  return ref;
}
export function useCallbackRef<Args extends AnyArray, R>(
  callback: (...args: Args) => R): (...args: Args) => R {
  const ref = useLatestValueRef(callback);
  return React.useCallback((...args: Args) => ref.current(...args), [ref]);
}
