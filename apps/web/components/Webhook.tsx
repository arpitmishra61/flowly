import React, { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { AudioWaveform, CopyIcon, MoveRight, WebhookIcon } from 'lucide-react'
import { useAtom } from 'jotai'
import { fetchTriggerData, TriggerAtom } from '@/atoms'

export default function Webhook() {

    const API = "http://localhost:5001";
    const [trigger, setTrigger] = useAtom(TriggerAtom);
    const [, fetchData] = useAtom(fetchTriggerData);
    const metaData = trigger?.app?.metaData || {} as { jsonData: string, webhookUrl: string }
    const { jsonData, webhookUrl } = metaData


    useEffect(() => {

        fetchData(); // triggers the API call
    }, [fetchData]);


    const [url, setUrl] = useState<string>("")
    const eventSrcRef = useRef<EventSource | null>(null)

    if (!trigger || !trigger.app) return null
    const { app, config, id, type } = trigger
    const { options, selectedOption } = app

    return (
        <div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    {trigger.type === 'trigger' ? 'Trigger event' : 'Action event'} <span className="text-red-500">*</span>
                </label>
                <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4" value={selectedOption} onChange={(e) => {
                    // @ts-ignore
                    setTrigger(trigger => ({
                        ...trigger,

                        app: {
                            ...trigger?.app,
                            selectedOption: e.target.value
                        }
                    }))


                }}>
                    <option value="">Choose an event</option>
                    {
                        options?.map(option => <option value={option.name}>{option.name}</option>)


                    }
                </select>
            </div>

            <div>
                {selectedOption && <Button className="w-full" size="lg" disabled={!!webhookUrl} style={{ pointerEvents: webhookUrl ? "none" : "auto" }} onClick={() => {
                    const id = crypto.randomUUID().slice(0, 12)
                    const urlHook = `${API}/api/v1/hook/${id}`
                    //setUrl(urlHook)
                    // @ts-ignore
                    setTrigger(trigger => ({
                        ...trigger,
                        id: app.id,
                        app: {
                            ...trigger?.app,
                            metaData: {
                                webhookUrl: urlHook
                            }
                        }
                    }))
                    const eventSource = new EventSource(urlHook);
                    eventSrcRef.current = eventSource


                    eventSource.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        //setJsonData(data) // update global state
                        // @ts-ignore

                        setTrigger(trigger => ({
                            ...trigger,
                            id: app.id,
                            app: {
                                ...trigger?.app,
                                metaData: {
                                    ...trigger?.app?.metaData,
                                    jsonData: data
                                }
                            }
                        }))
                        console.log("Received:", data);
                    };

                }}>
                    Test The Webhook
                </Button>
                }
                <hr />
                {webhookUrl && <><div className="flex ustify-content-between">
                    <p className="my-4 border border-black-500 p-1 rounded w-100 text-sm">{webhookUrl}</p>
                    <CopyIcon className="mt-6 ml-2 cursor-pointer" onClick={() => {

                        navigator.clipboard.writeText(webhookUrl)
                            .then(() => {
                                alert("Copied to clipboard!");
                            })
                            .catch(err => {
                                console.error("Failed to copy: ", err);
                            });

                    }} />

                </div>
                    <div>
                        <h3 className="text-md font-bold text-blue-800 mb-2">Your webhook URL</h3>
                        <hr />
                        <p className="text-sm text-gray-800 mt-2">You’ll need to configure your application with this webhook URL. <br />
                            <strong>Please send post request on this to take the data to next step</strong>
                        </p>
                        <div className="mt-4 flex">
                            <WebhookIcon className="mr-3 bg-blue-500 p-1 rounded-full text-white" /><MoveRight /> <AudioWaveform className="ml-3 bg-blue-500 p-1 rounded-full text-white" />
                        </div>
                        <p className="italic text-sm mt-2">We are listening...</p>
                    </div>
                </>
                }
            </div>

            <div className=" bottom-0 left-0 right-0 p-6 border-t bg-white">

                {jsonData && <div className="w-96 h-64 p-4 bg-gray-800 text-green-400 font-mono rounded-lg shadow-lg overflow-auto">
                    <pre>{`${JSON.stringify(jsonData, null, 2)}`}</pre>
                </div>
                }
            </div>
        </div>
    )
}
