import h from './api/core/h'

// core
export { default as defineElement } from './api/core/defineElement'
export { default as render } from './api/core/render'
export { default as h } from './api/core/h'

// utils
export { default as prop } from './api/util/prop'
export { default as asRef } from './api/util/asRef'
export { default as toRef } from './api/util/toRef'
export { default as update } from './api/util/update'
export { default as getRoot } from './api/util/getRoot'
export { default as addEventListener } from './api/util/addEventListener'
export { default as removeEventListener } from './api/util/removeEventListener'
export { default as dispatchEvent } from './api/util/dispatchEvent'

// hooks
export { default as hook } from './api/hooks/hook'
export { default as useEffect } from './api/hooks/useEffect'
export { default as useInterval } from './api/hooks/useInterval'
export { default as useMethods } from './api/hooks/useMethods'
export { default as usePromise } from './api/hooks/usePromise'
export { default as useTime } from './api/hooks/useTime'
export { default as useToggle } from './api/hooks/useToggle'
export { default as useValue } from './api/hooks/useValue'
export { default as useState } from './api/hooks/useState'

// HTML + SVG factories
export { default as Html } from './api/html-svg/Html'
export { default as Svg } from './api/html-svg/Svg'
