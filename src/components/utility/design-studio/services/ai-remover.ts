import type { Config } from '@imgly/background-removal';

export interface RemoveBackgroundOptions {
  onProgress?: (percent: number, message: string) => void;
}

export async function removeImageBackground(
  imageSource: Blob | File | string,
  options?: RemoveBackgroundOptions
): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal');

  let inputBlob: Blob;
  if (typeof imageSource === 'string') {
    // Fetch data url or remote/local url to blob
    const response = await fetch(imageSource);
    inputBlob = await response.blob();
  } else {
    inputBlob = imageSource;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const config: Config = {
    publicPath: `${origin}/vendor/background-removal/`,
    model: 'isnet_quint8',
    device: 'cpu',
    output: {
      format: 'image/png',
      quality: 0.95,
    },
    progress: (key, current, total) => {
      const percent = total > 0 ? Math.round((current / total) * 100) : 0;
      options?.onProgress?.(
        percent,
        total > 0
          ? `Đang xử lý ${key} (${Math.round(current / 1024)}KB / ${Math.round(total / 1024)}KB)`
          : `Đang tải ${key}...`
      );
    },
  };

  return await removeBackground(inputBlob, config);
}
