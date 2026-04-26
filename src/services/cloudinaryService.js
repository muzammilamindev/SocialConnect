const CLOUD_NAME = 'dazns63cn';
const UPLOAD_PRESET = 'social_connect_preset';

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * @param {string} base64     - Raw base64 string
 * @param {string} mimeType   - e.g. 'image/jpeg' | 'image/png'
 * @param {string} folder     - Cloudinary folder to organise uploads, e.g. 'posts'
 * @returns {Promise<string>} - Permanent HTTPS URL of the uploaded image
 *
 * @example
 */
export const uploadToCloudinary = async (
  base64,
  mimeType = 'image/jpeg',
  folder = 'posts',
) => {
  if (!base64) throw new Error('No image data provided.');
  const dataUri = `data:${mimeType};base64,${base64}`;

  const body = new FormData();
  body.append('file', dataUri);
  body.append('upload_preset', UPLOAD_PRESET);
  body.append('folder', folder);

  const response = await fetch(CLOUDINARY_URL, {
    method: 'POST',
    body,
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Cloudinary upload failed.');
  }
  return data.secure_url;
};
