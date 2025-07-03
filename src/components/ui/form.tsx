import * as React from "react"

export const Form = ({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) => (
  <form {...props} className="space-y-4" >{children}</form>
)

export const FormItem = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-1">{children}</div>
)

export const FormLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-medium text-gray-700">{children}</label>
)

export const FormControl = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
)

export const FormField = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-1">{children}</div>
)

export const FormMessage = ({ message }: { message?: string }) => (
  message ? <p className="text-sm text-red-500">{message}</p> : null
)