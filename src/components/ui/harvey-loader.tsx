interface HarveyLoaderProps {
  message?: string
}

export function HarveyLoader({ message = 'Loading Documents...' }: HarveyLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center animate-pulse transition">
      <div className="text-center">
        <h1 className="flex items-center gap-2 self-center font-medium font-serif text-4xl mb-4 ">
          Harvey: Data Room
        </h1>
        <p>{message}</p>
      </div>
    </div>
  )
}
