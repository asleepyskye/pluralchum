const React = BdApi.React;

import { onElementLoad, pluginName } from './utility.js';

const [BotPopout, viewBotPopout] = BdApi.Webpack.getWithKey(
  BdApi.Webpack.Filters.byStrings('UserProfilePopoutWrapper:'),
);

const [Avatar, avatar] = BdApi.Webpack.getWithKey(
  BdApi.Webpack.Filters.byStrings('avatarSrc', 'avatarDecorationSrc', 'eventHandlers', 'avatarOverride'),
);

const [Banner, banner] = BdApi.Webpack.getWithKey(BdApi.Webpack.Filters.byStrings('bannerSrc'));

const [UsernameRow, usernameRow] = BdApi.Webpack.getWithKey(BdApi.Webpack.Filters.byStrings('_.clanTagContainer'));

const UserProfileStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('UserProfileStore'));
const UserStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('UserStore'));
const User = BdApi.Webpack.getByPrototypeKeys('addGuildAvatarHash', 'isLocalBot');
const MessageStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('MessageStore'));
import { getUserHash } from './profiles.js';
import PopoutPKBadge from './components/PopoutPKBadge.js';

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

export function patchBotPopout(profileMap) {
  BdApi.Patcher.instead(pluginName, UserProfileStore, 'getGuildMemberProfile', function (ctx, [userId, guildId], f) {
    if (userId && typeof userId !== 'string' && userId.userProfile) {
      return userId.userProfile;
    } else {
      return f(userId, guildId);
    }
  });

  BdApi.Patcher.instead(pluginName, UserProfileStore, 'getUserProfile', function (ctx, [userId, guildId], f) {
    if (userId && typeof userId !== 'string' && userId.userProfile) {
      return userId.userProfile;
    } else {
      return f(userId, guildId);
    }
  });

  BdApi.Patcher.instead(pluginName, UserStore, 'getUser', function (ctx, [userId, guildId], f) {
    if (userId && typeof userId !== 'string' && userId.user) {
      return userId.user;
    } else {
      return f(userId, guildId);
    }
  });

  BdApi.Patcher.after(pluginName, Avatar, avatar, function (_, [{ user }], ret) {
    if (user && isValidHttpUrl(user.avatar)) {
      ret.avatarSrc = user.avatar;
      ret.avatarPlaceholder = user.avatar;
    }
    return ret;
  });

  BdApi.Patcher.after(pluginName, Banner, banner, function (_, [{ displayProfile }], ret) {
    if (displayProfile && isValidHttpUrl(displayProfile.banner)) {
      ret.bannerSrc = displayProfile.banner;
    }
    return ret;
  });

  BdApi.Patcher.instead(pluginName, BotPopout, viewBotPopout, function (_, [args], f) {
    let message = MessageStore.getMessage(args.channelId, args.messageId);

    if (!message) {
      return f(args);
    }

    let userHash = getUserHash(message.author);
    let profile = profileMap.get(userHash);

    if (!profile) {
      return f(args);
    }

    let userProfile = {
      bio: profile.description,
      userId: args.user.id,
      guildId: args.guildId,
      pronouns: profile.pronouns,
    };

    if (profile.color) {
      userProfile.accentColor = Number('0x' + profile.color.substring(1));
    } else {
      userProfile.accentColor = Number('0x5b63f4');
    }

    if (profile.banner) {
      userProfile.banner = profile.banner;
    }

    let user = new User({
      username: profile.system_name ?? profile.system,
      globalName: profile.name,
      bot: true,
      discriminator: profile.system,
    });

    user.id = { userProfile, user, isPK: true };

    if (args.user.avatar) {
      user.avatar = 'https://cdn.discordapp.com/avatars/' + args.user.id + '/' + args.user.avatar + '.webp';
    }

    return f({ ...args, user });
  });

  BdApi.Patcher.after(pluginName, UsernameRow, usernameRow, function (ctx, [args], ret) {
    if (args.user?.id?.isPK) {
      ret.props.children[0].props.children[1] = <PopoutPKBadge />;
    }

    return ret;
  });

  const userProfile = BdApi.Webpack.getByKeys("openUserProfileModal")
  const Dispatcher = BdApi.Webpack.getByKeys("dispatch", "subscribe");
  BdApi.Patcher.instead(pluginName, userProfile, "openUserProfileModal", (ctx, [args], f) => {
      if(typeof args.userId !== 'string' && args.userId?.isPK)
      {
        Dispatcher.dispatch({
          type: "USER_PROFILE_MODAL_OPEN",
          userId: args.userId,
          appContext: args.appContext
        });

        return;
      }
      return f(args);
  });
  
  const UpdateNote = BdApi.Webpack.getByKeys("updateNote");
  BdApi.Patcher.instead(pluginName, UpdateNote, "updateNote", function (ctx, args, f) {
    if (args[0]?.isPK) {
      return;
    }
    return f(...args);
  });

  //this might eventually break with an update? just nuke the overflow menu button for PK profiles
  const OverflowMenu = BdApi.Webpack.getByStrings('user-bot-profile-overflow-menu', 'BLOCK', {defaultExport: false});
  BdApi.Patcher.after(pluginName, OverflowMenu, "Z", (ctx, [args], returnValue) => {
      if(args.user?.id?.isPK) returnValue.props?.targetElementRef?.current?.remove();
  });

  //this could potentially be changed to message the system user?
  const MessageButton = BdApi.Webpack.getByKeys("openPrivateChannel");
  BdApi.Patcher.instead(pluginName, MessageButton, "openPrivateChannel", function (ctx, args, f) {
    if (args[0]?.isPK) {
      return;
    }
    return f(...args);
  });
}