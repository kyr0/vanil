import { Buffer } from "buffer"

/** UTF8 compatible encoding to a base64 string */
export const base64Encode = (content: string) => Buffer.from(
    encodeURIComponent(content)
        .replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16)))
).toString('base64')

/** UTF8 compatible decoding from a base64 encoded string */
export const base64Decode = (content: string) => 
    decodeURIComponent(Array.prototype.map.call(
        Buffer.from(content, 'base64').toString(), (c: string) => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''))