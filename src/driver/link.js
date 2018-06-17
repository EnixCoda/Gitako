export default function link(setState, sources) {
  const wrappedMethods = {/* sources[key] -> wrappedMethods.method */}
  const map = new Map(/* sources.creator -> wrappedMethods.method */)

  function dispatch(...args) {
    if (Object.values(sources).includes(args[0])) {
      map.get(args[0])(...args.slice(1))
    } else {
      setState(...args)
    }
  }

  Object.entries(sources).forEach(([key, createMethod]) => {
    const method = createMethod(dispatch)
    wrappedMethods[key] = method
    map.set(createMethod, method)
  })

  return wrappedMethods
}
