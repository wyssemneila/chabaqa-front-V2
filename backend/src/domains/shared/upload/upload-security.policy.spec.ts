import {
  getAllowedUploadCategory,
  hasActiveContentMarkers,
  isAllowedUploadMime,
  validateUploadSignature,
} from '@/domains/shared/upload/upload-security.policy';

describe('upload-security.policy', () => {
  it('rejects active content extensions before upload processing', () => {
    expect(getAllowedUploadCategory('payload.svg')).toBeNull();
    expect(getAllowedUploadCategory('payload.html')).toBeNull();
    expect(getAllowedUploadCategory('payload.js')).toBeNull();
    expect(getAllowedUploadCategory('payload.zip')).toBeNull();
  });

  it('allows only the expected safe MIME types', () => {
    expect(isAllowedUploadMime('image', 'image/png')).toBe(true);
    expect(isAllowedUploadMime('image', 'image/svg+xml')).toBe(false);
    expect(isAllowedUploadMime('document', 'text/html')).toBe(false);
    expect(isAllowedUploadMime('document', 'application/pdf')).toBe(true);
  });

  it('validates common magic bytes', () => {
    expect(validateUploadSignature('avatar.png', 'image', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBeNull();
    expect(validateUploadSignature('invoice.pdf', 'document', Buffer.from('%PDF-1.7'))).toBeNull();
    expect(validateUploadSignature('movie.webm', 'video', Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))).toBeNull();
  });

  it('rejects polyglot-like active markers even when the extension is otherwise allowed', () => {
    const suspiciousJpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0x00]),
      Buffer.from('<script>alert(1)</script>'),
    ]);

    expect(hasActiveContentMarkers(suspiciousJpeg)).toBe(true);
    expect(validateUploadSignature('avatar.jpg', 'image', suspiciousJpeg)).toContain('Active HTML');
  });
});
