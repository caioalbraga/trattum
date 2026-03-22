// In-memory store for photo files between anamnese and cadastro pages
let pendingPhotos: { frente: File | null; lateral: File | null; costas: File | null } = {
  frente: null,
  lateral: null,
  costas: null,
};

export const setPendingPhotos = (photos: typeof pendingPhotos) => {
  pendingPhotos = { ...photos };
};

export const getPendingPhotos = () => pendingPhotos;

export const clearPendingPhotos = () => {
  pendingPhotos = { frente: null, lateral: null, costas: null };
};
