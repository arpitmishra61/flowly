import React from 'react'
import Webhook from '../Webhook'
import { Button } from '../ui/button'
import { SaveNodeAction } from '@/atoms'
import { useAtomValue } from 'jotai'

export default function Triggers() {
    const saveNodeAction = useAtomValue(SaveNodeAction)
    console.log(saveNodeAction)

    return (
        <>
            <Webhook />
            <Button onClick={saveNodeAction} className="w-full mt-4" size="lg">
                Finish
            </Button>
        </>
    )
}
