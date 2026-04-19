import React, { useRef, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { ActionsAtom, PublishModalOpenAtom, SaveNodeAction } from '@/atoms'
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import AutocompleteBox from '@/components/AutocompleteBox';
import { Button } from '@/components/ui/button';

export default function GmailAction({ nodeId }: { nodeId: string }) {

    const [actions, setActions] = useAtom(ActionsAtom);
    const formRef = useRef(null)
    const currentAction = actions?.find(action => action?.id === nodeId)
    const saveNodeAction = useAtomValue(SaveNodeAction)



    const API = "http://localhost:5000";
    console.log("actions", actions)

    if (!currentAction || !currentAction.app) return null
    const { app, config, id, type } = currentAction
    const { options, selectedOption, metaData } = app
    const data = metaData?.jsonData || {}

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


                    <form className="max-w-3xl mx-auto " ref={formRef}>
                        <Card className="shadow-sm border">

                            <CardHeader className="space-y-1">
                                {/* Subject */}
                                <AutocompleteBox
                                    placeholder="Subject"
                                    type='input'
                                    name="subject"
                                    currentValue={data.subject}

                                />

                                {/* Sender */}
                                <AutocompleteBox
                                    placeholder="From"
                                    type='input'
                                    name="from"
                                    currentValue={data.from}


                                />


                                <AutocompleteBox
                                    placeholder="To"
                                    type='input'
                                    name="to"
                                    currentValue={data.to}

                                />
                            </CardHeader>
                            <hr />
                            <CardContent>
                                {/* Email Body */}
                                <AutocompleteBox
                                    placeholder="Write your mail..."
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
                console.log(formRef.current)
                const formData = new FormData(formRef?.current as any)
                const data = Object.fromEntries(formData.entries());
                console.log(data)
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

            }} className="w-full mt-4" size="lg">
                Finish
            </Button>
        </div>
    )
}
