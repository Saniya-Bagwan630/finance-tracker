import { BarChart3 } from 'lucide-react'
import './PlaceholderChart.css'

function PlaceholderChart({ height = 200, type = 'bar', title }) {
  return (
    <div className="placeholder-chart" style={{ height }}>
      <div className="placeholder-chart-content">
        <BarChart3 size={32} className="placeholder-chart-icon" />
        <span className="placeholder-chart-text">
          {title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`}
        </span>
        <span className="placeholder-chart-subtext">Data will appear here</span>
      </div>
      {type === 'bar' && (
        <div className="placeholder-bars">
          <div className="placeholder-bar" style={{ height: '60%' }}></div>
          <div className="placeholder-bar" style={{ height: '80%' }}></div>
          <div className="placeholder-bar" style={{ height: '45%' }}></div>
          <div className="placeholder-bar" style={{ height: '90%' }}></div>
          <div className="placeholder-bar" style={{ height: '70%' }}></div>
          <div className="placeholder-bar" style={{ height: '55%' }}></div>
        </div>
      )}
      {type === 'pie' && (
        <div className="placeholder-pie">
          <div className="placeholder-pie-segment"></div>
        </div>
      )}
      {type === 'line' && (
        <div className="placeholder-line">
          <svg viewBox="0 0 200 60" className="placeholder-line-svg">
            <path 
              d="M0,50 Q30,40 50,45 T100,30 T150,35 T200,20" 
              fill="none" 
              stroke="var(--color-accent)" 
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.3"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

export default PlaceholderChart