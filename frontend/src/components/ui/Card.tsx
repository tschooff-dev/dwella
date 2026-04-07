import { ReactNode } from 'react'

interface CardProps {
  title?: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
  noPadding?: boolean
}

export default function Card({ title, description, children, actions, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className={`flex items-center justify-between ${noPadding ? 'px-6 pt-5' : 'px-5 pt-5'} pb-4 border-b border-gray-50`}>
          <div>
            {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  )
}
