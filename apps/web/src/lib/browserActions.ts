export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function shareOrCopy(title: string, text: string, url: string) {
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return 'Share sheet opened.';
  }

  await navigator.clipboard.writeText(url);
  return 'Link copied to clipboard.';
}
