# ntb-profile-pictures-o365
Scripts reading profile pictures from NTB Mediabank and imports them to O365

## Flyt
- Hente ned alle profilbilder fra albumet Profilbilder til IT-systemer via Search media (får bare hentet 200 av gangen)
- Lage en ny liste over alle som ikke har taggen importertM365
- For hvert av bildene i lista; 
    - Finne brukeren vha bildetittel (headline) eller filnavn hvis bildetittel ikke er satt
        - Hvis filnavn eller bildetittel ligner på et UPN, slår vi opp i Graph direkte på UPN
        - Hvis filnavn eller bildetittel ligner på et displayName, søker vi opp dette i Graph og krever entydig match
        - Hvis vi ikke finner brukeren, eller finner flere enn en; legg til i liste over manglende brukere
        - Hvis vi finner, legg bilde sammen med brukeren i liste som skal håndteres.
- For hvert bilde som skal håndteres; 
    - Laste ned 1024x1024 preview bildet
    - Laste opp bildet til M365 på rett person via Graph-API
    - Opprett taggen ImportertM365 på bildet
- Send epostvarsel med liste over manglende brukere til fotografen + varsling i Teams

## Oppsett
- Klon ned repoet der det skal kjøres
- Installer prosjektet `npm i`
- Opprett .env med følgende verdier:
```bash
NTB_CLIENT_SECRET="secret"
NTB_CLIENT_ID="client id"
NTB_TOKEN_URL="token url"
NTB_TOKEN_AUDIENCE="token audience url"
NTB_API_URL="api url"
APPREG_CLIENT_ID="client id"
APPREG_CLIENT_SECRET="secret"
APPREG_TENANT_ID="tenant id"
MAIL_TO="epost til den som vedlikeholder bildene. Hvis flere; separer med komma"
MAIL_KEY="nøkkel til mail api"
MAIL_URL="mail api url"
MAIL_BCC="bcc kopimottaker. Hvis flere; separer med komma" # Optional
UPN_SUFFIX="upn suffix til brukere som skal hentes" # Optional. Default til vestfoldfylke.no
IMPORTED_KEYWORD="keyword som settes på importerte bilder" # Optional. Default til importertM365
GRAPH_URL="Url til graph API" # Optional. Default til https://graph.microsoft.com
GRAPH_SCOPE="Graph scope" # Optional. Default til https://graph.microsoft.com/.default
MAIL_FROM="Email fra adresse" # Optional. Default til noreply@vestfoldfylke.no
MAIL_TEMPLATE_NAME="Template brukt i mail-API" # Optional. Default 'vestfoldfylke'
```
## Nyttige lenker
- https://api.ntb.no/portal/docs/media#tag/Media/paths/~1media~1v1~1%7Barchive%7D~1/get
- endepunkt https://api.ntb.no/media/v1/{archive}/
- https://api.ntb.no/portal/getting_started
