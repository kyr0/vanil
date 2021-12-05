/** recursively splits an array into chunks */
export const chunk = (chunkSize: number, data: Array<any>, tail: Array<any> = []): Array<any> =>
  chunkSize === 0
    ? data // no chunks, return input
    : data.length === 0
    ? tail // not enough items left, return tail
    : // else slice into more pieces
      chunk(chunkSize, data.slice(chunkSize), tail.concat([data.slice(0, chunkSize)]))
