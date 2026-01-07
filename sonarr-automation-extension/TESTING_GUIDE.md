# Testing & Debug Guide

## Belangrijke Fixes

### Fix 1: Navigatie Loop
De extensie is bijgewerkt met een fix voor de navigatie loop. Het probleem was dat de extensie probeerde te navigeren EN acties uit te voeren in dezelfde functie, wat niet werkt omdat navigatie de script executie stopt.

### Fix 2: Juiste URL's
De Sonarr series index pagina staat op de **root URL `/`** en NIET op `/series`. De extensie is aangepast om:
- De root pagina `/` te detecteren als index pagina
- Terug te navigeren naar `/` aan het einde (niet naar `/series`)

## Debug Functionaliteit

### 1. Console Logs (F12)
Open de Chrome Developer Console (F12) om gedetailleerde logs te zien:

```javascript
// Alle logs hebben het [Sonarr Debug] prefix
// Voorbeeld logs:
[Sonarr Debug] [12:34:56.789] === START AUTOMATION ===
[Sonarr Debug] [12:34:56.790] Is index page? true
[Sonarr Debug] [12:34:56.791] Found series links 47
```

### 2. Extension Popup Debug Knop
Klik in de extension popup op "Toon Debug Info" om:
- Huidige status te zien (ACTIEF/NIET ACTIEF)
- Voortgang te zien (bijv. "Series: 5/47")
- Recent logs te bekijken

### 3. Console Commando's
Type in de Console (F12):

```javascript
// Bekijk alle debug logs in een tabel
getSonarrDebugLogs()

// Check session storage
sessionStorage.getItem('sonarrSeriesList')
sessionStorage.getItem('sonarrCurrentIndex')
sessionStorage.getItem('sonarrAutomationActive')
sessionStorage.getItem('sonarrDebugLogs')
```

## Hoe te Testen

### Test 1: Basis Flow
1. Ga naar Sonarr **ROOT pagina** (`http://sonarr.example.com/` - met alle series)
   - **NIET** naar `/series` - dat is de verkeerde pagina!
2. Open Console (F12)
3. Klik op extension icon → "Start Automatisering"
4. Kijk naar console logs:
   ```
   === START AUTOMATION ===
   Is index page? {hasIndexContainer: true, isRootPath: true, pathname: "/", finalDecision: true}
   Found series links X
   Navigating to first series...
   ```
5. De pagina zou naar de eerste serie moeten navigeren
6. Op de serie pagina zou je moeten zien:
   ```
   === PAGE LOADED ===
   Auto-continuing automation...
   === START AUTOMATION ===
   Not on index page - checking for active automation
   Processing series 1/X
   Looking for Preview Rename button...
   ```

### Test 2: Stop Functionaliteit
1. Start de automatisering
2. Klik op "Stop Automatisering" in de popup
3. Check in console dat session storage is gewist

### Test 3: Debug Info
1. Start de automatisering
2. Open de popup en klik "Toon Debug Info"
3. Verifieer dat je status en logs ziet

## Veelvoorkomende Problemen & Oplossingen

### Probleem: Blijft hangen op "Navigating to series"
**Oorzaak:** De oude bug waar de extensie probeerde te navigeren EN acties uit te voeren.

**Oplossing:** Zorg dat je de NIEUWE versie van content.js hebt met:
- `processCurrentSeriesPage()` functie (ZONDER navigatie)
- `sonarrAutomationActive` session storage check
- Auto-continue logica in de page load event

**Verificatie:**
```javascript
// In console, check of deze functie bestaat:
window.getSonarrDebugLogs
// Als deze bestaat, heb je de nieuwe versie
```

### Probleem: "Preview Rename button not found"
**Debug stappen:**
1. Check de console logs voor "Sample button texts"
2. Dit toont welke buttons de extensie kan vinden
3. Mogelijk moet de selector aangepast worden

**Handmatige test:**
```javascript
// In console op serie pagina:
Array.from(document.querySelectorAll('button'))
  .filter(b => b.textContent.includes('Preview') || b.textContent.includes('Rename'))
  .map(b => b.textContent)
```

### Probleem: "Organize button not found"
**Debug stappen:**
1. Klik handmatig op "Preview Rename"
2. In console:
```javascript
Array.from(document.querySelectorAll('button'))
  .filter(b => b.textContent.includes('Organize'))
  .map(b => ({ text: b.textContent, classes: b.className }))
```
3. Check of de button de verwachte classes heeft

## Debug Logs Interpreteren

### Normale Flow Logs:
```
=== START AUTOMATION ===
Is index page? true
Found series links 47
Navigating to first series /series/xxx

[Na navigatie]
=== PAGE LOADED ===
Auto-continuing automation...
=== START AUTOMATION ===
Not on index page - checking for active automation
Processing series 1/47
Looking for Preview Rename button...
Attempt 1/20: Found X buttons
Found Preview Rename button!
Clicking Preview Rename...
Looking for Organize button...
Found Organize button!
Clicking Organize...
Waiting for organize to complete...
Series processed successfully!
Moving to series 2/47...
```

### Wat te delen bij problemen:
1. Output van `getSonarrDebugLogs()` uit console
2. Screenshot van extension popup met "Debug Info" zichtbaar
3. URL van de pagina waar het mis gaat
4. Console errors (rood in console)

## Handmatig Session Storage Clearen
Als de extensie vastloopt:

```javascript
// In console (F12):
sessionStorage.removeItem('sonarrSeriesList');
sessionStorage.removeItem('sonarrCurrentIndex');
sessionStorage.removeItem('sonarrAutomationActive');
sessionStorage.removeItem('sonarrDebugLogs');
console.log('Session storage cleared');
```

Of gebruik de "Stop Automatisering" knop in de popup.

## Extension Herladen
Na code changes:
1. Ga naar `chrome://extensions/`
2. Vind "Sonarr Series Organizer"
3. Klik op het refresh icon
4. Herlaad je Sonarr tab (F5)
5. Probeer opnieuw

## Verbose Debug Mode
Voor extra debugging, open `content.js` en voeg toe aan het begin:

```javascript
const VERBOSE_DEBUG = true; // Zet op true voor extra logs
```

Dan in de debug functie:
```javascript
if (VERBOSE_DEBUG || message.includes('ERROR') || message.includes('STATUS')) {
  console.log(logMsg, data || '');
}
```
