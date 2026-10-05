// Utility for sending payment confirmation messages directly to the HOS|TED WhatsApp line (+234 907 378 4461)
// so clients NEVER need to have the HOS|TED number saved in their contacts, while preparing & copying/saving
// the REAL outfit picture (zero image URL links in the message text).

export const HOSTED_WHATSAPP_DIRECT_NUMBER = '2349073784461';

export interface WhatsAppDirectImageOrderPayload {
  whatsappClean?: string;
  messageText: string;
  imageUrl?: string;
  orderId: string;
  productName: string;
}

export interface WhatsAppDirectImageResult {
  method: 'direct_wa_with_clipboard_and_photo' | 'direct_wa_with_downloaded_photo' | 'web_share_file';
  statusMessage: string;
}

/**
 * Normalizes any phone number into a clean international WhatsApp number, defaulting to HOS|TED's official line (2349073784461).
 */
export function normalizeHostedWhatsAppNumber(raw?: string): string {
  const digits = (raw || '').replace(/[^0-9]/g, '');
  if (!digits) return HOSTED_WHATSAPP_DIRECT_NUMBER;
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  return digits;
}

/**
 * Fetches an image URL (local asset, data URL, or same-origin URL) and converts it into a clean PNG Blob & File
 * with a subtle HOS|TED Order ID & Outfit Name tag at the bottom so the real photo itself carries the order reference.
 */
export async function fetchOrderImageAsPngFile(
  imageUrl: string | undefined,
  orderId: string,
  productName: string
): Promise<{ blob: Blob; file: File } | null> {
  if (!imageUrl) return null;

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = (err) => reject(err);
      el.src = imageUrl;
    });

    const maxDim = 1200;
    let width = img.naturalWidth || 800;
    let height = img.naturalHeight || 1000;
    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#0c0a09';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    // Subtle order watermark tag at bottom of image so the real photo carries the Order ID & Outfit Name
    const bannerHeight = Math.max(44, Math.round(height * 0.065));
    ctx.fillStyle = 'rgba(12, 10, 9, 0.85)';
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);
    ctx.fillStyle = '#fbbf24';
    const fontSize = Math.max(13, Math.round(bannerHeight * 0.38));
    ctx.font = `bold ${fontSize}px Georgia, serif`;
    ctx.textBaseline = 'middle';
    const labelText = `HOS|TED Order ${orderId} • ${productName} • +234 907 378 4461`.slice(0, 68);
    ctx.fillText(labelText, 16, height - bannerHeight / 2);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png', 0.95)
    );
    if (!pngBlob) return null;

    const safeName = `HOSTED-${orderId}-${productName.replace(/[^a-z0-9]/gi, '_').slice(0, 24)}.png`;
    const file = new File([pngBlob], safeName, { type: 'image/png' });
    return { blob: pngBlob, file };
  } catch {
    try {
      const response = await fetch(imageUrl);
      const rawBlob = await response.blob();
      const safeName = `HOSTED-${orderId}.jpg`;
      const file = new File([rawBlob], safeName, { type: rawBlob.type || 'image/jpeg' });
      return { blob: rawBlob, file };
    } catch {
      return null;
    }
  }
}

/**
 * Copies the real outfit image directly to the system clipboard AND downloads a ready copy to the device
 * so the client can immediately Paste (Ctrl+V / Long-press Paste) or attach it from Recent Photos inside the direct WhatsApp chat.
 */
export async function copyRealOrderImageToClipboard(
  imageUrl: string | undefined,
  orderId: string,
  productName: string
): Promise<boolean> {
  const prepared = await fetchOrderImageAsPngFile(imageUrl, orderId, productName);
  if (!prepared) return false;

  let copied = false;
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const pngBlob =
        prepared.blob.type === 'image/png'
          ? prepared.blob
          : new Blob([await prepared.blob.arrayBuffer()], { type: 'image/png' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': pngBlob,
        }),
      ]);
      copied = true;
    }
  } catch {
    copied = false;
  }

  // Also save the real photo file to the device if clipboard image write wasn't supported
  if (!copied) {
    try {
      const blobUrl = URL.createObjectURL(prepared.blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = prepared.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      return true;
    } catch {
      return false;
    }
  }

  return copied;
}

/**
 * ALWAYS opens the direct WhatsApp chat window to HOS|TED's official WhatsApp line (+234 907 378 4461)
 * using `https://wa.me/2349073784461?text=...` so clients NEVER need to have the number saved in their phone contacts!
 * Simultaneously prepares the REAL outfit picture (copies it directly to clipboard AND saves it to recent photos)
 * so the real image is pasted/attached into the direct HOS|TED chat with zero image links.
 */
export async function sendWhatsAppWithDirectOrderImage(
  payload: WhatsAppDirectImageOrderPayload
): Promise<WhatsAppDirectImageResult> {
  const { whatsappClean, messageText, imageUrl, orderId, productName } = payload;
  const directTargetNumber = normalizeHostedWhatsAppNumber(whatsappClean);

  const prepared = await fetchOrderImageAsPngFile(imageUrl, orderId, productName);

  let copiedToClipboard = false;
  let savedToDevice = false;

  if (prepared) {
    // 1. Copy the REAL PNG image binary directly to the clipboard so Paste (Ctrl+V or Long-Press Paste) in WhatsApp drops the real photo
    try {
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined' && prepared.blob.type === 'image/png') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': prepared.blob,
          }),
        ]);
        copiedToClipboard = true;
      }
    } catch {
      copiedToClipboard = false;
    }

    // 2. Also save the real stamped photo (`HOSTED-Order.png`) to the device's Recent Photos / Downloads
    // so mobile and desktop users can also tap the Gallery/Paperclip icon in the direct WhatsApp chat if they prefer
    try {
      const blobUrl = URL.createObjectURL(prepared.blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = prepared.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 6000);
      savedToDevice = true;
    } catch {
      savedToDevice = false;
    }
  }

  // 3. ALWAYS open the direct WhatsApp chat to HOS|TED's line (+234 907 378 4461)
  // Using https://wa.me/2349073784461?text=... works even when the client does NOT have +234 907 378 4461 saved in their contacts!
  const encodedText = encodeURIComponent(messageText);
  const directWaUrl = `https://wa.me/${directTargetNumber}?text=${encodedText}`;
  const link = document.createElement('a');
  link.href = directWaUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (copiedToClipboard) {
    return {
      method: 'direct_wa_with_clipboard_and_photo',
      statusMessage:
        'Opened HOS|TED WhatsApp (+234 907 378 4461) directly — no need to save our number! Your real outfit photo is copied to your clipboard & saved to your device: simply Paste or attach it in the chat.',
    };
  }

  if (savedToDevice) {
    return {
      method: 'direct_wa_with_downloaded_photo',
      statusMessage:
        'Opened HOS|TED WhatsApp (+234 907 378 4461) directly — no need to save our number! Your real outfit photo was saved to your device: simply tap the photo/attach icon in the WhatsApp chat to send it.',
    };
  }

  return {
    method: 'direct_wa_with_downloaded_photo',
    statusMessage:
      'Opened HOS|TED WhatsApp (+234 907 378 4461) directly — no need to have our number saved in your contacts!',
  };
}
