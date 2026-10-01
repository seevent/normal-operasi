/** ID elemen DOM untuk sebuah node editor; dipakai untuk menggulir ke node baru. */
export const nodeDomId = (id: string) => `cl-${id}`;

export const confirmDelete = (message: string): boolean => window.confirm(message);
