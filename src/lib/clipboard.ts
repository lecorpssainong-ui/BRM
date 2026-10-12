/**
 * Safe clipboard helper that prevents "Document is not focused" DOMException
 * when called inside iframes or without active user document focus.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Strategy 1: Modern async Clipboard API with focus check and try/catch
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // Falls through to fallback on "Document is not focused" or permission error
  }

  // Strategy 2: Fallback using temporary textarea + execCommand
  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Avoid scrolling to bottom
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0.01';
      textArea.setAttribute('readonly', '');

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch {
    // Ignore fallback failures safely
  }

  return false;
}
