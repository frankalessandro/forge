// Muestra la media de un ejercicio. Los GIFs se renderizan como <img> (animados).
// Videos reales (mp4/webm) usan <video>.
export default function ExerciseMedia({ imageUrl, videoUrl, alt, className = '' }) {
  if (!imageUrl && !videoUrl) return null

  const isGif = videoUrl?.toLowerCase().endsWith('.gif')

  return (
    <div className={`rounded-2xl overflow-hidden border border-ink-800 bg-black ${className}`}>
      {videoUrl && !isGif ? (
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
        <img
          src={videoUrl || imageUrl}
          alt={alt ?? ''}
          loading="lazy"
          className="w-full max-h-80 object-contain"
        />
      )}
    </div>
  )
}
