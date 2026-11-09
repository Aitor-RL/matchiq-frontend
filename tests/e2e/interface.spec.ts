import { test, expect, type Page } from '@playwright/test';
import fixture from '../fixtures/demo.json' with { type: 'json' };

// Synthetic fixtures: no real clubs, third-party requests or credentials in UI tests.
async function mockApi(page: Page, options: { catalogDelay?: number; comparisonDelay?: number; failComparison?: boolean } = {}) {
  const requests: URL[] = [];
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url()); requests.push(url);
    const division = url.searchParams.get('competition') || 'fd-SP1';
    const catalog = structuredClone(fixture.catalog);
    catalog.competition = { id: division, name: division === 'fd-SP2' ? 'Segunda División' : 'Primera División', country: 'España' };
    catalog.provenance = { ...catalog.provenance, mode: 'provider', source: 'Fixture de interfaz (simulación)', note: 'Datos ficticios para pruebas de UI.' };
    if (url.pathname.endsWith('/catalog')) {
      if (options.catalogDelay) await new Promise((resolve) => setTimeout(resolve, options.catalogDelay));
      await route.fulfill({ json: catalog }); return;
    }
    if (url.pathname.endsWith('/compare')) {
      if (options.comparisonDelay) await new Promise((resolve) => setTimeout(resolve, options.comparisonDelay));
      if (options.failComparison) { await route.fulfill({ status: 503, json: { error: 'API de prueba no disponible.' } }); return; }
      const data = structuredClone(fixture.comparison);
      if (url.searchParams.get('a') === fixture.comparison.b.team.id) [data.a, data.b] = [data.b, data.a];
      data.filters = { season: url.searchParams.get('season') || '2024', last: url.searchParams.get('last') || '10', venue: url.searchParams.get('venue') || 'all' };
      data.provenance = catalog.provenance;
      await route.fulfill({ json: data }); return;
    }
    if (url.pathname.includes('/teams/')) {
      const data = structuredClone(fixture.team); data.provenance = catalog.provenance;
      await route.fulfill({ json: data }); return;
    }
    if (url.pathname.includes('/fixtures/')) {
      const data = structuredClone(fixture.fixture); data.provenance = catalog.provenance;
      await route.fulfill({ json: data }); return;
    }
    await route.fulfill({ status: 404, json: { error: 'Registro de prueba no encontrado.' } });
  });
  return requests;
}

test('HTML inicial útil sin JavaScript, metadatos únicos y 404 real', async ({ request }) => {
  const home = await request.get('/inicio'); const content = await home.text();
  expect(home.status()).toBe(200);
  expect(content).toContain('EL JUEGO CAMBIA.');
  expect(content).toContain('property="og:image"');
  expect(content).toContain('application/ld+json');
  const compare = await (await request.get('/comparador')).text();
  expect(compare).toContain('Comparador de equipos de fútbol | MatchIQ');
  expect(compare).toContain('COMPARA EL');
  expect((await request.get('/no-existe')).status()).toBe(404);
  expect((await request.get('/sitemap.xml')).status()).toBe(200);
});

