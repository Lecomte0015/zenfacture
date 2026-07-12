/**
 * Compression/redimensionnement côté navigateur avant upload, utilisé pour
 * les images de configuration back-office (hero, bannière d'annonce) qui
 * sont ensuite servies telles quelles depuis Supabase Storage (pas de
 * transformation à la volée côté serveur sur le plan utilisé ici).
 *
 * Sans cette étape, une photo prise directement depuis un téléphone (souvent
 * 3-8 Mo, 3000-4000px de large) est uploadée et servie telle quelle : c'est
 * la cause la plus fréquente d'un hero "qui met du temps à s'afficher", même
 * après un rafraîchissement (le fichier reste lourd à chaque chargement).
 */
export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Ne pas compresser si le fichier est déjà sous ce seuil (octets). */
  skipIfUnderBytes?: number;
}

export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    skipIfUnderBytes = 400 * 1024, // 400 Ko
  } = options;

  // SVG et GIF (potentiellement animés) : ne pas re-rasteriser.
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl);

    const alreadySmallEnough =
      img.width <= maxWidth && img.height <= maxHeight && file.size <= skipIfUnderBytes;
    if (alreadySmallEnough) {
      return file;
    }

    const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
    const width = Math.max(1, Math.round(img.width * ratio));
    const height = Math.max(1, Math.round(img.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob) return file;

    // On ne remplace le fichier original que si la compression a réellement
    // réduit le poids (une petite image déjà bien compressée peut parfois
    // ressortir plus lourde en re-encodage JPEG).
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (err) {
    console.error('Erreur lors de la compression de l\'image, envoi du fichier original :', err);
    return file;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Impossible de charger l\'image pour compression'));
    img.src = src;
  });
}
