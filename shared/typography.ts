import path from "node:path";

export const TYPOGRAPHY = Object.freeze({
  title: "Gelasio",
  body: "Atkinson Hyperlegible",
  cssTitle: '"Gelasio", serif',
  cssBody: '"Atkinson Hyperlegible", sans-serif',
});

export const TYPOGRAPHY_ASSETS = Object.freeze({
  gelasioVariable: path.join(
    process.cwd(),
    "assets",
    "fonts",
    "Gelasio",
    "Gelasio-VariableFont_wght.ttf",
  ),
  gelasioRegular: path.join(process.cwd(), "assets", "fonts", "Gelasio", "Gelasio-Regular.ttf"),
  gelasioBold: path.join(process.cwd(), "assets", "fonts", "Gelasio", "Gelasio-Bold.ttf"),
  gelasioItalic: path.join(process.cwd(), "assets", "fonts", "Gelasio", "Gelasio-Italic.ttf"),
  gelasioBoldItalic: path.join(process.cwd(), "assets", "fonts", "Gelasio", "Gelasio-BoldItalic.ttf"),
  atkinsonRegular: path.join(
    process.cwd(),
    "assets",
    "fonts",
    "Atkinson-Hyperlegible",
    "AtkinsonHyperlegible-Regular.ttf",
  ),
  atkinsonBold: path.join(
    process.cwd(),
    "assets",
    "fonts",
    "Atkinson-Hyperlegible",
    "AtkinsonHyperlegible-Bold.ttf",
  ),
  atkinsonItalic: path.join(
    process.cwd(),
    "assets",
    "fonts",
    "Atkinson-Hyperlegible",
    "AtkinsonHyperlegible-Italic.ttf",
  ),
  atkinsonBoldItalic: path.join(
    process.cwd(),
    "assets",
    "fonts",
    "Atkinson-Hyperlegible",
    "AtkinsonHyperlegible-BoldItalic.ttf",
  ),
});
