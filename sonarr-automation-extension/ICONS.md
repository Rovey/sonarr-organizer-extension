# Icon Bestanden

De extensie heeft de volgende icon bestanden nodig:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## Optie 1: Tijdelijke placeholder icons maken

Je kunt tijdelijk placeholder icons maken door deze stappen te volgen:

1. Open een afbeeldingseditor (zoals Paint, GIMP, of online tool zoals Canva)
2. Maak vierkante afbeeldingen van 16x16, 48x48 en 128x128 pixels
3. Gebruik een effen kleur of simpel design
4. Sla ze op als PNG bestanden met de juiste namen
5. Plaats ze in de `sonarr-automation-extension` map

## Optie 2: Icon generator gebruiken

1. Ga naar een online icon generator zoals:
   - https://www.favicon-generator.org/
   - https://realfavicongenerator.net/

2. Upload een afbeelding of gebruik tekst
3. Download de gegenereerde icons
4. Hernoem ze naar icon16.png, icon48.png, en icon128.png
5. Plaats ze in de `sonarr-automation-extension` map

## Optie 3: Eenvoudige data URL icons

Als tijdelijke oplossing kun je ook de manifest.json aanpassen om geen icons te gebruiken:

Verwijder de volgende secties uit `manifest.json`:
```json
  "action": {
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
```

De extensie zal dan Chrome's default icon gebruiken.
