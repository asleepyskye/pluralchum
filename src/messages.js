const MessageContent = BdApi.Webpack.getModule(m => {
  let s = m?.type?.toString();
  return s && s.includes('messageContent') && s.includes('SEND_FAILED');
});
const [MessageHeader, messageHeader] = BdApi.Webpack.getWithKey(BdApi.Webpack.Filters.byStrings('BaseUsername'));
const [Message, blocker] = BdApi.Webpack.getWithKey(
  BdApi.Webpack.Filters.byStrings('.cozy', '.hasReply', '.hasThread', '.isSystemMessage'),
);
const React = BdApi.React;

import { MapCell, pluginName } from './utility.js';
import MessageContentProxy from './components/MessageContentProxy.js';
import MessageHeaderProxy from './components/MessageHeaderProxy.js';
import MessageProxy from './components/MessageProxy.js';

export function patchMessageContent(settings, cache, enabled) {
  BdApi.Patcher.instead(pluginName, MessageContent, 'type', function (ctx, [props], f) {
    return (
      <MessageContentProxy
        settingsCell={settings}
        cache={cache}
        enabledCell={enabled}
        messageContent={f.call(ctx, props)}
        message={props.message}
      />
    );
  });
}

export function patchMessageHeader(settings, cache, enabled) {
  BdApi.Patcher.instead(pluginName, MessageHeader, messageHeader, function (ctx, [props], f) {
    // Props can sometimes be undefined.
    if (!props) {
      return;
    }
    return (
      <MessageHeaderProxy
        settingsCell={settings}
        cache={cache}
        enabledCell={enabled}
        messageHeader={f(props)}
        message={props.message}
        guildId={props.channel.guild_id}
        onClickUsername={props.onClick}
      />
    );
  });
}

export function patchMessage(cache, enabled) {
  let unblockedMap = new MapCell({});

  BdApi.Patcher.instead(pluginName, Message, blocker, function (ctx, [props], f) {
    return (
      <MessageProxy
        cache={cache}
        enabledCell={enabled}
        unblockedMap={unblockedMap}
        messageNode={f.call(ctx, props)}
        message={props.childrenMessageContent?.props?.message}
        label={props['aria-labelledby']}
        compact={props?.childrenHeader?.props?.compact}
      />
    );
  });
}
