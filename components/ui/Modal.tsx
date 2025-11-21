import * as React from "react"
import { cn } from "../../utils/cn"
import { Button } from "./Button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  title?: string
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className, title }) => {
  const modalRef = React.useRef<HTMLDivElement>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement

      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus()
      }

      // Add escape key listener
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      document.addEventListener('keydown', handleEscape)

      // Prevent body scroll
      document.body.style.overflow = 'hidden'

      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'

        // Restore focus
        if (previousFocusRef.current) {
          previousFocusRef.current.focus()
        }
      }
    }
  }, [isOpen, onClose])

  // Focus trap
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const modal = modalRef.current
      if (!modal) return

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby="modal-description"
    >
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className={cn(
          "relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto",
          className
        )}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>
  )
}

interface ModalHeaderProps {
  children: React.ReactNode
  className?: string
  onClose?: () => void
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className, onClose }) => (
  <div className={cn("flex items-center justify-between p-4 border-b", className)}>
    <h2 id="modal-title" className="text-lg font-semibold">{children}</h2>
    {onClose && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        aria-label="Close modal"
      >
        ×
      </Button>
    )}
  </div>
)

interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

const ModalBody: React.FC<ModalBodyProps> = ({ children, className }) => (
  <div id="modal-description" className={cn("p-4", className)}>{children}</div>
)

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => (
  <div className={cn("flex justify-end space-x-2 p-4 border-t", className)}>
    {children}
  </div>
)

export { Modal, ModalHeader, ModalBody, ModalFooter }