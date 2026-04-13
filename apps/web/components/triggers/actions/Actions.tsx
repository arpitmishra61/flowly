import { ActionsAtom } from '@/atoms';
import { useAtom } from 'jotai';
import React from 'react'
import GmailAction from './GmailAction';

export default function Actions({ nodeId }: { nodeId: string }) {


    return (
        <div>{
            <GmailAction nodeId={nodeId} />

            /*
            which action 
            / gmail actiion render that component send the node id data fetch that node id data from actinState [] array and pass that dta aonly

            
            */
        }</div>
    )
}
