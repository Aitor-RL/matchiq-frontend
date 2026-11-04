import { Link as RouterLink, NavLink as RouterNavLink, useLocation, type LinkProps, type NavLinkProps } from 'react-router-dom';

export function contextHref(to: string, search: string) {
  if (!to.startsWith('/') || to.startsWith('//')) return to;
  const [pathname, query = ''] = to.split('?');
  const params = new URLSearchParams(query), current = new URLSearchParams(search);
  for (const key of ['competition', 'season']) {
    const value = current.get(key);
    if (value && !params.has(key) && (key === 'competition' ? ['fd-SP1', 'fd-SP2'].includes(value) : /^(19|20)\d{2}$/.test(value))) params.set(key, value);
  }
  return `${pathname}${params.size ? `?${params}` : ''}`;
}
export function Link({ to, ...props }: Omit<LinkProps, 'to'> & { to: string }) {
  return <RouterLink {...props} to={contextHref(to, useLocation().search)} />;
}
export function NavLink({ to, ...props }: Omit<NavLinkProps, 'to'> & { to: string }) {
  return <RouterNavLink {...props} to={contextHref(to, useLocation().search)} />;
}
