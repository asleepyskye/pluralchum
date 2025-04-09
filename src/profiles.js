const React = BdApi.React;

import { sleep, isProxiedMessage } from './utility';

export const ProfileStatus = {
  Done: 'DONE',
  Updating: 'UPDATING',
  Requesting: 'REQUESTING',
  NotPK: 'NOT_PK',
  Stale: 'STALE',
};

const baseEndpoint = 'https://api.pluralkit.me/v2';
const userAgent = 'PLURALCHUM (github.com/estroBiologist/pluralchum)';
const delayPerRequest = 600;

let currentRequests = -1;
async function httpGetAsync(url) {
  currentRequests += 1;
  await sleep(currentRequests * delayPerRequest);
  let headers = new Headers({ 'User-Agent': userAgent });
  let response = await fetch(url, { headers });
  currentRequests -= 1;
  return response;
}

function pkDataToProfile(data) {
  let system = {
    id: data.system.id,
    name: data.system.name ?? '',
    description: data.system.description ?? '',
    tag: data.system.tag ?? '',
    pronouns: data.system.pronouns ?? '',
    avatar_url: data.system.avatar_url ?? '',
    banner: data.system.banner ?? '',
    color: '#' + data.system.color,
  }
  if (data.system.color === null) system.color = '';

  let member = {
    hash: "",
    name: data.member.display_name ?? data.member.name,
    system: data.system.id,
    color: '#' + data.member.color,
    pronouns: data.member.pronouns ?? '',
    avatar_url: data.member.avatar_url ?? '',
    banner: data.member.banner ?? '',
    description: data.member.description ?? '',
    sender: data.sender
  }
  if (data.member.color === null) member.color = '';

  return {system, member};
}

async function pkResponseToProfile(response) {
  if (response.status == 200) {
    console.log('RESPONSE');
    let data = await response.json();
    console.log(data);
    return pkDataToProfile(data);
  } else if (response.status == 404) {
    return { status: ProfileStatus.NotPK };
  }
}

async function getFreshProfile(message) {
  let profileResponse = await httpGetAsync(`${baseEndpoint}/messages/${message.id}`);
  return await pkResponseToProfile(profileResponse);
}

async function updateFreshProfile(message, hash, cache) {
  // profileMap.update(hash, function (profile) {
  //   if (profile !== null) {
  //     profile.status = ProfileStatus.Updating;
  //     return profile;
  //   } else {
  //     return { status: ProfileStatus.Requesting };
  //   }
  // });

  let profile = await getFreshProfile(message);
  let member = profile.member;
  member.hash = hash;
  cache.cacheMember(profile.member);
  cache.cacheSystem(profile.system);
}

function hashCode(text) {
  var hash = 0;
  for (var i = 0; i < text.length; i++) {
    var char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export function getUserHash(author) {
  let username = author.username;
  if (Object.hasOwn(author, 'username_real')) username = author.username_real;

  return hashCode(username + author.avatar);
}

function shouldUpdate(profile) {
  return !profile || profile.status === ProfileStatus.Stale;
}

export async function updateProfile(message, cache) {
  if (!isProxiedMessage(message)) return null;

  let username = message.author.username;
  if (Object.hasOwn(message.author, 'username_real')) username = message.author.username_real;

  let userHash = getUserHash(message.author);

  let member = await cache.getMember(userHash);

  if (shouldUpdate(member)) {
    console.log(`[PLURALCHUM] Requesting data for ${username} (${userHash})`);
    try {
      await updateFreshProfile(message, userHash, cache);
    } catch (e) {
      console.log(`[PLURALCHUM] Error while requesting data for ${username} (${userHash}): ${e}`);
    }
  }
}

export function hookupProfile(cache, author) {
  let userHash = getUserHash(author);
  let profile = cache.getMember(userHash);
  return profile;
}
