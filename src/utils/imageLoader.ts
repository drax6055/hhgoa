import heic2any from 'heic2any';

export async function processAndLoadImage(file: File): Promise<HTMLImageElement> {
  let blob: Blob = file;

  // Check if file is HEIC/HEIF
  const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                 file.name.toLowerCase().endsWith('.heif') ||
                 file.type === 'image/heic' || 
                 file.type === 'image/heif';

  if (isHeic) {
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.85
      });
      blob = Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
      console.warn('heic2any client conversion fallback:', err);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Downscale to max 1200px long edge for extreme speed & GPU memory efficiency
        const maxEdge = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxEdge || height > maxEdge) {
          if (width > height) {
            height = Math.round((height * maxEdge) / width);
            width = maxEdge;
          } else {
            width = Math.round((width * maxEdge) / height);
            height = maxEdge;
          }

          const offCanvas = document.createElement('canvas');
          offCanvas.width = width;
          offCanvas.height = height;
          const ctx = offCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const scaledImg = new Image();
            scaledImg.onload = () => resolve(scaledImg);
            scaledImg.onerror = reject;
            scaledImg.src = offCanvas.toDataURL('image/jpeg', 0.9);
            return;
          }
        }
        resolve(img);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
