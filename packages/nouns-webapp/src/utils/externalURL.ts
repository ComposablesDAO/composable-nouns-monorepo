export enum ExternalURL {
  discord,
  twitter,
  notion,
  discourse,
  nounsCenter,
}

export const externalURL = (externalURL: ExternalURL) => {
  switch (externalURL) {
    case ExternalURL.discord:
      return 'http://discord.gg/QThZm7uxtn';
    case ExternalURL.twitter:
      return 'https://twitter.com/Composables_';
    case ExternalURL.notion:
      return 'https://nouns.notion.site/Explore-Nouns-a2a9dceeb1d54e10b9cbf3f931c2266f';
    case ExternalURL.discourse:
      return 'https://discourse.nouns.wtf/';
    case ExternalURL.nounsCenter:
      return 'https://nouns.center/';
  }
};
