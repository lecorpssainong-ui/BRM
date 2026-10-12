/**
 * BÉNIN RÉFLEXOLOGIE MASSAGE — RÉSOLVEUR & NORMALISEUR UNIVERSEL DE MÉDIAS
 * Supporte :
 * 1. Liens YouTube (youtube.com, youtu.be, shorts, embeds, live)
 * 2. Liens Google Drive (view, open, preview, download, direct stream, thumbnails)
 * 3. Liens Google Images & Redirections Google (imgres, google.com/url?q=...)
 * 4. Liens Vimeo & Dailymotion
 * 5. Liens Cloudinary, Imgur, Giphy, Tenor, Unsplash, Pexels
 * 6. Fichiers vidéo directs (MP4, WebM, MOV, OGV, M4V, idb://, data:video)
 * 7. Fichiers images directs (JPG, PNG, WebP, GIF, SVG, AVIF, data:image)
 */

export interface ResolvedMediaInfo {
  rawUrl: string;
  cleanUrl: string;
  type: 'youtube' | 'vimeo' | 'dailymotion' | 'googledrive' | 'video' | 'image' | 'unknown';
  isEmbeddableVideo: boolean;
  isVideo: boolean;
  isImage: boolean;
  embedUrl?: string;
  streamUrl?: string;
  thumbnailUrl?: string;
  badgeLabel: string;
  badgeColor: string;
}

/**
 * Nettoie une URL brute (espaces, guillemets, protocoles manquants, redirections Google)
 */
