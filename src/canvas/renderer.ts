export interface RenderOptions {
  format?: string;
  themeId?: string;
  userImage: HTMLImageElement | null;
  scale: number; // 0.5 to 2.5
  offsetX: number; // -200 to 200
  offsetY: number; // -200 to 200
  rotation: number; // -180 to 180
  name: string;
  stackRole: string;
  builderTitle?: string;
}

let badgeTemplateImage: HTMLImageElement | null = null;
let badgeTemplatePromise: Promise<HTMLImageElement> | null = null;

let goaStickerImage: HTMLImageElement | null = null;
let goaStickerPromise: Promise<HTMLImageElement> | null = null;

export function loadBadgeTemplate(): Promise<HTMLImageElement> {
  if (badgeTemplateImage && badgeTemplateImage.complete) {
    return Promise.resolve(badgeTemplateImage);
  }
  if (badgeTemplatePromise) {
    return badgeTemplatePromise;
  }
  badgeTemplatePromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      badgeTemplateImage = img;
      resolve(img);
    };
    img.onerror = (err) => {
      console.error('Failed to load /badge_template.png', err);
      reject(err);
    };
    img.src = '/badge_template.png';
  });
  return badgeTemplatePromise;
}

export function loadGoaSticker(): Promise<HTMLImageElement> {
  if (goaStickerImage && goaStickerImage.complete) {
    return Promise.resolve(goaStickerImage);
  }
  if (goaStickerPromise) {
    return goaStickerPromise;
  }
  goaStickerPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      goaStickerImage = img;
      resolve(img);
    };
    img.onerror = (err) => {
      console.error('Failed to load /goa_sticker.png', err);
      reject(err);
    };
    img.src = '/goa_sticker.png';
  });
  return goaStickerPromise;
}

// Pre-trigger image loading
loadBadgeTemplate().catch(() => { });
loadGoaSticker().catch(() => { });

export function drawGraphic(canvas: HTMLCanvasElement, options: RenderOptions) {
  // Define High-Res Badge Canvas Dimensions (1587 x 2245)
  const width = 1587;
  const height = 2245;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear Canvas
  ctx.clearRect(0, 0, width, height);

  renderFormatB(ctx, width, height, options, canvas);
}

// Official Bold Hacker House Event ID Badge (1587 x 2245)
function renderFormatB(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: RenderOptions,
  canvas?: HTMLCanvasElement
) {
  // If badge template background image is ready, draw it directly
  if (badgeTemplateImage && badgeTemplateImage.complete && badgeTemplateImage.naturalWidth > 0) {
    ctx.drawImage(badgeTemplateImage, 0, 0, width, height);
  } else {
    // Fallback background while loading image
    ctx.fillStyle = '#063b27';
    ctx.fillRect(0, 0, width, height);

    // Re-draw when template finishes loading
    loadBadgeTemplate().then(() => {
      if (canvas) drawGraphic(canvas, opts);
    });
  }

  // 1. Photo Slot — Covers Full Space of White Card (521 x 596) with matching Corner Radius (44px)
  const photoX = 521;
  const photoY = 596;
  const photoW = 499;
  const photoH = 580;
  const photoRadius = 44;

  if (opts.userImage) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.clip();

    ctx.translate(photoX + photoW / 2 + opts.offsetX * 1.5, photoY + photoH / 2 + opts.offsetY * 1.5);
    ctx.rotate((opts.rotation * Math.PI) / 180);

    const img = opts.userImage;
    const aspect = img.width / img.height;
    let drawW = photoW * opts.scale;
    let drawH = drawW / aspect;

    if (drawH < photoH * opts.scale) {
      drawH = photoH * opts.scale;
      drawW = drawH * aspect;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  } else {
    // Placeholder covering full white card space
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.fill();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '600 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📷 Click / Drag Photo', photoX + photoW / 2, photoY + photoH / 2 - 40);
    ctx.restore();
  }

  // 2. Render Red "गोवा" Sticker Badge ON TOP of the Photo
  if (goaStickerImage && goaStickerImage.complete && goaStickerImage.naturalWidth > 0) {
    ctx.drawImage(goaStickerImage, 608, 972, 300, 280);
  } else {
    loadGoaSticker().then(() => {
      if (canvas) drawGraphic(canvas, opts);
    });
  }

  // 3. Name Slot (Inside Pink Banner on Template)
  if (opts.name && opts.name.trim()) {
    ctx.save();
    const nameText = opts.name.trim().toUpperCase();
    let fontSize = 52;
    ctx.font = `900 ${fontSize}px Inter, Outfit, sans-serif`;
    while (ctx.measureText(nameText).width > 540 && fontSize > 20) {
      fontSize -= 2;
      ctx.font = `900 ${fontSize}px Inter, Outfit, sans-serif`;
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameText, 799, 1393);
    ctx.restore();
  }

  // 4. Role / Tech Stack Slot (Bottom-Left Green Section)
  const roleVal = opts.stackRole || opts.builderTitle;
  if (roleVal && roleVal.trim()) {
    ctx.save();
    const roleText = roleVal.trim().toUpperCase();
    let roleFontSize = 42;
    ctx.font = `900 ${roleFontSize}px Inter, Outfit, sans-serif`;
    while (ctx.measureText(roleText).width > 720 && roleFontSize > 22) {
      roleFontSize -= 2;
      ctx.font = `900 ${roleFontSize}px Inter, Outfit, sans-serif`;
    }

    ctx.fillStyle = '#F9B60D'; // Vibrant Yellow matching QR box
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(roleText, 109, 2085);
    ctx.restore();
  }
}


