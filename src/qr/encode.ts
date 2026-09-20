import QRCode from 'qrcode';

export async function encodeQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 128,
    color: { dark: '#000000', light: '#d1d7c4' },
  });
}
