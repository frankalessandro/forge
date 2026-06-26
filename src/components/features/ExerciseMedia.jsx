// Muestra la media de un ejercicio: prioriza el video/animación si existe,
// y cae a la imagen. No renderiza nada si no hay media.
export default function ExerciseMedia({ imageUrl, videoUrl, alt, className = '' }) {
  if (!imageUrl && !videoUrl) return null

  return (
    <div className={`rounded-2xl overflow-hidden border border-ink-800 bg-black ${className}`}>
      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          playsInline
          loop
          muted
          poster={imageUrl || undefined}
          className="w-full max-h-80 object-contain"
        />
      ) : (
        <img src={imageUrl} alt={alt ?? ''} loading="lazy" className="w-full max-h-80 object-contain" />
      )}
    </div>
  )
}
