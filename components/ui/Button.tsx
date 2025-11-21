import * as React from "react"
import { cn } from "../../utils/cn"
import { LoadingIndicator } from "./LoadingIndicator"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-600 text-white hover:bg-gray-700",
      outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
      ghost: "hover:bg-gray-100",
    }

    const sizeClasses = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-6 text-lg",
    }

    const spinnerSize = size === "sm" ? "sm" : size === "lg" ? "md" : "sm"

    return (
      <button
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <LoadingIndicator size={spinnerSize} className="mr-2" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }