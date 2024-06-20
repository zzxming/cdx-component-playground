export const utoa = (data: string): string => btoa(unescape(encodeURIComponent(data)));
export const atou = (base64: string): string => decodeURIComponent(escape(atob(base64)));
