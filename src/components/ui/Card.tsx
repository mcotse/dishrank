import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

export function Card({
  children,
  padding = 'md',
  shadow = 'sm',
  hoverable = false,
  className = '',
  ...props
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  }

  return (
    <div
      className={`
        bg-white rounded-2xl border border-gray-100
        ${paddingStyles[padding]}
        ${shadowStyles[shadow]}
        ${hoverable ? 'transition-transform duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardImageProps {
  src: string | null
  alt: string
  fallback?: ReactNode
}

export function CardImage({ src, alt, fallback }: CardImageProps) {
  if (!src) {
    return (
      <div className="aspect-dish bg-gray-100 rounded-xl flex items-center justify-center">
        {fallback || (
          <svg
            className="w-12 h-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </div>
    )
  }

  return (
    <div className="aspect-dish overflow-hidden rounded-xl">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  )
}
