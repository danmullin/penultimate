import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDocStore } from '../store/documentStore'
import { nextId } from '../ops/group'
import {
  createShapeFromValues,
  getLastShapeValues,
  rememberShapeValues,
  shapeToolTitle,
  type ShapeCreateValues,
} from '../ops/shapes'
import { IconButton } from './Icon'
import { ShapeGeometryFields } from './ShapeGeometryFields'

/** Exact-size dialog when a shape tool is clicked without dragging. */
export function ShapeDialog() {
  const dialog = useDocStore((s) => s.shapeDialog)
  const setShapeDialog = useDocStore((s) => s.setShapeDialog)
  const addNode = useDocStore((s) => s.addNode)
  const select = useDocStore((s) => s.select)
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [values, setValues] = useState<ShapeCreateValues>(getLastShapeValues)
  const valuesRef = useRef(values)
  valuesRef.current = values

  useEffect(() => {
    if (!dialog) return
    setValues(getLastShapeValues())
  }, [dialog])

  useEffect(() => {
    if (!dialog) return

    const commit = () => {
      const v = valuesRef.current
      rememberShapeValues(v)
      const node = createShapeFromValues(dialog.kind, dialog.x, dialog.y, v)
      const id = nextId(node.type)
      addNode({ ...node, id })
      select([id], false)
      setShapeDialog(null)
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setShapeDialog(null)
        return
      }
      if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        e.stopPropagation()
        commit()
      }
    }
    window.addEventListener('keydown', onKey, true)
    panelRef.current?.querySelector<HTMLElement>('input, button')?.focus()
    return () => window.removeEventListener('keydown', onKey, true)
  }, [dialog, addNode, select, setShapeDialog])

  if (!dialog) return null

  const confirm = () => {
    rememberShapeValues(values)
    const node = createShapeFromValues(dialog.kind, dialog.x, dialog.y, values)
    const id = nextId(node.type)
    addNode({ ...node, id })
    select([id], false)
    setShapeDialog(null)
  }

  const cancel = () => setShapeDialog(null)

  return createPortal(
    <div
      className="settings-modal"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancel()
      }}
    >
      <div
        ref={panelRef}
        className="settings-modal__panel shape-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="settings-modal__header">
          <h2 id={titleId} className="settings-modal__title">
            {shapeToolTitle(dialog.kind)}
          </h2>
          <IconButton icon="cancel" label="Cancel" onClick={cancel} />
        </div>

        <div className="settings-modal__body">
          <p className="shape-dialog__intro">
            Set exact size, then press <kbd>Enter</kbd> or OK.
          </p>
          <ShapeGeometryFields
            mode="create"
            kind={dialog.kind}
            values={values}
            onChange={setValues}
          />
        </div>

        <div className="settings-modal__footer">
          <button type="button" className="ghost-btn" onClick={cancel}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={confirm}>
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