test('hidrata la portada sin errores y carga la gráfica solo al entrar al comparador', async ({ page }) => {
  await mockApi(page);
  const errors: string[] = [], chartRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (/\/charts-/.test(request.url())) chartRequests.push(request.url()); });
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { name: /EL JUEGO CAMBIA/ })).toBeVisible();
  await expect(page.locator('.data-overview')).toContainText('Primera División');
  expect(chartRequests).toHaveLength(0);
  await page.getByRole('link', { name: 'Comparar equipos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Frente a frente' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver tabla de datos' })).toBeVisible();
  expect(chartRequests.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('cargas accesibles y resultados anteriores identificados al cambiar filtros', async ({ page }) => {
  const options = { catalogDelay: 700, comparisonDelay: 500, failComparison: false };
  await mockApi(page, options);
  await page.goto('/comparador');
  await expect(page.getByRole('region', { name: 'Preparando la comparación' })).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('heading', { name: 'Frente a frente' })).toBeVisible();
  options.comparisonDelay = 1200;
  await page.getByRole('button', { name: '5', exact: true }).click();
  await expect(page.getByText('Actualizando selección.', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Frente a frente' })).toBeVisible();
  await expect(page.locator('.comparison-content')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.context-row')).toContainText('Últimos 10');
  await expect(page.locator('.context-row')).toContainText('Últimos 5');
  await expect(page.locator('.comparison-content')).toHaveAttribute('aria-busy', 'false');
  options.failComparison = true; options.comparisonDelay = 0;
  await page.getByRole('button', { name: '20', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('API de prueba no disponible.');
  options.failComparison = false;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('heading', { name: 'Frente a frente' })).toBeVisible();
});

test('división y temporada sobreviven a enlaces, búsqueda, recarga y filtros', async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto('/comparador?competition=fd-SP2&season=2024');
  await expect(page.getByRole('group', { name: 'Seleccionar división' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Frente a frente' })).toBeVisible();
  await page.getByRole('link', { name: 'Equipos', exact: true }).click();
  await expect(page).toHaveURL(/competition=fd-SP2/);
  const divisionPicker = page.getByRole('group', { name: 'Seleccionar división' });
  await expect(divisionPicker.getByRole('button', { name: /Segunda/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('textbox', { name: 'Buscar equipos' }).fill('Bruma');
  await expect(page).toHaveURL(/season=2024/);
  await page.locator('.team-directory-card').first().click();
  await expect(page.getByRole('heading', { name: 'Bruma FC', exact: true })).toBeVisible();
  await expect(page).toHaveTitle(/Bruma FC/);
  await page.reload();
  await expect(page.locator('.team-profile-heading .eyebrow')).toContainText('SEGUNDA DIVISIÓN');
  await page.getByRole('link', { name: 'Comparar equipo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Frente a frente' })).toBeVisible();
  await page.getByLabel('Condición', { exact: true }).selectOption('away');
  await expect(page).toHaveURL(/competition=fd-SP2/);
  expect(requests.every((url) => url.searchParams.get('competition') === 'fd-SP2')).toBe(true);
  await page.goto('/equipos?competition=fd-SP2&season=2024');
  await page.getByRole('group', { name: 'Seleccionar división' }).getByRole('button', { name: /Primera/ }).click();
  await expect(page).toHaveURL(/competition=fd-SP1/);
  await expect(page.getByRole('group', { name: 'Seleccionar división' }).getByRole('button', { name: /Primera/ })).toHaveAttribute('aria-pressed', 'true');
});

test('metadatos y filtros inválidos no indexables, movimiento reducido y diseño sin desbordes', async ({ page }) => {
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/comparador?last=999');
  await expect(page.getByRole('alert')).toContainText('Los filtros del enlace no son válidos');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('heading', { name: 'Frente a frente' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Inicio', exact: true }).click();
  await expect(page).toHaveTitle('MatchIQ — Estadísticas de fútbol con contexto');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('espera prolongada y movimiento reducido se comunican sin progreso ficticio', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockApi(page, { catalogDelay: 3000 });
  await page.goto('/equipos');
  await expect(page.getByRole('region', { name: 'Cargando los equipos' })).toBeVisible();
  await page.clock.fastForward(8500);
  await expect(page.getByRole('status')).toContainText('Está tardando un poco más');
  await expect(page.locator('.brand-spinner span').first()).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.skeleton-layout')).toHaveAttribute('aria-hidden', 'true');
});

test('copia una comparación completa y el enlace funciona sin memoria del navegador', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await mockApi(page);
  await page.goto('/comparador?competition=fd-SP2&season=2024&last=5&venue=away');
  await expect(page.getByRole('heading', { name: 'Frente a frente' })).toBeVisible();
  await page.getByRole('button', { name: 'Copiar enlace de esta comparación' }).click();
  await expect(page.getByText('Enlace copiado.', { exact: false })).toBeVisible();
  const copied = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  expect(copied.searchParams.get('competition')).toBe('fd-SP2');
  expect(copied.searchParams.get('season')).toBe('2024');
  expect(copied.searchParams.get('last')).toBe('5');
  expect(copied.searchParams.get('venue')).toBe('away');
  expect(copied.searchParams.get('a')).toBeTruthy();
  expect(copied.searchParams.get('b')).toBeTruthy();
  await page.goto(copied.href);
  await expect(page).toHaveURL(/competition=fd-SP2/);
  await expect(page.getByLabel('Condición', { exact: true })).toHaveValue('away');
  await page.goto('/equipos?competition=fd-SP2&season=2024');
  await expect(page.getByRole('group', { name: 'Seleccionar división' }).getByRole('button', { name: /Segunda/ })).toHaveAttribute('aria-pressed', 'true');
});

test('una ficha no queda cargando para siempre si falla el catálogo', async ({ page }) => {
  await page.route('**/api/catalog*', (route) => route.fulfill({ status: 503, json: { error: 'Fuente de prueba no disponible.' } }));
  await page.goto('/equipos/bruma');
  await expect(page.getByRole('alert')).toContainText('Fuente de prueba no disponible.');
  await expect(page.getByRole('region', { name: 'Cargando la ficha del equipo' })).toHaveCount(0);
});

