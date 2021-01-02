import { define, h } from 'js-elements'
import { useStyles } from 'js-elements/hooks'

const icon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="3 3 16 16"
    width="40"
    height="40"
  >
    <defs>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        y2="-2.623"
        x2="0"
        y1="986.67"
        id="0"
      >
        <stop stop-color="#ffce3b" />
        <stop offset="1" stop-color="#ffd762" />
      </linearGradient>
      <linearGradient
        y2="-2.623"
        x2="0"
        y1="986.67"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#ffce3b" />
        <stop offset="1" stop-color="#fef4ab" />
      </linearGradient>
    </defs>
    <g transform="matrix(1.99997 0 0 1.99997-10.994-2071.68)" fill="#da4453">
      <rect y="1037.36" x="7" height="8" width="8" fill="#32c671" rx="4" />
      <path
        d="m123.86 12.966l-11.08-11.08c-1.52-1.521-3.368-2.281-5.54-2.281-2.173 0-4.02.76-5.541 2.281l-53.45 53.53-23.953-24.04c-1.521-1.521-3.368-2.281-5.54-2.281-2.173 0-4.02.76-5.541 2.281l-11.08 11.08c-1.521 1.521-2.281 3.368-2.281 5.541 0 2.172.76 4.02 2.281 5.54l29.493 29.493 11.08 11.08c1.52 1.521 3.367 2.281 5.54 2.281 2.172 0 4.02-.761 5.54-2.281l11.08-11.08 58.986-58.986c1.52-1.521 2.281-3.368 2.281-5.541.0001-2.172-.761-4.02-2.281-5.54"
        fill="#fff"
        transform="matrix(.0436 0 0 .0436 8.177 1039.72)"
        stroke="none"
        stroke-width="9.512"
      />
    </g>
  </svg>
)

export default define('svg-demo', () => {
  return () => <Brand vendor="Meet &amp; Greet" title="Back Office" />
})

// slots: 'default'

class BrandProps {
  vendor?: string
  title?: string
  size?: 'small' | 'medium' | 'large' | 'huge' = 'medium'
  multicolor?: boolean
}

const Brand = define('jsc-brand', BrandProps, (p) => {
  useStyles(brandStyles)

  return () => {
    const vendor = p.vendor ? String(p.vendor).trim() : ''
    const title = p.title ? String(p.title).trim() : ''
    const textCount = Number(vendor) + Number(title)
    const rootClass = p.size === 'medium' ? 'root' : `root scale-${p.size}`

    return (
      <div class={rootClass}>
        <slot class="logo">{icon}</slot>
        {textCount === 0 ? null : textCount === 1 ? (
          <div class="text">{vendor || title}</div>
        ) : (
          <div>
            {vendor ? <div class="vendor">{p.vendor}</div> : null}
            {title ? <div class="title">{p.title}</div> : null}
          </div>
        )}
      </div>
    )
  }
})

const brandStyles = `
  .root {
    font-family: --sl-font-sans;
    display: flex;
    white-space: nowrap;
    align-items: center;
    user-select: none;
  }

  .logo {
    width: 1.6em,
    height: 1.6em,
    padding: 0.7em 0 0 0
  }

  .logo-multicolor {
    color: -sl-color-primary
  }

  .text {
    font-size: 16px;
  }

  .vendor {
    font-size: 14px;
  }

  .title {
    font-size: 12px;
  }

  .scaleMedium: {
    transform: scale(.95, .95)
  }

  .scaleSmall {
    transform: scale(.75, .75)
  }

  .scaleLarge {
    transform: scale(1.1, 1.1)
  }

  .scaleHuge {
    transform: scale(1.2, 1.2)
  }
}
`
