const COLORS = ['#4f46e5', '#0891b2', '#7c3aed', '#059669', '#d97706', '#dc2626']

export function avatarColor(name: string) {
  const sum = (name || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return COLORS[sum % COLORS.length]
}

export function initials(firstName: string, lastName: string) {
  return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase()
}

interface Props {
  name: string
  size?: number
}

export default function Avatar({ name, size = 32 }: Props) {
  const color = avatarColor(name)
  const letters = name
    .split(' ')
    .map(p => p[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#fff',
        fontSize: Math.max(10, Math.round(size * 0.38)),
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '0.02em',
      }}
    >
      {letters || '?'}
    </div>
  )
}
