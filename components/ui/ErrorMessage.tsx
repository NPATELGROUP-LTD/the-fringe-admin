import * as React from "react"
import { cn } from "../../utils/cn"

interface ErrorMessageProps {
  error: string | null
  className?: string
  showIcon?: boolean
  variant?: "inline" | "block"
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  className,
  showIcon = true,
  variant = "inline"
}) => {
  if (!error) return null

  const baseClasses = "text-red-600"
  const variantClasses = {
    inline: "text-sm",
    block: "text-sm bg-red-50 border border-red-200 rounded-md p-3"
  }

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {showIcon && variant === "block" && (
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p>{error}</p>
          </div>
        </div>
      )}
      {(!showIcon || variant === "inline") && (
        <p>{error}</p>
      )}
    </div>
  )
}

export { ErrorMessage }