// [AI-GENERATED]
/**
 * Turns a profile link into what the profile shows: the platform's icon and name, plus the
 * handle read from the URL ("Instagram · @peter"). The label always comes from the real URL,
 * so nobody can make a link look like it goes somewhere else.
 */
export interface ProfileLink {
  /** Null when the link isn't http(s); then it's shown as plain text, not clickable. */
  href: string | null;
  /** Font Awesome classes. */
  icon: string;
  /** "Instagram", or the domain for sites we don't know. */
  name: string;
  /** "@peter", "u/peter", ...; null when the URL has none (a video link, the home page). */
  handle: string | null;
  /** The whole thing as one line, for aria-label and title. */
  label: string;
}

interface Platform {
  name: string;
  icon: string;
  /** Hosts without "www.". Subdomains match too (m.youtube.com, peter.tumblr.com). */
  hosts: string[];
  /** Reads the handle from the path segments, and from the host for subdomain sites. */
  handle?: (path: string[], host: string) => string | null;
}

/** Paths that are pages of the site, not someone's profile. */
const NOT_A_HANDLE = new Set([
  'watch', 'shorts', 'p', 'reel', 'reels', 'tv', 'explore', 'share', 'sharer', 'video', 'videos',
  'status', 'search', 'home', 'login', 'signup', 'settings', 'hashtag', 'i', 'intent', 'tag', 'tags',
  'profile.php', 'groups', 'events', 'pages', 'photo', 'photos', 'post', 'posts', 'gallery', 'live',
]);

/** First path segment as "@name" (or "name" with at = false), unless it's a site page. */
function first(at = true) {
  return (path: string[]): string | null => {
    const raw = path[0]?.replace(/^@/, '');
    if (!raw || NOT_A_HANDLE.has(raw.toLowerCase())) {
      return null;
    }
    return at ? `@${raw}` : raw;
  };
}

/** The segment after one of the given keys: "/in/peter" -> "peter". */
function after(keys: string[], prefix = '') {
  return (path: string[]): string | null => {
    const i = path.findIndex((s) => keys.includes(s.toLowerCase()));
    return i >= 0 && path[i + 1] ? `${prefix}${path[i + 1]}` : null;
  };
}

/** "peter.tumblr.com" -> "peter", falling back to the first path segment. */
function subdomainOr(domain: string, fallback: (path: string[]) => string | null) {
  return (path: string[], host: string): string | null => {
    const sub = host.endsWith(`.${domain}`) ? host.slice(0, -domain.length - 1) : '';
    return sub && sub !== 'www' && sub !== 'm' ? sub : fallback(path);
  };
}

