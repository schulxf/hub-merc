/**
 * Image Optimization Utilities
 *
 * Provides client-side image compression, resizing, and thumbnail generation.
 * Reduces storage costs and improves upload speeds for Firebase Cloud Storage.
 *
 * Usage:
 * ```javascript
 * // Compress image to JPEG quality 80%
 * const compressed = await compressImage(file, 0.8);
 *
 * // Resize to max dimensions
 * const resized = await resizeImage(file, { maxWidth: 1200, maxHeight: 800 });
 *
 * // Generate thumbnail
 * const thumbnail = await generateThumbnail(file, { width: 300, height: 200 });
 * ```
 */

/**
 * Compress image with configurable quality
 * Converts to JPEG for best compression ratio
 *
 * @param {File} file - Image file to compress
 * @param {number} quality - Quality level 0-1 (default: 0.8)
 * @returns {Promise<Blob>} Compressed image blob
 */
export async function compressImage(file, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Resize image to maximum dimensions (maintains aspect ratio)
 *
 * @param {File} file - Image file to resize
 * @param {Object} options - Configuration object
 * @param {number} options.maxWidth - Maximum width in pixels (default: 1200)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 800)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.85)
 * @returns {Promise<Blob>} Resized image blob
 */
export async function resizeImage(
  file,
  { maxWidth = 1200, maxHeight = 800, quality = 0.85 } = {}
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const ratio = Math.min(widthRatio, heightRatio);

          width *= ratio;
          height *= ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Generate thumbnail from image
 * Useful for preview images in lists
 *
 * @param {File} file - Image file
 * @param {Object} options - Configuration object
 * @param {number} options.width - Thumbnail width in pixels (default: 300)
 * @param {number} options.height - Thumbnail height in pixels (default: 200)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.75)
 * @returns {Promise<Blob>} Thumbnail image blob
 */
export async function generateThumbnail(
  file,
  { width = 300, height = 200, quality = 0.75 } = {}
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate dimensions to cover the target area (crop if needed)
        const imgRatio = img.width / img.height;
        const thumbRatio = width / height;

        let srcWidth = img.width;
        let srcHeight = img.height;
        let srcX = 0;
        let srcY = 0;

        if (imgRatio > thumbRatio) {
          // Image is wider, crop sides
          srcWidth = img.height * thumbRatio;
          srcX = (img.width - srcWidth) / 2;
        } else {
          // Image is taller, crop top/bottom
          srcHeight = img.width / thumbRatio;
          srcY = (img.height - srcHeight) / 2;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get file size in human-readable format
 *
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate image file before processing
 *
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @param {string[]} options.allowedTypes - Allowed MIME types (default: common image types)
 * @param {number} options.maxSize - Maximum file size in bytes (default: 10MB)
 * @returns {Object} {valid: boolean, error?: string}
 */
export function validateImageFile(
  file,
  {
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxSize = 10 * 1024 * 1024, // 10MB
  } = {}
) {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Aceito: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${formatFileSize(maxSize)}`,
    };
  }

  return { valid: true };
}

/**
 * Process image file with all optimizations
 * Combines validation, compression, and resizing
 *
 * @param {File} file - Image file to process
 * @param {Object} options - Processing options
 * @param {number} options.quality - Compression quality (default: 0.8)
 * @param {number} options.maxWidth - Max width for resizing (default: 1200)
 * @param {number} options.maxHeight - Max height for resizing (default: 800)
 * @returns {Promise<{original: Blob, compressed: Blob, thumbnail: Blob}>}
 */
export async function processImageFile(file, options = {}) {
  const { quality = 0.8, maxWidth = 1200, maxHeight = 800 } = options;

  // Validate
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Process in parallel for efficiency
    const [compressed, thumbnail] = await Promise.all([
      resizeImage(file, { maxWidth, maxHeight, quality }),
      generateThumbnail(file),
    ]);

    return {
      original: file,
      compressed,
      thumbnail,
    };
  } catch (error) {
    throw new Error(`Erro ao processar imagem: ${error.message}`);
  }
}
