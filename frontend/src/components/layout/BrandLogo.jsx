import { Landmark } from 'lucide-react'

function BrandLogo({ compact = false }) {
  return (
    <div className={`brand-logo ${compact ? 'brand-logo--compact' : ''}`}>
      <div className="brand-logo__icon">
        <Landmark size={compact ? 16 : 18} />
      </div>
      <div className="brand-logo__text">
        <span className="brand-logo__title">Finance Tracker</span>
        {!compact && <span className="brand-logo__tag">smart money, clearly managed</span>}
      </div>
    </div>
  )
}

export default BrandLogo