const PLATFORMS: Platform[] = [
  { name: 'Instagram', icon: 'fa-brands fa-instagram', hosts: ['instagram.com', 'instagr.am'], handle: first() },
  {
    name: 'YouTube',
    icon: 'fa-brands fa-youtube',
    hosts: ['youtube.com', 'youtu.be'],
    // Only @handles and /c/ or /user/ names; /channel/UC... ids and video links show just "YouTube".
    handle: (path) =>
      path[0]?.startsWith('@') ? path[0] : after(['c', 'user'])(path),
  },
  { name: 'TikTok', icon: 'fa-brands fa-tiktok', hosts: ['tiktok.com'], handle: (path) => (path[0]?.startsWith('@') ? path[0] : null) },
  { name: 'Facebook', icon: 'fa-brands fa-facebook', hosts: ['facebook.com', 'fb.com', 'fb.me'], handle: first(false) },
  {
    name: 'Reddit',
    icon: 'fa-brands fa-reddit-alien',
    hosts: ['reddit.com', 'redd.it'],
    handle: (path) => after(['u', 'user'], 'u/')(path) ?? after(['r'], 'r/')(path),
  },
  { name: 'X', icon: 'fa-brands fa-x-twitter', hosts: ['x.com', 'twitter.com'], handle: first() },
  { name: 'Threads', icon: 'fa-brands fa-threads', hosts: ['threads.net', 'threads.com'], handle: first() },
  { name: 'Bluesky', icon: 'fa-brands fa-bluesky', hosts: ['bsky.app'], handle: after(['profile'], '@') },
  { name: 'Vimeo', icon: 'fa-brands fa-vimeo-v', hosts: ['vimeo.com'], handle: (path) => (/^\d+$/.test(path[0] ?? '') ? null : first(false)(path)) },
  { name: 'Behance', icon: 'fa-brands fa-behance', hosts: ['behance.net'], handle: first(false) },
  { name: 'Dribbble', icon: 'fa-brands fa-dribbble', hosts: ['dribbble.com'], handle: first(false) },
  { name: 'ArtStation', icon: 'fa-brands fa-artstation', hosts: ['artstation.com'], handle: subdomainOr('artstation.com', first(false)) },
  { name: 'DeviantArt', icon: 'fa-brands fa-deviantart', hosts: ['deviantart.com'], handle: subdomainOr('deviantart.com', first(false)) },
  { name: 'Flickr', icon: 'fa-brands fa-flickr', hosts: ['flickr.com', 'flic.kr'], handle: (path) => after(['photos', 'people'])(path) },
  { name: '500px', icon: 'fa-brands fa-500px', hosts: ['500px.com'], handle: (path) => after(['p'])(path) ?? first(false)(path) },
  { name: 'Unsplash', icon: 'fa-brands fa-unsplash', hosts: ['unsplash.com'], handle: (path) => (path[0]?.startsWith('@') ? path[0] : null) },
  { name: 'Pinterest', icon: 'fa-brands fa-pinterest', hosts: ['pinterest.com', 'pin.it'], handle: first(false) },
  { name: 'Letterboxd', icon: 'fa-brands fa-letterboxd', hosts: ['letterboxd.com', 'boxd.it'], handle: first(false) },
  { name: 'Tumblr', icon: 'fa-brands fa-tumblr', hosts: ['tumblr.com'], handle: subdomainOr('tumblr.com', first(false)) },
  { name: 'LinkedIn', icon: 'fa-brands fa-linkedin', hosts: ['linkedin.com'], handle: after(['in', 'company']) },
  { name: 'GitHub', icon: 'fa-brands fa-github', hosts: ['github.com'], handle: first(false) },
  { name: 'Twitch', icon: 'fa-brands fa-twitch', hosts: ['twitch.tv'], handle: first(false) },
  { name: 'Patreon', icon: 'fa-brands fa-patreon', hosts: ['patreon.com'], handle: first(false) },
  { name: 'SoundCloud', icon: 'fa-brands fa-soundcloud', hosts: ['soundcloud.com'], handle: first(false) },
  { name: 'Spotify', icon: 'fa-brands fa-spotify', hosts: ['spotify.com'] },
  { name: 'Discord', icon: 'fa-brands fa-discord', hosts: ['discord.gg', 'discord.com'] },
];

export function toProfileLink(url: string): ProfileLink {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { href: null, icon: 'fa-solid fa-link', name: url, handle: null, label: url };
  }

  const safe = parsed.protocol === 'https:' || parsed.protocol === 'http:';
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const href = safe ? parsed.href : null;
  const platform = PLATFORMS.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`)));

  if (!platform || !safe) {
    return { href, icon: safe ? 'fa-solid fa-globe' : 'fa-solid fa-link', name: host || url, handle: null, label: host || url };
  }

  const path = parsed.pathname
    .split('/')
    .filter((s) => s !== '')
    .map((s) => safeDecode(s));
  const handle = platform.handle?.(path, host) ?? null;
  return {
    href,
    icon: platform.icon,
    name: platform.name,
    handle,
    label: handle ? `${platform.name} · ${handle}` : platform.name,
  };
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
