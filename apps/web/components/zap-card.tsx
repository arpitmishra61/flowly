"use client"

import { MoreVertical, Play, Pause, Trash2, ExternalLink, ChevronRight, Copy, Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Zap } from "@/app/page"
import Image from "next/image"

interface ZapCardProps {
    zap: Zap
    onToggle?: (id: string) => void
    onDelete?: (id: string) => void
}

export function ZapCard({ zap, onToggle, onDelete }: ZapCardProps) {
    const [showMenu, setShowMenu] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopyHookId = async () => {
        await navigator.clipboard.writeText(zap.id)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }


    return (
        <div className="group relative bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-primary hover:shadow-lg transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <h3>{zap.name}</h3>

                    <p className="text-sm text-muted-foreground">
                        Created {new Date(zap.createdAt).toLocaleDateString()}
                    </p>

                    <button
                        onClick={handleCopyHookId}
                        className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        title="Copy Hook ID"
                    >
                        <span className="truncate max-w-[160px]">Hook ID: {zap.id}</span>
                        {copied ? (
                            <Check className="h-3 w-3 flex-shrink-0 text-green-600" />
                        ) : (
                            <Copy className="h-3 w-3 flex-shrink-0" />
                        )}
                    </button>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <MoreVertical className="h-5 w-5 text-gray-400" />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute right-0 top-10 z-20 w-48 bg-white rounded-lg border shadow-lg py-1">
                                <button
                                    onClick={() => { }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Open in editor
                                </button>

                                <hr className="my-1" />
                                <button
                                    onClick={() => {
                                        onDelete?.(zap.id)
                                        setShowMenu(false)
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Zap
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Workflow Visualization */}
            <div className="flex items-center gap-2 mb-4">
                {/* Trigger */}
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm flex-shrink-0"

                >
                    <Image src={zap.trigger?.imageUrl || ''} height={50} width={50} alt="logo" />

                </div>

                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />

                {/* Actions */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {zap.actions.map((action, index) => (
                        <div key={index} className="flex items-center gap-2 flex-shrink-0">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm"

                            >
                                <Image src={action?.imageUrl || ''} height={50} width={50} alt="logo" />
                            </div>
                            {index < zap.actions.length - 1 && (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    )
}
