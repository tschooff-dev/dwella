interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  accent?: boolean
  icon?: React.ReactNode
}

export default function MetricCard({ label, value, subtext, accent = false, icon }: MetricCardProps) {
  return (
    <div className={`card p-5 flex flex-col gap-3 ${accent ? 'border-l-4 border-l-indigo-600' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {icon && (
          <span className="text-gray-400">{icon}</span>
        )}
      </div>
      <div>
        <div className={`text-2xl font-semibold ${accent ? 'text-indigo-600' : 'text-gray-900'}`}>
          {value}
        </div>
        {subtext && (
          <div className="text-xs text-gray-500 mt-0.5">{subtext}</div>
        )}
      </div>
    </div>
  )
}
