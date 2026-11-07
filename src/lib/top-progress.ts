type Listener = (active: boolean) => void;

let depth = 0;
const listeners = new Set<Listener>();

function emit() {
  const active = depth > 0;
  listeners.forEach((listener) => listener(active));
}

export function startTopProgress() {
  depth += 1;
  emit();
}

export function stopTopProgress() {
  depth = Math.max(0, depth - 1);
  emit();
}

export function subscribeTopProgress(listener: Listener) {
  listeners.add(listener);
  listener(depth > 0);
  return () => {
    listeners.delete(listener);
  };
}

export async function withTopProgress<T>(fn: () => Promise<T>): Promise<T> {
  startTopProgress();
  try {
    return await fn();
  } finally {
    stopTopProgress();
  }
}
