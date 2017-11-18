export function fetch(url, opts) {
  const effectivOpts = Object.assign({}, {
    credentials: 'same-origin'
  }, opts)

  return window.fetch(url, effectivOpts)
}