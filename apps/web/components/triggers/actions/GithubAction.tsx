import React, { useEffect, useRef, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ActionsAtom, SaveNodeAction } from '@/atoms'
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import AutocompleteBox from '@/components/AutocompleteBox';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GithubAction({ nodeId }: { nodeId: string }) {

    const [actions, setActions] = useAtom(ActionsAtom);
    const formRef = useRef(null)
    const currentAction = actions?.find(action => action?.id === nodeId)
    const saveNodeAction = useAtomValue(SaveNodeAction)
    const { data: session } = useSession()
    const [tokenConfigured, setTokenConfigured] = useState<boolean | null>(null)

    const API = "http://localhost:5001";

    useEffect(() => {
        const email = session?.user?.email
        if (!email) return
        fetch(`${API}/api/v1/user/github-token/status?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => setTokenConfigured(!!data.configured))
            .catch(() => setTokenConfigured(null))
    }, [session?.user?.email])

    if (!currentAction || !currentAction.app) return null
    const { app, id, type } = currentAction
    const { options, selectedOption, metaData } = app
    const data = metaData?.jsonData || {}

    // @ts-ignore
    return (
        <div>

            {tokenConfigured === false && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 mb-4">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                        Kindly configure your GitHub Personal Access Token before using GitHub actions, otherwise issue creation will fail.{" "}
                        <Link href="/settings" className="font-medium underline">
                            Go to Settings
                        </Link>
                    </span>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-2">
                    Action Event <span className="text-red-500">*</span>
                </label>
                <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4" value={selectedOption} onChange={(e) => {
                    // @ts-ignore
                    setActions(actions => {
                        if (actions?.length) {
                            const dummyActions = [...actions]
                            const updatedActions = dummyActions.map(action => action?.id === nodeId ? {
                                ...action, app: {
                                    ...action.app,
                                    selectedOption: e.target.value
                                }
                            } : action)

                            return updatedActions
                        }
                    })
                }}>
                    <option value="">Choose an event</option>
                    {
                        options?.map(option => <option value={option.name}>{option.name}</option>)
                    }
                </select>
            </div>

            <div>
                {selectedOption === "create issue" && <div>
                    <form className="max-w-3xl mx-auto " ref={formRef}>
                        <Card className="shadow-sm border">
                            <CardHeader className="space-y-1">
                                {/* owner/repo */}
                                <AutocompleteBox
                                    placeholder="Repo (owner/repo)"
                                    type='input'
                                    name="repo"
                                    currentValue={data.repo}
                                />

                                {/* Issue title */}
                                <AutocompleteBox
                                    placeholder="Issue title"
                                    type='input'
                                    name="title"
                                    currentValue={data.title}
                                />
                            </CardHeader>
                            <hr />
                            <CardContent>
                                {/* Issue body */}
                                <AutocompleteBox
                                    placeholder="Issue description..."
                                    type='textarea'
                                    name="body"
                                    currentValue={data.body}
                                />
                            </CardContent>
                        </Card>
                    </form>
                </div>
                }
            </div>
            <Button onClick={() => {
                const formData = new FormData(formRef?.current as any)
                const data = Object.fromEntries(formData.entries());
                setActions(actions => {
                    if (actions?.length) {
                        const dummyActions = [...actions]

                        const updatedActions = dummyActions.map(action => action?.id === nodeId ? {
                            ...action, app: {
                                ...action.app,
                                metaData: {
                                    ...action.app?.metaData,
                                    jsonData: data
                                }
                            }
                        } : action)

                        return updatedActions
                    }
                })

                setTimeout(() => {
                    saveNodeAction()
                }, 1000)

            }} className="w-full mt-4" size="lg" disabled={tokenConfigured === false}>
                Finish
            </Button>
        </div>
    )
}
