// Client-side file validation utilities

export function validateContractFiles(files: File[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  files.forEach((file, index) => {
    // Prüfe Dateigröße
    if (file.size > maxFileSize) {
      errors.push(`Datei ${index + 1}: Dateigröße überschreitet 10MB`);
    }

    // Prüfe Dateityp
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Datei ${index + 1}: Dateityp "${file.type}" nicht erlaubt`);
    }
  });

  // Prüfe Gesamtanzahl
  if (files.length > 5) {
    errors.push("Maximal 5 Dateien erlaubt");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES = 5;
