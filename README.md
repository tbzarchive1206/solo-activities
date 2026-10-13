## Źródło

- [Folder Google Drive](https://drive.google.com/drive/folders/1lWQaU97gsRrXtkemYpr_vv3KSGhOOyCU)

## Synchronizacja i automatyczna publikacja

Workflow `sync-drive.yml` pobiera indeks Drive, uruchamia testy, zapisuje zmiany na `main`, a następnie wywołuje `deploy-pages.yml` przez `workflow_call`. Deployment buduje aktualny `main` i publikuje `dist` na GitHub Pages. Błąd synchronizacji, testów lub zapisu commita blokuje publikację.

W GitHub ustaw:

- Settings → Pages → Source: **GitHub Actions**.
- Secrets and variables → Actions: sekret **GOOGLE_DRIVE_API_KEY** z kluczem projektu, w którym włączono Google Drive API.
- Uprawnienia Actions i reguły gałęzi muszą pozwalać workflow na zapis indeksu do `main` oraz publikację Pages.
- Folder źródłowy i materiały muszą być dostępne publicznie; API key nie zapewnia dostępu do prywatnych plików.

Harmonogram pozostaje dwa razy dziennie: 05:17 i 17:17 UTC. Można też uruchomić **Sync Solo Activities Companies Media** ręcznie w Actions. Deployment następuje automatycznie po zakończeniu synchronizacji, również gdy dane się nie zmieniły. Sam upload do Drive nie uruchamia GitHub Actions natychmiast; materiały pojawią się po kolejnym uruchomieniu synchronizacji.

Push wykonany przez `GITHUB_TOKEN` nie uruchamia następnego workflow przez `push`, dlatego publikacja jest wywoływana bezpośrednio, bez dodatkowego tokena PAT.

## Poprawki

Testy sprawdzają strukturę danych zamiast wymagać czterech konkretnych członków i przynajmniej jednej pustej kolekcji. Nowe foldery i zapełnienie wszystkich kolekcji są dozwolone.

Pobieranie obsługuje paginację, ponawianie błędów sieci, HTTP 429, 5xx i limitów 403 (maksymalnie sześć prób z rosnącymi odstępami). Trwałe błędy uprawnień oraz niekompletne odpowiedzi zatrzymują synchronizację. Indeks jest zapisywany dopiero po pobraniu całego drzewa. Duplikaty są eliminowane, kolejność indeksu stabilizowana, a brak zmian nie tworzy nowego commita tylko z datą synchronizacji.

## Sprawdzenie lokalne

Wymagany Node.js 22.12+ lub 24 oraz pnpm zgodny z `packageManager`.

```sh
pnpm install --frozen-lockfile
pnpm test
```

Testy obejmują build strony, strukturę indeksu, nowe kolekcje, paginację, ponawianie błędów i odrzucanie niekompletnej odpowiedzi. Testy Drive używają symulowanych odpowiedzi API i nie wymagają sekretu.

Dokumentacja: [GitHub — wyzwalanie workflows](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow), [Google Drive — obsługa błędów](https://developers.google.com/workspace/drive/api/guides/handle-errors).
