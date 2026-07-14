// Redimensiona y comprime una imagen en el cliente antes de subirla (evita
// guardar fotos de cámara de varios MB tal cual). Nada de base64: eso
// codifica el binario en texto y el resultado pesa ~33% más, no menos — la
// forma real de aligerar una imagen es bajarle resolución y recomprimirla.
export async function compressImage(file, { maxSize = 512, quality = 0.82 } = {}) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen'))),
      'image/jpeg',
      quality
    )
  })
}
