import Class from './Class'

type PropConfig<T> = {
  type?: Class<T>,
  nullable?: boolean,
  required?: boolean,
  defaultValue?: T
}

export default PropConfig
