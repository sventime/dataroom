'use client'

import * as React from 'react'
import { Calculator, Calendar, CreditCard, Settings, Smile, User } from 'lucide-react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

export function Search() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <>
      <p
        className="text-muted-foreground text-sm bg-input border-border border p-2 px-4 rounded-md flex gap-4"
        onClick={() => setOpen(true)}
      >
        <span>Search in Data Room...</span>
        <div className="flex items-center gap-1">
          <kbd className="bg-background text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-3 rounded border px-1 font-mono text-[10px] font-medium opacity-100 select-none">
            <span className="text-xs">⌘</span>
          </kbd>
          <kbd className="bg-background text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-3 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
            K
          </kbd>
        </div>
      </p>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type file name to search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <Calendar />
              <span>Calendar</span>
            </CommandItem>
            <CommandItem>
              <Smile />
              <span>Search Emoji</span>
            </CommandItem>
            <CommandItem>
              <Calculator />
              <span>Calculator</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      </CommandDialog>
    </>
  )
}
