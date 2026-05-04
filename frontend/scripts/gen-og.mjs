import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load Plus Jakarta Sans font weights
const fontRegular = readFileSync(join(__dirname, '../node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff'))
const fontBold = readFileSync(join(__dirname, '../node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff'))

const svg = await satori(
  {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        background: 'linear-gradient(160deg, #1e1b4b 0%, #0d0f18 55%, #0c1a2e 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans'",
      },
      children: [
        // Grid texture overlay
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute', inset: 0, opacity: 0.04,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            },
          },
        },
        // Glow orb top-left
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute', top: -160, left: -100,
              width: 600, height: 600, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(79,70,229,0.35) 0%, transparent 70%)',
            },
          },
        },
        // Glow orb bottom-right
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute', bottom: -120, right: -80,
              width: 500, height: 500, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(8,145,178,0.2) 0%, transparent 70%)',
            },
          },
        },
        // Main content
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '64px 80px',
            },
            children: [
              // Logo row
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: 16 },
                  children: [
                    // Arch mark SVG as inline img (satori supports svg strings via img)
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: 52, height: 54,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                width: 48, height: 50,
                                background: '#818cf8',
                                clipPath: 'path("M4 48 L4 22 A18 18 0 0 1 40 22 L40 48 Z M14 48 L14 34 Q14 30 22 30 Q30 30 30 34 L30 48 Z")',
                              },
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' },
                        children: 'Zenant',
                      },
                    },
                  ],
                },
              },
              // Center copy
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', gap: 20 },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          background: 'rgba(129,140,248,0.15)',
                          border: '1px solid rgba(129,140,248,0.3)',
                          borderRadius: 24, padding: '6px 18px',
                          fontSize: 14, fontWeight: 800, color: '#a5b4fc',
                          letterSpacing: '0.07em', textTransform: 'uppercase',
                          width: 'fit-content',
                        },
                        children: 'Property Management, Simplified',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: 58, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: 900 },
                        children: 'The easier way to manage your rental properties.',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: 24, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 },
                        children: 'Payments · Maintenance · Leases · Tenant Communication',
                      },
                    },
                  ],
                },
              },
              // Bottom row — stats
              {
                type: 'div',
                props: {
                  style: { display: 'flex', gap: 56, alignItems: 'flex-end' },
                  children: [
                    ...[
                      { value: '12,400+', label: 'Properties' },
                      { value: '$48M', label: 'Collected' },
                      { value: '< 2 hrs', label: 'Avg Response' },
                    ].map(stat => ({
                      type: 'div',
                      props: {
                        style: { display: 'flex', flexDirection: 'column', gap: 4 },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: { fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' },
                              children: stat.value,
                            },
                          },
                          {
                            type: 'div',
                            props: {
                              style: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 },
                              children: stat.label,
                            },
                          },
                        ],
                      },
                    })),
                    // Spacer + domain
                    {
                      type: 'div',
                      props: {
                        style: { flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: { fontSize: 16, color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.04em' },
                              children: 'zenantapp.com',
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Bottom gradient bar
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 5,
              background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #0891b2)',
            },
          },
        },
      ],
    },
  },
  {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Plus Jakarta Sans', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Plus Jakarta Sans', data: fontBold, weight: 800, style: 'normal' },
    ],
  }
)

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
const png = resvg.render().asPng()
writeFileSync(join(__dirname, '../public/og-image.png'), png)
console.log('Generated public/og-image.png')
