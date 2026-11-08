/**
 * Host half: play one short chime whenever DSH waits for a human decision —
 * a tool approval, or a question with choices — then let the request continue
 * untouched.
 *
 * The listener is prepended: a later answerer stops the waterfall without
 * calling next(), so an appended listener would never run. Play first, then
 * hand the request on unchanged.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const DEFAULT_SOUND = 'Glass'
const DEFAULT_VOLUME = 0.9
const MIN_GAP_MS = 700
const MAC_SOUNDS = '/System/Library/Sounds'
const LINUX_SOUNDS = [
  '/usr/share/sounds/freedesktop/stereo/complete.oga',
  '/usr/share/sounds/freedesktop/stereo/bell.oga',
]

let lastPlayedAt = 0
let warned = false

const REQUESTS = ['approval/request', 'user-questions/request']

export function apply(ctx, config) {
  const options = readOptions(config)
  const disposers = REQUESTS.map((event) =>
    ctx.on(event, (_request, next) => {
      play(options)
      return next()
    }, { global: true, prepend: true }),
  )
  return () => {
    for (const dispose of disposers) dispose()
  }
}

function readOptions(config) {
  const raw = config && typeof config === 'object' ? config : {}
  const volume = Number(raw.volume)
  return {
    sound: typeof raw.sound === 'string' && raw.sound.trim() !== '' ? raw.sound.trim() : DEFAULT_SOUND,
    volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : DEFAULT_VOLUME,
    enabled: raw.enabled !== false,
  }
}

function play(options) {
  if (!options.enabled) return
  const now = Date.now()
  if (now - lastPlayedAt < MIN_GAP_MS) return

  const spec = commandFor(options)
  if (spec === null) {
    warnOnce('no playable system sound found, so approval chimes are silent')
    return
  }

  lastPlayedAt = now
  try {
    const child = spawn(spec.command, spec.args, { detached: true, stdio: 'ignore' })
    child.on('error', () => {})
    child.unref()
  } catch {
    // A sound is best-effort: never let it disturb the approval flow.
  }
}

function commandFor(options) {
  if (process.platform === 'darwin') {
    const file = macSound(options.sound)
    if (file === null) return null
    return { command: 'afplay', args: ['-v', options.volume.toFixed(2), file] }
  }

  if (process.platform === 'win32') {
    return {
      command: 'powershell.exe',
      args: ['-NoProfile', '-NonInteractive', '-Command', '[System.Media.SystemSounds]::Asterisk.Play()'],
    }
  }

  if (options.sound.includes('/')) {
    const file = expandHome(options.sound)
    if (existsSync(file)) return { command: 'paplay', args: [file] }
  }
  for (const file of LINUX_SOUNDS) {
    if (existsSync(file)) return { command: 'paplay', args: [file] }
  }
  return { command: 'canberra-gtk-play', args: ['-i', 'complete'] }
}

function macSound(sound) {
  if (sound.includes('/')) {
    const file = expandHome(sound)
    return existsSync(file) ? file : null
  }
  const name = sound.endsWith('.aiff') ? sound : sound + '.aiff'
  const file = join(MAC_SOUNDS, name)
  return existsSync(file) ? file : null
}

function expandHome(value) {
  if (value === '~') return homedir()
  if (value.startsWith('~/')) return join(homedir(), value.slice(2))
  return value
}

function warnOnce(message) {
  if (warned) return
  warned = true
  console.warn('[dsh-approval-ding] ' + message)
}
