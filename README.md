# MEDIA FROM SOLO ACTIVITIES COMPANIES

Samodzielne archiwum mediów publikowanych przez firmy obsługujące solowe aktywności członków THE BOYZ. Repozytorium jest gotowe do publikacji jako GitHub Pages i wizualnie zgodne z pozostałymi częściami THE BOYZ FAN ARCHIVE.

## Funkcje

- dynamiczne kafelki członków zgodne z głównymi folderami Google Drive,
- zachowanie pustych folderów `Hyunjae`, `Sunwoo` i `Eric`, gotowych na przyszłe treści,
- układ: członek → datowany materiał firmy → galeria,
- automatyczne wykrywanie nowych członków i nowych podfolderów z materiałami,
- wyszukiwanie według członka, tytułu, daty `YYMMDD` lub nazwy pliku,
- filtrowanie według członka zespołu,
- zdjęcia, filmy, audio i pozostałe pliki z linkami `View` i `Download`,
- automatyczne typograficzne miniaturki zastępcze,
- automatyczna synchronizacja dwa razy dziennie.

## Uruchomienie lokalne

Wymagany jest Node.js 22 oraz pnpm.

```bash
pnpm install
pnpm dev
```

Test i kompilacja:

```bash
pnpm test
```

## Publikacja na GitHub Pages

1. Utwórz puste repozytorium GitHub, np. `media-from-solo-activities-companies`.
2. Rozpakuj ZIP i w jego folderze wykonaj:

   ```bash
   git init -b main
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TWOJ_LOGIN/media-from-solo-activities-companies.git
   git push -u origin main
   ```

3. Otwórz `Settings → Pages`.
4. W `Build and deployment` wybierz `Source → GitHub Actions`.
5. Workflow `Deploy GitHub Pages` opublikuje stronę.

## Automatyczna synchronizacja

1. Udostępnij główny folder jako `Każda osoba mająca link → Wyświetlający`.
2. W projekcie Google Cloud włącz `Google Drive API`.
3. Utwórz klucz API ograniczony do Google Drive API.
4. W repozytorium GitHub przejdź do `Settings → Secrets and variables → Actions`.
5. Dodaj sekret `GOOGLE_DRIVE_API_KEY`.
6. Uruchom `Actions → Sync Solo Activities Companies Media → Run workflow`.

Synchronizacja działa codziennie o `05:17` i `17:17` UTC i skanuje całe drzewo folderów rekurencyjnie.

## Źródło

- [Folder Google Drive](https://drive.google.com/drive/folders/1lWQaU97gsRrXtkemYpr_vv3KSGhOOyCU)
