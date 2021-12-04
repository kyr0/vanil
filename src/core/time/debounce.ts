/** callc the function (fn) once in a timeframe of (n) ms */
export const debounce = (fn: Function, ms: number) => {
  let timeout: NodeJS.Timeout;

  return function () {
    const delegate = () => fn.apply(
      // @ts-ignore
      this, arguments);

    clearTimeout(timeout);
    timeout = setTimeout(delegate, ms);
  }
}