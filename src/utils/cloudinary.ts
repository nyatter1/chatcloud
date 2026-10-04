const CLOUD_NAME = 'oc8buhae';
const UPLOAD_PRESET = 'cloudd';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Compresses an image file/blob or base64 string to lightweight base64 Data URL
 * to avoid hitting Firestore document size limits (1MB) if offline or fallback.
 */
export async function compressImage(
  fileOrBase64: File | Blob | string,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (
      typeof fileOrBase64 === 'string' &&
      (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))
    ) {
      resolve(fileOrBase64);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const loadImg = (src: string) => {
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        if (typeof fileOrBase64 === 'string') resolve(fileOrBase64);
        else reject(new Error('Failed to load image for compression'));
      };
      img.src = src;
    };

    if (typeof fileOrBase64 === 'string') {
      loadImg(fileOrBase64);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        loadImg(e.target?.result as string);
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(fileOrBase64);
    }
  });
}

/**
 * Uploads an image to Cloudinary CDN and returns the secure URL.
 * Falls back to a compressed lightweight JPEG Data URL if Cloudinary fails or is offline.
 */
export async function uploadImageToCloudinary(
  fileOrBase64: File | Blob | string,
  options?: { isBanner?: boolean }
): Promise<string> {
  if (
    typeof fileOrBase64 === 'string' &&
    (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))
  ) {
    return fileOrBase64;
  }

  const maxWidth = options?.isBanner ? 1200 : 400;
  const maxHeight = options?.isBanner ? 400 : 400;

  // Compress image first
  let compressedDataUrl: string = '';
  try {
    compressedDataUrl = await compressImage(fileOrBase64, maxWidth, maxHeight, 0.85);
  } catch {
    if (typeof fileOrBase64 === 'string') compressedDataUrl = fileOrBase64;
  }

  const formData = new FormData();
  formData.append('upload_preset', UPLOAD_PRESET);

  if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
    formData.append('file', fileOrBase64);
  } else {
    formData.append('file', compressedDataUrl || fileOrBase64);
  }

  try {
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      console.warn('Cloudinary response warning:', errorJson.error?.message);
      if (compressedDataUrl) {
        return compressedDataUrl;
      }
      throw new Error(
        errorJson.error?.message || `Cloudinary upload failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data.secure_url || data.url || compressedDataUrl;
  } catch (error) {
    console.warn('Cloudinary upload fallback used:', error);
    if (compressedDataUrl) {
      return compressedDataUrl;
    }
    throw error;
  }
}

const AUDIO_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;

/**
 * Uploads an audio/MP3 file to Cloudinary CDN with progress tracking and returns the secure URL.
 */
export async function uploadAudioToCloudinary(
  fileOrBase64: File | Blob | string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (
    typeof fileOrBase64 === 'string' &&
    (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))
  ) {
    onProgress?.(100);
    return fileOrBase64;
  }

  const formData = new FormData();
  formData.append('upload_preset', UPLOAD_PRESET);

  if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
    formData.append('file', fileOrBase64);
  } else {
    formData.append('file', fileOrBase64);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', AUDIO_UPLOAD_URL);

    if (xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress?.(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const url = data.secure_url || data.url;
          onProgress?.(100);
          resolve(url);
        } catch {
          if (typeof fileOrBase64 === 'string') resolve(fileOrBase64);
          else reject(new Error('Failed to parse Cloudinary upload response'));
        }
      } else {
        console.warn('Cloudinary audio upload failed with status:', xhr.status);
        if (typeof fileOrBase64 === 'string') {
          resolve(fileOrBase64);
        } else {
          reject(new Error(`Audio upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      console.warn('Cloudinary audio upload network error');
      if (typeof fileOrBase64 === 'string') {
        resolve(fileOrBase64);
      } else {
        reject(new Error('Network error during audio upload'));
      }
    };

    xhr.send(formData);
  });
}

/**
 * Uploads media (image, gif, or video) to Cloudinary and returns { url, type }.
 */
export async function uploadNewsMediaToCloudinary(
  file: File
): Promise<{ url: string; type: 'image' | 'video' | 'gif' }> {
  const isVideo = file.type.startsWith('video/');
  const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
  const mediaType: 'image' | 'video' | 'gif' = isVideo ? 'video' : isGif ? 'gif' : 'image';

  const endpoint = isVideo ? AUDIO_UPLOAD_URL : UPLOAD_URL;
  const formData = new FormData();
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('file', file);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      return { url: data.secure_url || data.url, type: mediaType };
    }
  } catch (err) {
    console.warn('Media upload to Cloudinary failed, falling back to local data URL:', err);
  }

  // Fallback to local Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ url: reader.result as string, type: mediaType });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
