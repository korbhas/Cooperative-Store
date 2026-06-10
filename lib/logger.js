const isDev = process.env.NODE_ENV !== 'production'

const ICONS = { info: 'ℹ', warn: '⚠', error: '✗' }
const METHODS = { info: 'log', warn: 'warn', error: 'error' }

function log(level, event, fields = {}) {
  if (isDev) {
    const extra = Object.keys(fields).length ? ' ' + JSON.stringify(fields, null, 0) : ''
    console[METHODS[level]](`${ICONS[level]} [${event}]${extra}`)
  } else {
    console.log(JSON.stringify({ level, event, timestamp: new Date().toISOString(), ...fields }))
  }
}

export const logger = {
  info:  (event, fields) => log('info',  event, fields),
  warn:  (event, fields) => log('warn',  event, fields),
  error: (event, fields) => log('error', event, fields),
}
