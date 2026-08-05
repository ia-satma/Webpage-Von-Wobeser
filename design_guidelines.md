# Design Guidelines: Von Wobeser y Sierra Corporate Website

## Manual de Identidad Corporativa (Junio 2022)
Este documento sigue las especificaciones oficiales del Manual de Identidad Corporativa de Von Wobeser y Sierra.

---

## 1. Colores Corporativos

### Color Principal
| Referencia | Valor | Uso |
|------------|-------|-----|
| PANTONE 187 | **#AA1A2E** | Logotipo, líneas de apoyo, CTAs principales |
| RGB | 170, 26, 46 | |
| HSL | 352° 73% 38% | |

### Colores Secundarios (Grises)
| Nombre | HEX | Uso |
|--------|-----|-----|
| Cool Gray 1 | **#D9D8D7** | Fondos web, elementos gráficos de apoyo |
| Cool Gray 4 | **#BBBBBB** | Fondos, elementos gráficos, textos secundarios |
| Cool Gray 8 | **#878A8E** | Fondos, elementos gráficos, textos |
| Cool Gray 11 | **#54565B** | Texto principal, elementos gráficos |
| Negro | **#1D1D1B** | Elementos gráficos de apoyo |

### Uso del Color
- **Fondos:** Blanco (#FFFFFF) primario, grises corporativos para secciones alternas
- **Texto:** Cool Gray 11 (#54565B) para cuerpo, #1D1D1B para headlines
- **Acentos:** Rojo (#AA1A2E) para CTAs y elementos importantes - usar con moderación
- **Bordes/Divisores:** Cool Gray 1 (#D9D8D7)

---

## 2. Tipografías

### Sistema tipográfico único vigente
| Fuente | Uso |
|--------|-----|
| **Gelasio** | Títulos, encabezados, cifras editoriales y citas destacadas |
| **Inter** | Cuerpo, navegación, botones, formularios, tablas, etiquetas y contenido general |

Estas dos familias son las únicas tipografías textuales permitidas en el sitio público, el
panel administrativo y los archivos nuevos generados por los agentes. Se sirven localmente;
no se cargan fuentes desde Google Fonts ni desde otros proveedores externos.

### Variables CSS implementadas
```css
--font-title: "Gelasio", serif;
--font-body: "Inter", sans-serif;
```

Los aliases heredados del espejo deben resolver internamente a uno de esos dos tokens. No se
deben declarar pilas tipográficas alternativas en componentes, contenido del CMS, prompts o
plantillas de agentes.

### Reglas de uso
- Todo contenido nuevo hereda la fuente por su función; el editor no ofrece un selector de fuente.
- Los estilos tipográficos pegados desde Word, correo o páginas externas se eliminan al guardar y renderizar.
- **No usar versión itálica** excepto para palabras en otro idioma, citas textuales o mensajes breves a destacar.
- La fuente del logotipo no se usa como tipografía de contenido.

---

## 3. Elementos Gráficos de Apoyo

### Líneas
- ✅ **Líneas rojas horizontales** - Permitido
- ❌ **Líneas rojas verticales** - PROHIBIDO

### Fondos
- Fondos rojos (para secciones destacadas)
- Fondos en gris claro (Cool Gray 1)
- Franjas y recuadros grises

---

## 4. Logotipo

### Uso Principal
- Logotipo en color rojo corporativo (#AA1A2E) sobre fondo blanco
- Esta es la aplicación principal y preferida

### Monograma "VW"
- Uso exclusivo en internet
- No usar en materiales impresos

### Área de Seguridad
- Reservar espacio "1X" alrededor del logotipo (X = altura de la letra "V")
- Esta zona no debe invadirse con ningún elemento gráfico

### Versión Diversidad
- Única versión permitida con colores alternativos
- Solo para publicaciones del área de Diversidad
- Usa colores de la bandera LGBTQ+

---

## 5. Layout y Componentes

### Border Radius
- **Política:** Esquinas rectas en todo el sitio (rounded-none)
- Excepto: Avatares y elementos circulares

### Espaciado
- Unidades Tailwind: 4, 6, 8, 12, 16, 20, 24
- Contenedor máximo: 1400px (max-w-7xl)
- Padding secciones: py-20 (desktop) / py-12 (mobile)

### Grid Patterns
- News cards: 3 columnas (lg:grid-cols-3, md:grid-cols-2)
- Estadísticas: 4 columnas (md:grid-cols-4)
- Galería: Grid asimétrico masonry

---

## 6. Navegación

### Header
- Fixed header con transición transparente-a-sólido en scroll
- Logo alineado a la izquierda
- Menú alineado a la derecha
- Selector de idioma en esquina superior derecha
- Sin border radius

### Footer
- Layout multi-columna: Dirección | Enlaces | Social
- Fondo gris oscuro con texto blanco
- Copyright y disclaimers legales

---

## 7. Hero Section

### Imagen
- Full-viewport (min-h-screen)
- Overlay oscuro para legibilidad (bg-black/40)
- Indicador de scroll sutil

### Contenido
- Headline centrado con animación
- Botón CTA con fondo difuminado (backdrop-blur-md bg-white/10)

---

## 8. Animaciones

### Principio: Movimiento Conservador
- Page load: Fade-in para texto hero (duration-700)
- Scroll: Parallax sutil (translateY 30%)
- Cards: Scale en hover (1.02-1.05, duration-200)
- Navegación: Transición suave de altura

### Prohibido
- Animaciones excesivas trigger por scroll
- Carruseles con autoplay
- Efectos distrayentes

---

## 9. Accesibilidad

- Focus states: 2px red outline (ring-2 ring-primary)
- Touch target mínimo: 44px × 44px
- Contrast ratio: Mínimo 4.5:1 para todo texto
- Alt text obligatorio para imágenes
- Soporte de navegación por teclado

---

## 10. Dark Mode

En modo oscuro:
- El rojo primario se aclara ligeramente a HSL(352, 73%, 42%)
- Los grises se invierten manteniendo la jerarquía
- Mantener contraste adecuado en todos los textos
