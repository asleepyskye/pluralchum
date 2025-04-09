const React = BdApi.React;

import { hookupValueCell, isProxiedMessage } from '../utility.js';
import { updateProfile, ProfileStatus, getUserHash, hookupMember } from '../profiles.js';
import ColoredMessageHeader from './ColorMessageHeader.js';
import LoadingMessageHeader from './LoadingMessageHeader.js';

export default function MessageHeaderProxy({
  settingsCell,
  cache,
  enabledCell,
  messageHeader,
  message,
  guildId,
  onClickUsername,
}) {
  let [settings] = hookupValueCell(settingsCell);
  let profile = hookupMember(cache, message.author);
  let [enabled] = hookupValueCell(enabledCell);

  if (!enabled || !isProxiedMessage(message)) {
    return messageHeader;
  }

  updateProfile(message, cache);

  let userHash = getUserHash(message.author);

  if (profile && (profile.status === ProfileStatus.Done || profile.status === ProfileStatus.Updating)) {
    return (
      <ColoredMessageHeader
        settings={settings}
        cache={cache}
        profile={profile}
        userHash={userHash}
        messageHeader={messageHeader}
        message={message}
        guildId={guildId}
        onClickUsername={onClickUsername}
      />
    );
  } else if (!profile || profile.status === ProfileStatus.Requesting) {
    return (
      <LoadingMessageHeader
        messageHeader={messageHeader}
        profile={{ status: ProfileStatus.Requesting }}
        cache={cache}
        userHash={userHash}
      />
    );
  } else {
    return messageHeader;
  }
}
