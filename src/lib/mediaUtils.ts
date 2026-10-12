/**
 * BÉNIN RÉFLEXOLOGIE MASSAGE — UTILITAIRE MÉDIA EXTERNE & LECTEUR ÉPURÉ
 * Traitement universel des URL externes (YouTube, Vimeo, MP4, WebM, Images).
 * Supprime les contrôles, filigranes et signatures tiers pour imposer un design épuré.
 */

export interface ParsedMedia {
  rawUrl: string;
  type: 'youtube' | 'vimeo' | 'direct_video' | 'image' | 'unknown';
  videoId?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Extrait l'ID YouTube depuis tout format d'URL (watch, shorts, embed, youtu.be)
 */
export function extractYouTubeId(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

/**
 * Extrait l'ID Vimeo depuis tout format d'URL
 */
export function extractVimeoId(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const regExp = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)|player\.vimeo\.com\/video\/)(\d+)/;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

/**
 * Vérifie si l'URL est une vidéo (locale ou externe YouTube/Vimeo/Direct)
 */
export function isMediaVideo(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();

  // YouTube / Vimeo
  if (extractYouTubeId(url) || extractVimeoId(url)) return true;

  // Local / IndexedDB / Data URL vidéo / Supabase Storage
  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('idb://video') ||
    trimmed.startsWith('idb://') ||
    trimmed.startsWith('data:video') ||
    trimmed.includes('video/upload') ||
    trimmed.includes('/videos/') ||
    trimmed.includes('/video/') ||
    trimmed.includes('/video-') ||
    trimmed.includes('sample-massage')
  ) {
    return true;
  }

  // Extensions vidéo directes
  return (
    trimmed.endsWith('.mp4') ||
    trimmed.endsWith('.webm') ||
    trimmed.endsWith('.mov') ||
    trimmed.endsWith('.m4v') ||
    trimmed.endsWith('.ogv') ||
    trimmed.includes('.mp4?') ||
    trimmed.includes('.webm?') ||
    trimmed.includes('.mov?')
  );
}

/**
 * Analyse une URL pour retourner sa structure complète et son URL d'intégration épurée
 */
export function parseMediaUrl(url?: string, options: { autoPlay?: boolean; muted?: boolean; loop?: boolean } = {}): ParsedMedia {
  if (!url || typeof url !== 'string') {
    return { rawUrl: '', type: 'unknown' };
  }

  const trimmed = url.trim();
  const autoPlay = options.autoPlay ?? true;
  const muted = options.muted ?? true;
  const loop = options.loop ?? true;

  // 1. YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Paramètres YouTube pour supprimer contrôles, logos, vidéos suggérées tierces et signatures
    const params = new URLSearchParams({
      autoplay: autoPlay ? '1' : '0',
      mute: muted ? '1' : '0',
      controls: '0',
      modestbranding: '1',
      rel: '0',
      showinfo: '0',
      iv_load_policy: '3',
      disablekb: '1',
      fs: '0',
      playsinline: '1',
      enablejsapi: '1',
      loop: loop ? '1' : '0',
      playlist: ytId,
      widget_referrer: origin,
    });

    return {
      rawUrl: trimmed,
      type: 'youtube',
      videoId: ytId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?${params.toString()}`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
    };
  }

  // 2. Vimeo
  const vimeoId = extractVimeoId(trimmed);
  if (vimeoId) {
    const params = new URLSearchParams({
      autoplay: autoPlay ? '1' : '0',
      muted: muted ? '1' : '0',
      controls: '0',
      background: '1',
      title: '0',
      byline: '0',
      portrait: '0',
      badge: '0',
      loop: loop ? '1' : '0',
      autopause: '0',
    });

    return {
      rawUrl: trimmed,
      type: 'vimeo',
      videoId: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?${params.toString()}`,
      thumbnailUrl: `https://vimeo.com/api/v2/video/${vimeoId}.json`,
    };
  }

  // 3. Vidéo directe HTML5 (MP4, WebM, Blob, IndexedDB)
  if (isMediaVideo(trimmed)) {
    return {
      rawUrl: trimmed,
      type: 'direct_video',
    };
  }

  // 4. Image
  return {
    rawUrl: trimmed,
    type: 'image',
    thumbnailUrl: trimmed,
  };
}

/**
 * Obtient la meilleure miniature (image) pour n'importe quel média
 */
export function getMediaThumbnail(url?: string, fallback?: string): string {
  if (!url || typeof url !== 'string') return fallback || '';
  const parsed = parseMediaUrl(url);

  if (parsed.type === 'youtube' && parsed.thumbnailUrl) {
    return parsed.thumbnailUrl;
  }
  if (parsed.type === 'image') {
    return parsed.rawUrl;
  }
  return fallback || parsed.rawUrl || '';
}

/**
 * Contrôle les lecteurs intégrés iFrame (YouTube / Vimeo) via postMessage
 */
export function sendIframeCommand(iframe: HTMLIFrameElement | null, command: 'play' | 'pause' | 'mute' | 'unmute', type?: 'youtube' | 'vimeo') {
  if (!iframe || !iframe.contentWindow) return;

  try {
    if (type === 'youtube') {
      const ytCommands: Record<string, string> = {
        play: 'playVideo',
        pause: 'pauseVideo',
        mute: 'mute',
        unmute: 'unMute',
      };
      const func = ytCommands[command];
      if (func) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args: '' }),
          '*'
        );
      }
    } else if (type === 'vimeo') {
      if (command === 'play') {
        iframe.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');
      } else if (command === 'pause') {
        iframe.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
      } else if (command === 'mute') {
        iframe.contentWindow.postMessage(JSON.stringify({ method: 'setVolume', value: 0 }), '*');
      } else if (command === 'unmute') {
        iframe.contentWindow.postMessage(JSON.stringify({ method: 'setVolume', value: 1 }), '*');
      }
    }
  } catch (err) {
    console.warn('[mediaUtils] Error sending iframe command:', err);
  }
}
