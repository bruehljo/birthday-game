# Geburtstags-Jump'n'Run

Ein kleines browserbasiertes Geburtstags-Spiel im Retro-Stil: Die spielende Person sammelt 3 Kerzen, erreicht das Ziel und sieht danach den 3-stelligen Geschenk-Code.

## Dateien

- `index.html` – Einstiegspunkt
- `style.css` – Layout und Retro-Optik
- `game.js` – Spiellogik

## Geschenk-Code anpassen

Öffne `game.js` und ändere diese Zeile:

```js
codeDigits: ['4', '8', '2'],
```

Beispiel für den Code 731:

```js
codeDigits: ['7', '3', '1'],
```

## Name anpassen

Ebenfalls in `game.js`:

```js
playerName: 'Geburtstagsheld',
```

## Lokal testen

Einfach `index.html` im Browser öffnen.

## Hosting-Idee

Dieses Projekt ist eine statische Website und kann sehr einfach auf GitHub Pages, Netlify oder Vercel veröffentlicht werden.
