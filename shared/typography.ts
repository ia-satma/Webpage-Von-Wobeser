import path from "node:path";

export const TYPOGRAPHY = Object.freeze({
  title: "Gelasio",
  body: "Inter",
  cssTitle: '"Gelasio", serif',
  cssBody: '"Inter", sans-serif',
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
  interRegular: path.join(
    process.cwd(),
    "assets",
    "fonts",
    "Inter",
    "Inter-Regular.ttf",
  ),
  interBold: path.join(
    process.cwd(),
    "assets",
    "fonts",
    "Inter",
    "Inter-Bold.ttf",
  ),
  interItalic: path.join(
    process.cwd(),
    "assets",
    "fonts",
    "Inter",
    "Inter-Italic.ttf",
  ),
  interBoldItalic: path.join(
    process.cwd(),
    "assets",
    "fonts",
    "Inter",
    "Inter-BoldItalic.ttf",
  ),
});
