function Button({
  children,
  onClick,
  className = '',
  size = 'medium',
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  size?: 'small' | 'medium' | 'large'
}) {
  const sizeClasses = {
    small: 'text-sm px-3 py-2',
    medium: 'text-base px-4 py-4',
    large: 'text-lg px-5 py-4',
  }

  return (
    <button
      onClick={onClick}
      className={`bg-foreground cursor-pointer text-background rounded hover:opacity-75 duration-300 transition font-medium  ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button
