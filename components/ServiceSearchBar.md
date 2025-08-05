# ServiceSearchBar Komponente

Eine moderne, selbstständige Search Bar-Komponente für die Suche nach Dienstleistungen mit integrierter Navigation.

## Features

- 🔍 **Dual Mode**: Sowohl Dropdown-Auswahl als auch freie Texteingabe
- 🎨 **Shadcn Integration**: Verwendet shadcn/ui Komponenten für konsistentes Design
- 🌈 **JobSmith Primary Color**: Nutzt die grüne Primärfarbe von JobSmith
- ⌨️ **Keyboard Support**: Enter-Taste zum Suchen
- 🧹 **Clear Function**: Zurücksetzen-Button für ausgewählte Services
- 📱 **Responsive**: Funktioniert auf allen Bildschirmgrößen
- 🚀 **Automatische Navigation**: Integrierte Weiterleitung zur Suchergebnisseite

## Verwendung

```tsx
import ServiceSearchBar from "@/components/ServiceSearchBar";

<ServiceSearchBar
  placeholder='Nach Service suchen...'
  className='w-full max-w-2xl'
  redirectPath='/unternehmen-finden'
/>;
```

## Props

| Prop          | Type                                                      | Default                                | Beschreibung                     |
| ------------- | --------------------------------------------------------- | -------------------------------------- | -------------------------------- |
| `onSearch`    | `(service: Service \| null, searchQuery: string) => void` | -                                      | Callback-Funktion beim Suchen    |
| `placeholder` | `string`                                                  | "Service oder Suchbegriff eingeben..." | Placeholder-Text für die Eingabe |
| `className`   | `string`                                                  | -                                      | Zusätzliche CSS-Klassen          |

## Modi

### Select Mode (Standard)

- Dropdown mit allen verfügbaren Dienstleistungen
- Suchfunktion innerhalb des Dropdowns
- Click auf Search-Icon wechselt zu freier Eingabe

### Search Mode

- Freie Texteingabe für beliebige Suchbegriffe
- Click auf Dropdown-Icon wechselt zurück zur Auswahl

## Abhängigkeiten

- `@/components/ui/button`
- `@/components/ui/command`
- `@/components/ui/popover`
- `@/components/ui/input`
- `@/types/ServiceType`
- `lucide-react` (Search, ChevronDown, Check Icons)

## Styling

Die Komponente nutzt die JobSmith-Primärfarbe (Grün), die in `app/globals.css` definiert ist:

```css
--primary: 142 76% 36%; /* JobSmith Grün */
```
