"use client"

import { MoreVertical, Play, Pause, Trash2, ExternalLink, ChevronRight } from "lucide-react"
import { Zap } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ZapCardProps {
    zap: Zap
    onToggle?: (id: string) => void
    onDelete?: (id: string) => void
}

export function ZapCard({ zap, onToggle, onDelete }: ZapCardProps) {
    const [showMenu, setShowMenu] = useState(false)

    const getStatusBadge = () => {
        switch (zap.status) {
            case 'active':
                return <Badge variant="success">Active</Badge>
            case 'paused':
                return <Badge variant="warning">Paused</Badge>
            case 'error':
                return <Badge variant="destructive">Error</Badge>
            default:
                return null
        }
    }

    return (
        <div className="group relative bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-primary hover:shadow-lg transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base truncate">{zap.name}</h3>
                        {getStatusBadge()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Created {zap.createdAt}
                    </p>
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
                                    onClick={() => window.open(zap.url, '_blank')}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Open in editor
                                </button>
                                <button
                                    onClick={() => {
                                        onToggle?.(zap.id)
                                        setShowMenu(false)
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                    {zap.status === 'active' ? (
                                        <>
                                            <Pause className="h-4 w-4" />
                                            Pause Zap
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4" />
                                            Activate Zap
                                        </>
                                    )}
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
                    style={{ backgroundColor: `${zap.triggerApp.color}15` }}
                >
                    {zap.triggerApp.icon}
                </div>

                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />

                {/* Actions */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {zap.actions.map((action, index) => (
                        <div key={index} className="flex items-center gap-2 flex-shrink-0">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm"
                                style={{ backgroundColor: `${action.color}15` }}
                            >
                                {action.icon}
                            </div>
                            {index < zap.actions.length - 1 && (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">Total runs:</span>
                        <span className="font-semibold ml-1">{zap.totalRuns.toLocaleString()}</span>
                    </div>
                    {zap.lastRun && (
                        <div>
                            <span className="text-muted-foreground">Last run:</span>
                            <span className="font-semibold ml-1">{zap.lastRun}</span>
                        </div>
                    )}
                </div>

                {zap.status === 'active' && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-green-600">Running</span>
                    </div>
                )}
            </div>
        </div>
    )
}
