import { ActionsAtom, SaveNodeAction } from '@/atoms';
import { useAtom, useSetAtom } from 'jotai';
import React from 'react'
import GmailAction from './GmailAction';
import { Button } from '@/components/ui/button';

export default function Actions({ nodeId }: { nodeId: string }) {


    return (
        <div>

            {/*
            which action
            / gmail actiion render that component send the node id data fetch that node id data from actinState [] array and pass that dta aonly



            */}
            <GmailAction nodeId={nodeId} />


        </div>
    )
}
