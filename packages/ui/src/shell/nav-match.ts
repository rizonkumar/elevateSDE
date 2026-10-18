import type { ShellNavGroupConfig, ShellNavItem } from './types';

export function isNavHrefActive(href: string, pathname: string, rootHref: string): boolean {
  if (href === rootHref) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface ActiveNavMatch<TItem extends ShellNavItem> {
  group: ShellNavGroupConfig<TItem>;
  item: TItem;
}

export function findActiveNavItem<TItem extends ShellNavItem>(
  pathname: string,
  groups: ShellNavGroupConfig<TItem>[],
  rootHref: string,
): ActiveNavMatch<TItem> | null {
  let best: ActiveNavMatch<TItem> | null = null;
  for (const group of groups) {
    for (const item of group.items) {
      if (item.external || !isNavHrefActive(item.href, pathname, rootHref)) continue;
      if (!best || item.href.length > best.item.href.length) {
        best = { group, item };
      }
    }
  }
  return best;
}
