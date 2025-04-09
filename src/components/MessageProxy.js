import { hookupProfile } from '../profiles';
import { hookupValueCell } from '../utility';
import BlockedMessage from './BlockedMessage';
let isBlocked = BdApi.Webpack.getByKeys('isBlocked').isBlocked;

const React = BdApi.React;

function isBlockedProfile(profile) {
  return profile?.sender && isBlocked(profile.sender);
}

function MessageProxyInner({ cache, unblockedMap, messageNode, message, label, compact }) {
  let profile = hookupProfile(cache, message.author);

  if (isBlockedProfile(profile)) {
    return (
      <BlockedMessage
        unblockedMap={unblockedMap}
        message={message}
        messageNode={messageNode}
        label={label}
        compact={compact}
      />
    );
  } else {
    return messageNode;
  }
}

export default function MessageProxy({ cache, enabledCell, unblockedMap, messageNode, message, label, compact }) {
  let [enabled] = hookupValueCell(enabledCell);
  if (enabled && message) {
    return (
      <MessageProxyInner
        cache={cache}
        unblockedMap={unblockedMap}
        messageNode={messageNode}
        message={message}
        label={label}
        compact={compact}
      />
    );
  } else {
    return messageNode;
  }
}
