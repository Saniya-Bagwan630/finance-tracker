import './Card.css'

function Card({ children, className = '', variant = 'default', padding = 'default' }) {
  return (
    <div className={`card card--${variant} card--padding-${padding} ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ children, className = '' }) {
  return (
    <div className={`card-header ${className}`}>
      {children}
    </div>
  )
}

function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`card-title ${className}`}>
      {children}
    </h3>
  )
}

function CardContent({ children, className = '' }) {
  return (
    <div className={`card-content ${className}`}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardContent }