import { contentDisposition } from 'src/utils/file.js';

describe('contentDisposition', () => {
  it('advertises an image filename iOS Safari can read', () => {
    expect(contentDisposition('attachment', 'IMG_1234.jpg')).toBe(
      `attachment; filename="IMG_1234.jpg"; filename*=UTF-8''IMG_1234.jpg`,
    );
  });

  it('keeps a video extension in the plain filename parameter', () => {
    expect(contentDisposition('attachment', 'clip.mov')).toContain('filename="clip.mov"');
    expect(contentDisposition('attachment', 'clip.mov')).toContain('filename*=UTF-8\'\'clip.mov');
  });

  it('percent-encodes unicode in filename* and keeps an ascii fallback with the extension', () => {
    const header = contentDisposition('inline', 'фото.png');

    expect(header.startsWith('inline; filename="download.png"')).toBe(true);
    expect(header).toContain(`filename*=UTF-8''${encodeURIComponent('фото.png')}`);
  });

  it('strips header-breaking characters from the plain filename', () => {
    expect(contentDisposition('attachment', 'a"b\r\n.jpg')).toContain('filename="a_b__.jpg"');
  });
});
