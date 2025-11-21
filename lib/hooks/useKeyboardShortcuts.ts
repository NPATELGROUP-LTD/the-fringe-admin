import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  action: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
        const altMatches = !!shortcut.altKey === event.altKey
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey

        if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
          event.preventDefault()
          shortcut.action()
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export function useGlobalKeyboardShortcuts() {
  useKeyboardShortcuts([
    {
      key: '/',
      ctrlKey: true,
      action: () => {
        // Focus search input
        const searchInput = document.querySelector('input[placeholder*="search" i], input[aria-label*="search" i]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
      description: 'Focus search'
    },
    {
      key: 'b',
      ctrlKey: true,
      action: () => {
        // Toggle sidebar
        const sidebarToggle = document.querySelector('button[aria-label*="sidebar" i]') as HTMLButtonElement
        if (sidebarToggle) {
          sidebarToggle.click()
        }
      },
      description: 'Toggle sidebar'
    },
    {
      key: 's',
      ctrlKey: true,
      action: () => {
        // Save current form
        const saveButton = document.querySelector('button[type="submit"], button[aria-label*="save" i]') as HTMLButtonElement
        if (saveButton && !saveButton.disabled) {
          saveButton.click()
        }
      },
      description: 'Save form'
    },
    {
      key: 'Escape',
      action: () => {
        // Close modal or go back
        const closeButton = document.querySelector('button[aria-label*="close" i], button[aria-label*="cancel" i]') as HTMLButtonElement
        if (closeButton) {
          closeButton.click()
        }
      },
      description: 'Close modal/cancel'
    }
  ])
}