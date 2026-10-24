import { describe, expect, it } from 'vitest';
import { supportLinks } from './support';
import { SUPPORT_QR } from './supportQr';

describe('support QR codes', () => {
  it('has a generated QR code for every live support link', () => {
    // A handle changed without re-running `npm run qr` would put a QR code on
    // screen that sends people somewhere else. Fail the build instead.
    for (const link of supportLinks()) {
      expect(SUPPORT_QR[link.url], `missing QR for ${link.url}; run npm run qr`).toBeDefined();
    }
  });

  it('has no QR code for a link that no longer exists', () => {
    const urls = supportLinks().map((l) => l.url);
    expect(Object.keys(SUPPORT_QR).sort()).toEqual([...urls].sort());
  });
});
