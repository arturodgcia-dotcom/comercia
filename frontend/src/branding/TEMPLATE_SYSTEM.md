# Sistema de Plantillas Multimarcas (COMERCIA)

## Arquitectura

1. Base Theme
- Archivo: `multibrandTemplates.ts`
- Define tokens comunes (tipografia, radios, gradientes, superficies, copys base).
- Expone `buildBrandTheme` y `tokensToCssVars` para inyectar identidad en cualquier canal.

2. Brand Theme Overrides
- Entrada principal: `BrandTemplateInput`
- Campos clave:
  - `logoText`, `logoAccent`
  - `primaryColor`, `secondaryColor`, `supportColor`, `bgSoft`
  - `tone`, `businessType`
  - `promptMaster`, `copy`, `baseImages`
  - `hasExistingLanding`, `existingLandingUrl`

3. Channel Variants
- `landing`
- `public_store`
- `distributor_store`
- `pos`

Cada variante reutiliza la misma base y ajusta:
- `channelBadge`
- `leadQuestion`
- CTA principal/secundaria
- gradientes y estilo por canal

## Integracion con wizard

Se incluye `resolveBrandInputFromIdentity(identity, branding)` para transformar:
- `BrandIdentityData` (wizard)
- `TenantBranding` (branding editor)

en un `BrandTemplateInput` compatible con el sistema de templates.

Flujo recomendado:
1. Wizard captura identidad (`BrandIdentityData`).
2. Branding editor ajusta `TenantBranding`.
3. Se construye `BrandTemplateInput` con `resolveBrandInputFromIdentity`.
4. Cada canal renderiza `buildBrandTheme(input, channel)` + `tokensToCssVars(...)`.

## Demos incluidas

`MULTIBRAND_DEMO_INPUTS` contiene:
- `reinpia`
- `tulipanes` (Instituto Tulipanes Rojos)

Vista comparativa:
- Ruta: `/templates/familia`

