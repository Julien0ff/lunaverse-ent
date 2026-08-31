export function normalizeClasses(rawClasses: any[]) {
  return rawClasses.map(c => {
    if (typeof c === 'string') return { name: c, roleId: '', channelId: '' }
    return c
  })
}
