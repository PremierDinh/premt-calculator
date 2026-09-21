export async function encodeQrDataUrl(payload: string): Promise<string> {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 128,
    color: { dark: '#000000', light: '#d1d7c4' },
  });
}
