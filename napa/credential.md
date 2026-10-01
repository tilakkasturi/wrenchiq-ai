NAPA XML Parts Catalog Server (NXPCS) — no OAuth/API keys; auth is just
account-level identifiers baked into every request body. Sourced from the
working production config at
`/opt/predii/p360/application/conf/application.yaml` (the `napa` store under
`tools.parts_catalog.stores`) — confirmed live while building `searchParts.js`.

Catalog API URL: http://www.napaecat.com/scripts/TRACSPPCatalogServ.dll
Price/Availability API URL: http://gateway.napaprolink.com/b2bBridgeProlink?request=xml&service=POSServiceI

DC ID: 59 (Sacramento Distribution Center)
Country ID: 1 (US)
Customer Type ID: 1 (Standard)

Store ID: 900002001
Store Password: D00000
(Store ID/password are only used for the separate Price/Availability (TAMS)
API, not the catalog search endpoints.)

Env var overrides (see searchParts.js): NAPA_CATALOG_API_URL, NAPA_DC_ID,
NAPA_COUNTRY_ID, NAPA_CUSTOMER_TYPE_ID.

Spec: "NAPA XML Parts Catalog Server Spec v6.1.1 1.docx" in this folder.
Note: the spec's own "Testing Server" section says "TO BE DETERMINE" for the
host — the URL above is the real one in production use at p360, not from the
spec document.
