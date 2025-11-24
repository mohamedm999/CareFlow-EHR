import {
  validateMimeType,
  validateFileExtension,
  validateFileMagicNumber,
  validateFileSize
} from '../../../config/storage.js';

describe('Storage Configuration - File Validation', () => {
  describe('validateMimeType', () => {
    it('should accept PDF MIME type', () => {
      expect(validateMimeType('application/pdf')).toBe(true);
    });

    it('should accept image MIME types', () => {
      expect(validateMimeType('image/jpeg')).toBe(true);
      expect(validateMimeType('image/jpg')).toBe(true);
      expect(validateMimeType('image/png')).toBe(true);
    });

    it('should accept CSV MIME type', () => {
      expect(validateMimeType('text/csv')).toBe(true);
    });

    it('should reject invalid MIME types', () => {
      expect(validateMimeType('application/exe')).toBe(false);
      expect(validateMimeType('application/x-msdownload')).toBe(false);
      expect(validateMimeType('text/html')).toBe(false);
    });

    it('should reject arbitrary MIME types', () => {
      expect(validateMimeType('application/octet-stream')).toBe(false);
    });
  });

  describe('validateFileExtension', () => {
    it('should accept PDF extension', () => {
      expect(validateFileExtension('document.pdf')).toBe(true);
    });

    it('should accept image extensions', () => {
      expect(validateFileExtension('photo.jpeg')).toBe(true);
      expect(validateFileExtension('photo.jpg')).toBe(true);
      expect(validateFileExtension('photo.png')).toBe(true);
    });

    it('should accept CSV extension', () => {
      expect(validateFileExtension('data.csv')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(validateFileExtension('document.PDF')).toBe(true);
      expect(validateFileExtension('photo.JPG')).toBe(true);
      expect(validateFileExtension('photo.PNG')).toBe(true);
    });

    it('should reject invalid extensions', () => {
      expect(validateFileExtension('script.exe')).toBe(false);
      expect(validateFileExtension('script.bat')).toBe(false);
      expect(validateFileExtension('script.sh')).toBe(false);
    });

    it('should reject files without extension', () => {
      expect(validateFileExtension('document')).toBe(false);
    });

    it('should handle multiple dots in filename', () => {
      expect(validateFileExtension('my.document.pdf')).toBe(true);
      expect(validateFileExtension('my.document.exe')).toBe(false);
    });
  });

  describe('validateFileMagicNumber', () => {
    it('should validate PDF magic number', () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
      expect(validateFileMagicNumber(pdfBuffer, 'document.pdf')).toBe(true);
    });

    it('should validate JPEG magic number', () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      expect(validateFileMagicNumber(jpegBuffer, 'photo.jpg')).toBe(true);
    });

    it('should validate PNG magic number', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(validateFileMagicNumber(pngBuffer, 'photo.png')).toBe(true);
    });

    it('should allow CSV files (no magic number check)', () => {
      const csvBuffer = Buffer.from('name,age\nJohn,30');
      expect(validateFileMagicNumber(csvBuffer, 'data.csv')).toBe(true);
    });

    it('should reject invalid PDF', () => {
      const invalidPdfBuffer = Buffer.from([0x00, 0x50, 0x44, 0x46]);
      expect(validateFileMagicNumber(invalidPdfBuffer, 'notpdf.pdf')).toBe(false);
    });

    it('should reject invalid JPEG', () => {
      const invalidJpegBuffer = Buffer.from([0x00, 0xD8, 0xFF]);
      expect(validateFileMagicNumber(invalidJpegBuffer, 'notjpeg.jpg')).toBe(false);
    });

    it('should reject invalid PNG', () => {
      const invalidPngBuffer = Buffer.from([0x00, 0x50, 0x4E, 0x47]);
      expect(validateFileMagicNumber(invalidPngBuffer, 'notpng.png')).toBe(false);
    });

    it('should reject truncated files', () => {
      const truncatedBuffer = Buffer.from([0x25, 0x50]);
      expect(validateFileMagicNumber(truncatedBuffer, 'truncated.pdf')).toBe(false);
    });

    it('should be case insensitive for extension', () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      expect(validateFileMagicNumber(pdfBuffer, 'document.PDF')).toBe(true);
    });

    it('should handle different JPEG variants', () => {
      const jpeg2Buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xDB]);
      expect(validateFileMagicNumber(jpeg2Buffer, 'photo.jpg')).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    it('should accept small files', () => {
      const oneKB = 1024;
      expect(validateFileSize(oneKB)).toBe(true);
    });

    it('should accept files up to 20MB', () => {
      const twentyMB = 20 * 1024 * 1024;
      expect(validateFileSize(twentyMB)).toBe(true);
    });

    it('should reject files over 20MB', () => {
      const twentyOneMB = 21 * 1024 * 1024;
      expect(validateFileSize(twentyOneMB)).toBe(false);
    });

    it('should reject empty files', () => {
      expect(validateFileSize(0)).toBe(true);
    });

    it('should handle size at boundary', () => {
      const exactlyTwentyMB = 20 * 1024 * 1024;
      expect(validateFileSize(exactlyTwentyMB)).toBe(true);

      const oneByteLess = exactlyTwentyMB - 1;
      expect(validateFileSize(oneByteLess)).toBe(true);

      const oneByteMore = exactlyTwentyMB + 1;
      expect(validateFileSize(oneByteMore)).toBe(false);
    });
  });

  describe('Combined File Validation', () => {
    it('should validate legitimate PDF', () => {
      const filename = 'medical_report.pdf';
      const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      
      expect(validateFileExtension(filename)).toBe(true);
      expect(validateMimeType('application/pdf')).toBe(true);
      expect(validateFileMagicNumber(buffer, filename)).toBe(true);
      expect(validateFileSize(1024 * 100)).toBe(true);
    });

    it('should validate legitimate JPEG', () => {
      const filename = 'patient_xray.jpg';
      const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      
      expect(validateFileExtension(filename)).toBe(true);
      expect(validateMimeType('image/jpeg')).toBe(true);
      expect(validateFileMagicNumber(buffer, filename)).toBe(true);
      expect(validateFileSize(1024 * 500)).toBe(true);
    });

    it('should reject file with wrong extension', () => {
      const filename = 'virus.exe';
      const buffer = Buffer.from([0x4D, 0x5A]);
      
      expect(validateFileExtension(filename)).toBe(false);
      expect(validateMimeType('application/octet-stream')).toBe(false);
    });

    it('should reject legitimate extension with wrong magic number', () => {
      const filename = 'fake.pdf';
      const buffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00]);
      
      expect(validateFileExtension(filename)).toBe(true);
      expect(validateMimeType('application/pdf')).toBe(true);
      expect(validateFileMagicNumber(buffer, filename)).toBe(false);
    });
  });
});
