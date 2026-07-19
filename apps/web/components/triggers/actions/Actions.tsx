import { ActionsAtom } from '@/atoms';
import { useAtomValue } from 'jotai';
import React from 'react'
import GmailAction from './GmailAction';
import GithubAction from './GithubAction';

export default function Actions({ nodeId }: { nodeId: string }) {
    const actions = useAtomValue(ActionsAtom);
    const currentAction = actions?.find(action => action?.id === nodeId)
    const appName = currentAction?.app?.name

    return (
        <div>
            {appName === "Gmail" && <GmailAction nodeId={nodeId} />}
            {appName === "Github" && <GithubAction nodeId={nodeId} />}
        </div>
    )
}
