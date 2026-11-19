// The photo library: images the person loads from their machine, plus the
// sample scenes that ship with the app. Photos never leave the machine; each one
// is held as an Image the canvas can draw.

/** Loads an image from a URL and resolves once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image'));
    img.src = url;
  });
}

export function createPhotoLibrary() {
  const photos = [];
  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => fn(photos));

  return {
    get photos() {
      return photos;
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    async addFile(file) {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      const photo = { img, name: file.name.replace(/\.[^.]+$/, ''), url };
      photos.push(photo);
      notify();
      return photo;
    },
    async addSample(name, url) {
      const img = await loadImage(url);
      const photo = { img, name, url };
      photos.push(photo);
      notify();
      return photo;
    },
    remove(index) {
      const [photo] = photos.splice(index, 1);
      if (photo && photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url);
      notify();
      return photo;
    },
    clear() {
      photos.splice(0, photos.length);
      notify();
    },
  };
}
