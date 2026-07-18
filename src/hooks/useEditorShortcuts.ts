import { useEffect } from 'react'
import { useDocStore } from '../store/documentStore'

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

export function useEditorShortcuts(): void {
  useEffect(() => {
    // Block browser page zoom (Ctrl/Cmd+wheel, pinch gestures).
    const blockBrowserZoomWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault()
    }
    const blockGesture = (e: Event) => e.preventDefault()
    window.addEventListener('wheel', blockBrowserZoomWheel, { passive: false })
    document.addEventListener('gesturestart', blockGesture as EventListener)
    document.addEventListener('gesturechange', blockGesture as EventListener)

    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const store = useDocStore.getState()
      // Type edit session — never steal keys for tool shortcuts.
      if (store.editingTextId) return
      if (store.settingsOpen || store.helpOpen || store.shapeDialog) return
      const mod = e.metaKey || e.ctrlKey

      // Hold Space — temporary hand pan (Illustrator-style).
      if (e.code === 'Space' || e.key === ' ') {
        if (e.repeat) return
        e.preventDefault()
        store.setSpaceHand(true)
        return
      }

      if (store.tool === 'pen') {
        if (e.key === 'Enter') {
          e.preventDefault()
          store.finishPen()
          return
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          store.cancelPen()
          return
        }
      }

      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        store.undo()
        return
      }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        store.redo()
        return
      }
      if (mod && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (e.shiftKey) store.ungroup()
        else store.group()
        return
      }
      if (mod && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        store.copySelected()
        return
      }
      if (mod && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        store.pasteClipboard()
        return
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        store.duplicateSelected()
        return
      }

      // Canvas zoom — also steals browser Ctrl+/- / Ctrl+0 zoom.
      if (mod && (e.key === '=' || e.key === '+' || e.code === 'Equal' || e.code === 'NumpadAdd')) {
        e.preventDefault()
        store.zoomBy(1.25)
        return
      }
      if (mod && (e.key === '-' || e.key === '_' || e.code === 'Minus' || e.code === 'NumpadSubtract')) {
        e.preventDefault()
        store.zoomBy(1 / 1.25)
        return
      }
      if (mod && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
        e.preventDefault()
        store.requestFitZoom()
        return
      }
      if (mod && (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1')) {
        e.preventDefault()
        store.zoomTo100()
        return
      }

      // Preferences (Illustrator: Ctrl+K; also Ctrl+,)
      if (mod && (e.key.toLowerCase() === 'k' || e.key === ',')) {
        e.preventDefault()
        store.toggleSettingsOpen()
        return
      }

      // Features & shortcuts help
      if (e.key === 'F1' || (e.key === '?' && !mod) || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        store.toggleHelpOpen()
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        store.deleteSelected()
        return
      }
      if (e.key === 'Escape') {
        store.clearSelection()
        store.setTool('select')
        return
      }
      if (e.key === 'v' || e.key === 'V') store.setTool('select')
      if (e.key === 'a' || e.key === 'A') store.setTool('direct')
      if (e.key === 'r' || e.key === 'R') store.setTool('rect')
      if (e.key === 'u' || e.key === 'U') store.setTool('rounded-rect')
      if (e.key === 'o' || e.key === 'O') store.setTool('ellipse')
      if (e.key === 'y' || e.key === 'Y') store.setTool('polygon')
      if (e.key === 'j' || e.key === 'J') store.setTool('star')
      if (e.key === 'l' || e.key === 'L') store.setTool('line')
      if (e.key === 'p' || e.key === 'P') store.setTool('pen')
      if (e.key === 'n' || e.key === 'N') store.setTool('pencil')
      if (e.key === 'i' || e.key === 'I') store.setTool('eyedropper')
      if (e.key === 't' || e.key === 'T') {
        if (e.shiftKey) store.setTool('area-text')
        else store.setTool('text')
      }
      if (e.key === 'c' || e.key === 'C') store.setTool('scissors')
      if (e.key === 's' || e.key === 'S') store.setTool('shear')
      if (e.key === 'h' || e.key === 'H') store.setTool('hand')
      if (e.key === 'z' || e.key === 'Z') store.setTool('zoom')
      if (e.key === '`' || e.key === '~') {
        e.preventDefault()
        store.setOutlineMode(!store.outlineMode)
      }

      // Illustrator: D = default appearance. Text uses black fill / no stroke.
      if ((e.key === 'd' || e.key === 'D') && !mod && store.selectedIds.length > 0) {
        e.preventDefault()
        const selected = store.selectedIds
          .map((id) => store.doc.nodes[id])
          .filter(Boolean)
        const allText =
          selected.length > 0 && selected.every((n) => n.type === 'text')
        if (allText) {
          store.applyStyleToSelected({
            fill: { type: 'solid', color: '#000000' },
            stroke: { type: 'none' },
            strokeWidth: 0,
          })
        } else {
          store.applyStyleToSelected({
            fill: { type: 'solid', color: '#ffffff' },
            stroke: { type: 'solid', color: '#000000' },
            strokeWidth: 1,
          })
        }
        return
      }

      const step = e.shiftKey ? 10 : 1
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        store.nudgeSelected(-step, 0)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        store.nudgeSelected(step, 0)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        store.nudgeSelected(0, -step)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        store.nudgeSelected(0, step)
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        useDocStore.getState().setSpaceHand(false)
      }
    }

    const clearSpaceHand = () => useDocStore.getState().setSpaceHand(false)

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearSpaceHand)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearSpaceHand)
      window.removeEventListener('wheel', blockBrowserZoomWheel)
      document.removeEventListener('gesturestart', blockGesture as EventListener)
      document.removeEventListener('gesturechange', blockGesture as EventListener)
      clearSpaceHand()
    }
  }, [])
}
