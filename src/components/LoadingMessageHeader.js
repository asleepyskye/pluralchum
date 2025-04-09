const React = BdApi.React;

import HeaderPKBadge from './HeaderPKBadge.js';

export default function LoadingMessageHeader({ messageHeader, profile, cache, userHash }) {
  return {
    ...messageHeader,
    props: {
      ...messageHeader.props,
      children: [
        messageHeader.props.children[4],
        <HeaderPKBadge cache={cache} userHash={userHash} profile={profile} />,
      ],
    },
  };
}
