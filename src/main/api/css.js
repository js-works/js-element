import Css from '../internal/Css'
export default function css(strings, ...values) {
  const
    styleSheet = strings.map((str, idx) => {
      return idx < values.length
        ? str + values[idx] 
        : str
    }).join('')

  return new Css(styleSheet)
}

