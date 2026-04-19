"use client"

import { useState } from "react"
import { Plus, Search, Filter } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ZapCard } from "@/components/zap-card"
import { MOCK_ZAPS, Zap } from "@/lib/mock-data"
import Link from "next/link"

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<'all' | 'running'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [zaps, setZaps] = useState<Zap[]>(MOCK_ZAPS)

    const filteredZaps = zaps.filter(zap => {
        const matchesSearch = zap.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTab = activeTab === 'all' || (activeTab === 'running' && zap.status === 'active')
        return matchesSearch && matchesTab
    })

    const runningCount = zaps.filter(z => z.status === 'active').length

    const handleToggleZap = (id: string) => {
        setZaps(zaps.map(zap =>
            zap.id === id
                ? { ...zap, status: zap.status === 'active' ? 'paused' : 'active' as 'active' | 'paused' | 'error' }
                : zap
        ))
    }

    const handleDeleteZap = (id: string) => {
        if (confirm('Are you sure you want to delete this Zap?')) {
            setZaps(zaps.filter(zap => zap.id !== id))
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                My Zaps
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Manage your automated workflows
                            </p>
                        </div>
                        <Link href="/builder">
                            <Button size="lg" className="gap-2">
                                <Plus className="h-5 w-5" />
                                Create Zap
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Tabs and Search */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <Tabs className="w-full sm:w-auto">
                        <TabsList>
                            <TabsTrigger
                                active={activeTab === 'all'}
                                onClick={() => setActiveTab('all')}
                            >
                                All Zaps ({zaps.length})
                            </TabsTrigger>
                            <TabsTrigger
                                active={activeTab === 'running'}
                                onClick={() => setActiveTab('running')}
                            >
                                Running ({runningCount})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search zaps..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="outline" size="icon" className="flex-shrink-0">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Zaps Grid */}
                {filteredZaps.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredZaps.map((zap) => (
                            <ZapCard
                                key={zap.id}
                                zap={zap}
                                onToggle={handleToggleZap}
                                onDelete={handleDeleteZap}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <Plus className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            {searchQuery ? 'No zaps found' : 'No zaps yet'}
                        </h3>
                        <p className="text-muted-foreground text-center max-w-sm mb-6">
                            {searchQuery
                                ? `No zaps match "${searchQuery}". Try a different search term.`
                                : 'Get started by creating your first automation workflow.'
                            }
                        </p>
                        {!searchQuery && (
                            <Link href="/builder">
                                <Button size="lg">
                                    <Plus className="h-5 w-5 mr-2" />
                                    Create Your First Zap
                                </Button>
                            </Link>
                        )}
                    </div>
                )}

                {/* Stats Summary */}
                {filteredZaps.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                            <div className="text-sm text-muted-foreground mb-1">Total Zaps</div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                {zaps.length}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                            <div className="text-sm text-muted-foreground mb-1">Active Zaps</div>
                            <div className="text-3xl font-bold text-green-600">
                                {runningCount}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                            <div className="text-sm text-muted-foreground mb-1">Total Runs</div>
                            <div className="text-3xl font-bold text-blue-600">
                                {zaps.reduce((sum, zap) => sum + zap.totalRuns, 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
