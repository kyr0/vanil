import { deflateRaw } from "zlib"
import * as colors from 'kleur/colors'

export interface FileSizeStats {
    gzipKib: string,
    kib: string
}

/** calculates the file sizes (gzip and raw) for content */
export const getFileSizeStats = async(contents: string|Uint8Array): Promise<FileSizeStats> => 
    new Promise((resolve, reject) => {
        const contentsBuffer = Buffer.from(contents)
        deflateRaw(contentsBuffer, (err, compressedContents) => {
            if (err) reject(err)
            resolve({
                kib: (contentsBuffer.byteLength / 1024).toFixed(2),
                gzipKib: (compressedContents.byteLength / 1024).toFixed(2)
            })
        })
    })

/** prints the size of a file gzipped in KiB */
export const printFileSizeStats = (fileName: string, size: FileSizeStats) => {
    console.log(colors.dim(fileName), '(gzip) ~', colors.green(size.gzipKib), 'KiB')
}