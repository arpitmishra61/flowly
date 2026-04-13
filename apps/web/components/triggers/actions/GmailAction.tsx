import React, { useEffect, useRef, useState } from 'react'

import { AudioWaveform, CopyIcon, MoveRight, WebhookIcon } from 'lucide-react'
import { useAtom } from 'jotai'
import { ActionsAtom, fetchTriggerData, TriggerAtom } from '@/atoms'
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';



export default function GmailAction({ nodeId }: { nodeId: string }) {
    const [actions, setActions] = useAtom(ActionsAtom);

    const currentAction = actions?.find(action => action?.id === nodeId)
    console.log(currentAction)

    const API = "http://localhost:5000";




    const [url, setUrl] = useState<string>("")
    const eventSrcRef = useRef<EventSource | null>(null)

    if (!currentAction || !currentAction.app) return null
    const { app, config, id, type } = currentAction
    const { options, selectedOption } = app
    // @ts-ignore
    return (
        <div>

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

                {selectedOption === "send mail" && <div>


                    <div className="max-w-3xl mx-auto ">
                        <Card className="shadow-sm border">

                            <CardHeader className="space-y-1">
                                {/* Subject */}
                                <Input
                                    placeholder="Subject"
                                    className="text-xl font-semibold border-none focus-visible:ring-0 px-0"
                                />

                                {/* Sender */}
                                <Input
                                    placeholder="From"
                                    className="text-sm text-gray-600 border-none focus-visible:ring-0 px-0"
                                />

                                <Input
                                    placeholder="To"
                                    className="text-sm text-gray-600 border-none focus-visible:ring-0 px-0"
                                />
                            </CardHeader>
                            <hr />
                            <CardContent>
                                {/* Email Body */}
                                <Textarea
                                    placeholder="Write your message..."
                                    className="min-h-[200px] resize-none border-none focus-visible:ring-0 px-0 text-gray-700"
                                />
                            </CardContent>

                        </Card>

                    </div>


                </div>
                }

            </div>
        </div>
    )
}
