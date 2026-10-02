const CLOUD_NAME = 'oc8buhae';
const UPLOAD_PRESET = 'cloudd';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export async function uploadImageToCloudinary(
  fileOrBase64: File | Blob | string
): Promise<string> {
  const formData = new FormData();
  formData.append('upload_preset', UPLOAD_PRESET);

  if (typeof fileOrBase64 === 'string') {
    // If it's already an http(s) URL (like external image or bot pfp), return as is
    if (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://')) {
      return fileOrBase64;
    }
    formData.append('file', fileOrBase64);
  } else {
    formData.append('file', fileOrBase64);
  }

  try {
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(
        errorJson.error?.message || `Cloudinary upload failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data.secure_url || data.url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}
