"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, Copy, ExternalLink } from "lucide-react"

interface PublishModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type PublishState = 'publishing' | 'success' | 'error'

export function PublishModal({ open, onOpenChange }: PublishModalProps) {
    const [state, setState] = useState<PublishState>('publishing')
    const [zapUrl, setZapUrl] = useState<string>('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (open) {
            // Reset state when modal opens
            setState('publishing')
            setCopied(false)

            // Simulate publishing process
            const timer = setTimeout(() => {
                // Randomly decide success or error (80% success rate)
                const isSuccess = false

                if (isSuccess) {
                    const generatedUrl = `https://zapier.app/editor/${Math.random().toString(36).substr(2, 9)}`
                    setZapUrl(generatedUrl)
                    setState('success')
                } else {
                    setState('error')
                }
            }, 2500) // 2.5 seconds delay

            return () => clearTimeout(timer)
        }
    }, [open])

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(zapUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleRetry = () => {
        setState('publishing')

        const timer = setTimeout(() => {
            const isSuccess = false

            if (isSuccess) {
                const generatedUrl = `https://zapier.app/editor/${Math.random().toString(36).substr(2, 9)}`
                setZapUrl(generatedUrl)
                setState('error')
            } else {
                setState('error')
            }
        }, 2500)

        return () => clearTimeout(timer)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {state === 'publishing' && 'Publishing Your Zap'}
                        {state === 'success' && 'Zap Published Successfully!'}
                        {state === 'error' && 'Publication Failed'}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 pt-2">
                    {/* Publishing State */}
                    {state === 'publishing' && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="relative">
                                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                            </div>
                            <p className="mt-6 text-center text-muted-foreground font-medium">
                                Publishing your Zap...
                            </p>
                            <p className="mt-2 text-sm text-center text-muted-foreground">
                                This may take a few moments
                            </p>
                        </div>
                    )}

                    {/* Success State */}
                    {state === 'success' && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center py-6">
                                <div className="relative">
                                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
                                </div>
                                <p className="mt-4 text-center text-foreground font-medium">
                                    Your Zap is now live!
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Zap URL
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm font-mono truncate">
                                        {zapUrl}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCopyUrl}
                                        className="flex-shrink-0"
                                    >
                                        {copied ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {copied && (
                                    <p className="text-xs text-green-600 animate-fade-in">
                                        Copied to clipboard!
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => window.open(zapUrl, '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Zap
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {state === 'error' && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center py-6">
                                <div className="relative">
                                    <XCircle className="h-16 w-16 text-red-500" />
                                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                                </div>
                                <p className="mt-4 text-center font-medium text-foreground">
                                    Can't publish
                                </p>
                                <p className="mt-2 text-sm text-center text-muted-foreground">
                                    Something went wrong while publishing your Zap. Please try again.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleRetry}
                                >
                                    Retry
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
