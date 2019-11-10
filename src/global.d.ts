type ValSet<T> = {
  val: T
  set: (val: T) => void
}

type PartialValSet<T> = {
  val: T
  set: (val: Partial<T>) => void
}
