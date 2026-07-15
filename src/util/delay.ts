/** Resolve after `ms` milliseconds — used to pace timed motor commands. */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
