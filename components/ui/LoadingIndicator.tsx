import * as React from "react"
import { cn } from "../../utils/cn"

interface LoadingIndicatorProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = "md",
  className,
  text
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size]
        )}
      />
      {text && (
        <span className="ml-2 text-sm text-gray-600">{text}</span>
      )}
    </div>
  )
}

export { LoadingIndicator }