"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Search, Filter, Loader, LoaderCircle } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ZapCard } from "@/components/zap-card"
import Link from "next/link"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

type TriggerInfo = {
    name: string;
    imageUrl: string;
};

type ActionInfo = {
    name: string;
    imageUrl: string;
};

export type Zap = {
    id: string;
    trigger: TriggerInfo | null;
    actions: ActionInfo[];
    createdAt: string
    name: string,
    finishedAt: string
};

type ZapResponse = Zap[];
export default function Dashboard() {
    const { data: session, status: sessionStatus } = useSession()
    const [activeTab, setActiveTab] = useState<'all' | 'running'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [zaps, setZaps] = useState<ZapResponse>([])
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        if (sessionStatus !== "authenticated") return
        axios.get(`${API_URL}/api/v1/zap/1`, {
            params: { userId: session.user.id },
        }).then(res => {
            setZaps(res.data)
        }).catch(err => {
            console.log("error fetching zaps")
        }).finally(() => setLoading(false))
    }, [sessionStatus, session?.user.id])

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
    if (sessionStatus === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
                <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
            {/* Page title */}
            <div className="border-b bg-white/60 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
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
            </div>

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
            </div>
        </div>
    )
}
