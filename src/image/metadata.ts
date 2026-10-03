/** Read dimensions before decoding, to reject oversized rasters without allocating them. */
export function imageMetadata(bytes: Uint8Array): {
  width: number;
  height: number;
  type: 'image/png' | 'image/jpeg' | 'image/webp';
} {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length >= 24 && view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a)
    return { width: view.getUint32(16), height: view.getUint32(20), type: 'image/png' };
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 0xff) break;
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if (
        [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
          marker,
        ) &&
        length >= 8
      )
        return {
          width: view.getUint16(offset + 5),
          height: view.getUint16(offset + 3),
          type: 'image/jpeg',
        };
      offset += length;
    }
  }
  if (bytes.length >= 30 && view.getUint32(0) === 0x52494646 && view.getUint32(8) === 0x57454250) {
    const tag = view.getUint32(12);
    if (tag === 0x56503858)
      return {
        width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
        height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
        type: 'image/webp',
      };
    if (tag === 0x5650384c && bytes[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
        type: 'image/webp',
      };
    }
    if (tag === 0x56503820 && bytes[23] === 0x9d && bytes[24] === 1 && bytes[25] === 0x2a)
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
        type: 'image/webp',
      };
  }
  throw new Error('No pudimos abrir esta imagen. Prueba con JPG, PNG o WEBP.');
}