export function cleanRawUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let url = input.trim();

  // Supprimer d'éventuels guillemets ou chevrons
  url = url.replace(/^["'<]+|["'>]+$/g, '');

  // Décodage de redirections Google Images : google.com/imgres?imgurl=...
  if (url.includes('google.') && url.includes('imgurl=')) {
    try {
      const match = url.match(/imgurl=([^&]+)/i);
      if (match && match[1]) {
        url = decodeURIComponent(match[1]);
      }
    } catch {}
  }

  // Décodage de redirections Google Search : google.com/url?q=... ou url=...
  if (url.includes('google.') && (url.includes('url?q=') || url.includes('url?url='))) {
    try {
      const match = url.match(/[?&](?:q|url)=([^&]+)/i);
      if (match && match[1]) {
        url = decodeURIComponent(match[1]);
      }
    } catch {}
  }

  // Détection si l'URL commence sans protocole (ex: youtube.com/... ou drive.google.com/...)
  if (
    !url.startsWith('http://') &&
    !url.startsWith('https://') &&
    !url.startsWith('data:') &&
    !url.startsWith('blob:') &&
    !url.startsWith('idb://') &&
    !url.startsWith('/')
  ) {
    url = `https://${url}`;
  }

  return url;
}

/**
 * Extrait l'ID d'une vidéo YouTube
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const clean = cleanRawUrl(url);

  // Formats supportés :
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtube.com/v/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i,
    /youtube\.com\/.*[?&]v=([\w-]{11})/i,
    /^([\w-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extrait l'ID d'un fichier Google Drive
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const clean = cleanRawUrl(url);

  if (!clean.includes('drive.google.com') && !clean.includes('docs.google.com')) {
    return null;
  }

  // Formats supportés :
  // - https://drive.google.com/file/d/FILE_ID/view...
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID
  // - https://drive.google.com/thumbnail?id=FILE_ID
  const patterns = [
    /\/file\/d\/([\w-]+)/i,
    /\/d\/([\w-]+)/i,
    /[?&]id=([\w-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extrait l'ID d'une vidéo Vimeo
 */
export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const clean = cleanRawUrl(url);
  const match = clean.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Extrait l'ID d'une vidéo Dailymotion
 */
export function extractDailymotionId(url: string): string | null {
  if (!url) return null;
  const clean = cleanRawUrl(url);
  const match = clean.match(/(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([\w-]+)/i);
  return match ? match[1] : null;
}

/**
 * Analyse complète et résolution d'un lien multimédia
 */
export function resolveMedia(rawInput: string): ResolvedMediaInfo {
  const cleanUrl = cleanRawUrl(rawInput);

  if (!cleanUrl) {
    return {
      rawUrl: rawInput || '',
      cleanUrl: '',
      type: 'unknown',
      isEmbeddableVideo: false,
      isVideo: false,
      isImage: false,
      badgeLabel: 'Inconnu',
      badgeColor: 'gray',
    };
  }

  // 1. YouTube
  const ytId = extractYouTubeId(cleanUrl);
  if (ytId) {
    return {
      rawUrl: rawInput,
      cleanUrl: `https://www.youtube.com/watch?v=${ytId}`,
      type: 'youtube',
      isEmbeddableVideo: true,
      isVideo: true,
      isImage: false,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1&controls=0&showinfo=0&iv_load_policy=3&enablejsapi=1`,
      streamUrl: `https://www.youtube.com/watch?v=${ytId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      badgeLabel: '🔴 Vidéo YouTube',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
  }

  // 2. Google Drive
  const gDriveId = extractGoogleDriveId(cleanUrl);
  if (gDriveId) {
    const isExplicitVideo =
      cleanUrl.toLowerCase().includes('video') ||
      cleanUrl.toLowerCase().includes('.mp4') ||
      cleanUrl.toLowerCase().includes('.mov');

    return {
      rawUrl: rawInput,
      cleanUrl,
      type: 'googledrive',
      isEmbeddableVideo: true,
      isVideo: true,
      isImage: !isExplicitVideo,
      embedUrl: `https://drive.google.com/file/d/${gDriveId}/preview`,
      streamUrl: `https://drive.google.com/uc?export=download&id=${gDriveId}`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${gDriveId}&sz=w1200`,
      badgeLabel: '🔵 Google Drive Média',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
  }

  // 3. Vimeo
  const vimeoId = extractVimeoId(cleanUrl);
  if (vimeoId) {
    return {
      rawUrl: rawInput,
      cleanUrl: `https://vimeo.com/${vimeoId}`,
      type: 'vimeo',
      isEmbeddableVideo: true,
      isVideo: true,
      isImage: false,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&autopause=0`,
      streamUrl: `https://vimeo.com/${vimeoId}`,
      thumbnailUrl: `https://vumbnail.com/${vimeoId}.jpg`,
      badgeLabel: '🔷 Vidéo Vimeo',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    };
  }

  // 4. Dailymotion
  const dailyId = extractDailymotionId(cleanUrl);
  if (dailyId) {
    return {
      rawUrl: rawInput,
      cleanUrl: `https://www.dailymotion.com/video/${dailyId}`,
      type: 'dailymotion',
      isEmbeddableVideo: true,
      isVideo: true,
      isImage: false,
      embedUrl: `https://www.dailymotion.com/embed/video/${dailyId}?autoplay=1&mute=1`,
      streamUrl: `https://www.dailymotion.com/video/${dailyId}`,
      thumbnailUrl: `https://www.dailymotion.com/thumbnail/video/${dailyId}`,
      badgeLabel: '🟠 Vidéo Dailymotion',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    };
  }

  // 5. Fichiers Vidéo Directs (MP4, WebM, MOV, idb://video, data:video, etc.)
  const lower = cleanUrl.toLowerCase();
  const isExplicitVideo =
    lower.startsWith('idb://video') ||
    lower.startsWith('data:video') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m4v') ||
    lower.endsWith('.ogv') ||
    lower.includes('video/upload') ||
    lower.includes('/video-') ||
    lower.includes('sample-massage') ||
    lower.includes('.mp4?') ||
    lower.includes('.webm?');

  if (isExplicitVideo) {
    return {
      rawUrl: rawInput,
      cleanUrl,
      type: 'video',
      isEmbeddableVideo: false,
      isVideo: true,
      isImage: false,
      streamUrl: cleanUrl,
      badgeLabel: 'Direct (MP4/WebM)',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    };
  }

  // 6. Giphy / Tenor
  if (lower.includes('giphy.com') || lower.includes('tenor.com')) {
    let gifUrl = cleanUrl;
    if (lower.includes('giphy.com/gifs/')) {
      const match = cleanUrl.match(/giphy\.com\/gifs\/(?:.*-)?([a-zA-Z0-9]+)/i);
      if (match && match[1]) {
        gifUrl = `https://media.giphy.com/media/${match[1]}/giphy.gif`;
      }
    }
    return {
      rawUrl: rawInput,
      cleanUrl: gifUrl,
      type: 'image',
      isEmbeddableVideo: false,
      isVideo: false,
      isImage: true,
      thumbnailUrl: gifUrl,
      badgeLabel: '✨ Animation GIF',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    };
  }

  // 7. Google Photos / CDN d'images Google
  if (lower.includes('googleusercontent.com') || lower.includes('ggpht.com')) {
    return {
      rawUrl: rawInput,
      cleanUrl,
      type: 'image',
      isEmbeddableVideo: false,
      isVideo: false,
      isImage: true,
      thumbnailUrl: cleanUrl,
      badgeLabel: '🟢 Photo Google CDN',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
  }

  // 8. Fichiers Images Directs (JPG, PNG, WebP, idb://image, data:image, etc.)
  const isExplicitImage =
    lower.startsWith('idb://image') ||
    lower.startsWith('data:image') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.avif') ||
    lower.includes('images.unsplash.com') ||
    lower.includes('images.pexels.com') ||
    lower.includes('i.imgur.com') ||
    lower.includes('image/upload') ||
    lower.includes('.jpg?') ||
    lower.includes('.jpeg?') ||
    lower.includes('.png?') ||
    lower.includes('.webp?');

  if (isExplicitImage) {
    return {
      rawUrl: rawInput,
      cleanUrl,
      type: 'image',
      isEmbeddableVideo: false,
      isVideo: false,
      isImage: true,
      thumbnailUrl: cleanUrl,
      badgeLabel: '🖼️ Image Web/Galerie',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
  }

  // 9. Si clé idb:// générique
  if (lower.startsWith('idb://')) {
    const isVideoIdb = lower.includes('video');
    return {
      rawUrl: rawInput,
      cleanUrl,
      type: isVideoIdb ? 'video' : 'image',
      isEmbeddableVideo: false,
      isVideo: isVideoIdb,
      isImage: !isVideoIdb,
      streamUrl: isVideoIdb ? cleanUrl : undefined,
      thumbnailUrl: !isVideoIdb ? cleanUrl : undefined,
      badgeLabel: isVideoIdb ? '🟣 Vidéo Galerie Local' : '🖼️ Image Galerie Local',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    };
  }

  // 9. Par défaut : URL Web générique considérée comme image/média
  return {
    rawUrl: rawInput,
    cleanUrl,
    type: 'image',
    isEmbeddableVideo: false,
    isVideo: false,
    isImage: true,
    thumbnailUrl: cleanUrl,
    badgeLabel: '🌐 Lien Web Direct',
    badgeColor: 'bg-gold/20 text-amber-200 border-gold/30',
  };
}

/**
 * Détermine rapidement si une URL représente un média vidéo (direct ou intégrable)
 */
export function isDirectVideoFormat(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const info = resolveMedia(url);
  return info.isVideo || info.isEmbeddableVideo;
}

