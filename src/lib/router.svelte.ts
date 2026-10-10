function parse() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  return { name: parts[0] ?? 'home', param: parts[1], params: parts.slice(1) }
}

class Router {
  route = $state(parse())

  constructor() {
    addEventListener('hashchange', () => (this.route = parse()))
  }
}

export const router = new Router()

export function go(path: string) {
  location.hash = path
}
