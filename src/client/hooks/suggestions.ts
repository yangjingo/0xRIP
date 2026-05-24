import { useState, useCallback } from 'react'
import type { Grave } from '../store/store'

interface Suggestion {
  cmd: string; desc: string; usage: string
}

export const COMMANDS: Suggestion[] = [
  { cmd: '/bury',   desc: 'Begin burial ritual',          usage: '/bury' },
  { cmd: '/summon', desc: 'Open channel to a grave',      usage: '/summon <id>' },
  { cmd: '/dream',  desc: 'Generate a dream video',       usage: '/dream <id>' },
  { cmd: '/dreams', desc: 'List past dreams',             usage: '/dreams <id>' },
  { cmd: '/list',   desc: 'List all graves',              usage: '/list' },
  { cmd: '/help',   desc: 'Show all commands',            usage: '/help' },
  { cmd: '/clear',  desc: 'Clear terminal',               usage: '/clear' },
  { cmd: '/quit',   desc: 'Close summon channel',         usage: '/quit' },
]

export function useSuggestions(graves: Grave[]) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState(0)
  const [visible, setVisible] = useState(false)

  const update = useCallback((value: string) => {
    if (!value.startsWith('/')) { setVisible(false); return }

    const prefix = value.toLowerCase()

    // After space — suggest grave IDs for /summon
    if (prefix.includes(' ')) {
      const [cmd] = prefix.split(' ')
      if (cmd === '/summon' || cmd === '/dream' || cmd === '/dreams') {
        const prefixLen = `${cmd} `.length
        const idPart = value.slice(prefixLen).toLowerCase()
        const matches = idPart
          ? graves.filter(g => g.id.toLowerCase().includes(idPart) || g.name.toLowerCase().includes(idPart))
          : graves
        if (matches.length) {
          setSuggestions(matches.map(g => ({ cmd: g.id, desc: g.name, usage: `/${cmd} ${g.id}` })))
          setSelected(0); setVisible(true); return
        }
      }
      setVisible(false); return
    }

    // Command matching
    const matches = COMMANDS.filter(c => c.cmd.startsWith(prefix))
    if (matches.length) { setSuggestions(matches); setSelected(0); setVisible(true) }
    else { setVisible(false) }
  }, [graves])

  const dismiss = useCallback(() => setVisible(false), [])

  return { suggestions, selected, setSelected, visible, update, dismiss }
}
