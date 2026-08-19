# NHTSA TSB (Manufacturer Communications) API — Reference

**Status: working, verified live against `api.nhtsa.gov` on 2026-08-12.** This corrects the assumption in `server/services/nhtsaTsbService.js` that a flat `/products/vehicle/manufacturerCommunications?...` endpoint exists — it doesn't (confirmed 403, see `docs/simulated-data-inventory.md` row 5). The real path is a different, undocumented-but-public two-step flow, reverse-engineered from the `nhtsa.gov/vehicle` search tool and cross-checked against the open-source [`DealerShelf/NHTSA`](https://github.com/DealerShelf/NHTSA) Python SDK's source (also unofficial/undocumented, but its code matches what we verified live).

There is **no official published documentation** for this flow — NHTSA's only *documented* Manufacturer Communications "API" is a set of static bulk flat-file downloads (see [Bulk flat files](#bulk-flat-files) below), which the SDK author found runs "several months behind actual manufacturer communications." The two-step JSON flow below is real-time and current (confirmed bulletins dated within the last few days at time of testing), just undocumented.

---

## Step 1 — Resolve a vehicle ID from Year/Make/Model

```
GET https://api.nhtsa.gov/vehicles/byYmmt
```

| Param | Required | Notes |
|---|---|---|
| `modelYear` | yes | e.g. `2018` |
| `make` | yes | e.g. `Honda` (case-insensitive) |
| `model` | yes | e.g. `CR-V` |
| `trim` | no | Narrows to a specific trim if the model line has multiple `vehicleId`s (see below) |
| `series` | no | e.g. `FWD` / `AWD` |
| `data` | no | Comma-separated extra data to embed (`crashtestratings,safetyfeatures,recommendedfeatures`); pass `none` if you only need the IDs |
| `productDetail` | no | `minimal` or `all` |

**Verified live example:**
```
curl "https://api.nhtsa.gov/vehicles/byYmmt?modelYear=2018&make=Honda&model=CR-V&data=none&productDetail=minimal"
```
Returned:
```json
{
  "results": [
    { "vehicleId": 10288, "modelYear": 2018, "make": "HONDA", "vehicleModel": "CR-V", "trim": "SUV", "series": "FWD", "class": "SUV" },
    { "vehicleId": 10289, "modelYear": 2018, "make": "HONDA", "vehicleModel": "CR-V", "trim": "SUV", "series": "AWD", "class": "SUV" }
  ]
}
```

**Important:** a single year/make/model can resolve to **multiple `vehicleId`s** (one per trim/drivetrain series NHTSA tracks separately). For TSB purposes this rarely matters — bulletins are almost always filed against the whole model line, not a specific trim — but a thorough implementation should fetch details for every returned `vehicleId` and de-duplicate by `manufacturerCommunicationNumber`, rather than just taking `results[0]`.

## Step 2 — Fetch manufacturer communications for that vehicle ID

```
GET https://api.nhtsa.gov/vehicles/{vehicleId}/details
```

| Param | Required | Notes |
|---|---|---|
| `data` | yes (for this use case) | `manufacturercommunications` — can be combined with `complaints,recalls,investigations` in the same call if useful elsewhere |
| `productDetail` | no | `minimal` or `all` — use `all` to get the full `manufacturerCommunications` array; `minimal` may omit it |

**Verified live example:**
```
curl "https://api.nhtsa.gov/vehicles/10288/details?data=manufacturercommunications&productDetail=all"
```
Returned (truncated), for the 2018 Honda CR-V (FWD), **265 real, current bulletins**:
```json
{
  "results": [{
    "vehicleId": 10288,
    "make": "HONDA",
    "vehicleModel": "CR-V",
    "manufacturerCommunicationsCount": 265,
    "safetyIssues": {
      "manufacturerCommunications": [
        {
          "manufacturerCommunicationNumber": "A26-091",
          "nhtsaIdNumber": 11035781,
          "subject": null,
          "summary": "Service Bulletin - Honda has developed software updates to the Honda Sensing system...",
          "communicationDate": "2026-07-31T14:26:46Z",
          "components": [
            { "id": 448, "name": "FORWARD COLLISION AVOIDANCE", "description": "263000 FORWARD COLLISION AVOIDANCE" }
          ],
          "associatedDocumentsCount": 1,
          "associatedDocuments": "https://api.nhtsa.gov/safetyIssues/byNhtsaId?nhtsaId=11035781&filter=issueType&filterValue=manufacturerCommunications",
          "associatedProductsCount": 9,
          "associatedProducts": "https://api.nhtsa.gov/safetyIssues/byNhtsaId?nhtsaId=11035781&filter=issueType&filterValue=manufacturerCommunications"
        }
      ]
    }
  }]
}
```

**Field mapping onto our existing shape** (`nhtsaTsbService.js`'s `normalizeTSB()` currently expects `Id`/`NhtsaNumber`/`ManufacturerNumber`/`Component`/`Summary`/`DateCommunicationSent`/`DocumentList` — none of those field names exist on the real payload):

| Our field | Real NHTSA field |
|---|---|
| `nhtsaNumber` | `nhtsaIdNumber` |
| `manufacturerNumber` | `manufacturerCommunicationNumber` |
| `component` | `components[0].name` (there can be more than one — join if multiple) |
| `summary` | `summary` |
| `dateCommunicationSent` | `communicationDate` |
| documents | not inline — see Step 3 |

## Step 3 (optional) — Resolve associated PDF documents for one bulletin

The `associatedDocuments` field in Step 2's response is itself a URL, not the documents — fetch it to get the actual PDF link:

```
GET https://api.nhtsa.gov/safetyIssues/byNhtsaId?nhtsaId={nhtsaIdNumber}&filter=issueType&filterValue=manufacturerCommunications
```

**Verified live example** (for `nhtsaId=11035781` from above):
```json
{
  "results": [{
    "manufacturerCommunications": [{
      "manufacturerCommunicationNumber": "A26-091",
      "nhtsaIdNumber": 11035781,
      "associatedDocuments": [{
        "id": 806962,
        "fileName": "MC-11035781-0001.pdf",
        "mimeType": "application/pdf",
        "url": "https://static.nhtsa.gov/odi/tsbs/2026/MC-11035781-0001.pdf"
      }],
      "associatedProducts": [
        { "type": "Vehicle", "productYear": "2019", "productMake": "HONDA", "productModel": "CR-V", "manufacturer": "Honda (American Honda Motor Co.)" }
      ]
    }]
  }]
}
```

Note the real static PDF path is `static.nhtsa.gov/odi/tsbs/{year}/{fileName}` — our current `nhtsaTsbService.js`'s `buildTSBDocumentUrl()` guesses `${NHTSA_TSB_STATIC_BASE}/${year}/${documentId}.pdf` with `NHTSA_TSB_STATIC_BASE = 'https://static.nhtsa.gov/odi/tsbs'` and a bare numeric `documentId` — close, but the real filename isn't just the numeric ID, it's `MC-{nhtsaIdNumber}-{seq}.pdf` and must come from this step's response, not be constructed.

## Bulk flat files (documented, but stale)

NHTSA's only *officially documented* Manufacturer Communications data access (linked from [nhtsa.gov/nhtsa-datasets-and-apis](https://www.nhtsa.gov/nhtsa-datasets-and-apis)) is static tab-delimited flat-file downloads, not a query API:

- `https://static.nhtsa.gov/odi/ffdd/tsbs/TSBS.txt` — small index file
- `https://static.nhtsa.gov/odi/ffdd/tsbs/TSBS_RECEIVED_{yearRange}.zip` — e.g. `TSBS_RECEIVED_2025-2025.zip`
- `https://static.nhtsa.gov/odi/ffdd/tsbs/MFR_COMMS_RECEIVED_{yearRange}.zip`

These are the files the `DealerShelf/NHTSA` SDK downloads and parses for its documented path — and its own code comments: *"We discovered this database is several months behind actual manufacturer communications."* The live two-step JSON flow above is materially fresher (returned a bulletin dated within days of testing) and doesn't require downloading/parsing multi-MB zip files, so it's the better fit for a per-RO lookup.

## Rate limiting

No API key required. The unofficial SDK notes NHTSA's `api.nhtsa.gov` family is generally rate-limited around 100–200 requests/minute (confirmed by NHTSA only for the separate vPIC VIN-decode API, but treated as a reasonable working assumption here too) — fine for on-demand per-RO lookups, not for bulk scraping.

## Recommended fix for `server/services/nhtsaTsbService.js`

Replace `fetchTSBPayload(year, make, model)`'s call to the nonexistent `/products/vehicle/manufacturerCommunications` with:
1. `GET /vehicles/byYmmt?modelYear=&make=&model=&data=none&productDetail=minimal` → collect all `vehicleId`s returned.
2. For each `vehicleId`, `GET /vehicles/{vehicleId}/details?data=manufacturercommunications&productDetail=all` → collect `safetyIssues.manufacturerCommunications`.
3. De-duplicate across trims by `manufacturerCommunicationNumber`.
4. Map fields per the table in Step 2 above.
5. Keep the existing Mongo cache (`TSBCache.js`) — this is still a live network call per cache miss, same cost profile as the old (broken) design, just pointed at a real endpoint.
6. Leave the `src/data/tsbData.js` curated fallback in place for when this also comes back empty/errors (e.g. NHTSA outage, or a make/model not in their vehicle-ID table) — same fail-open pattern already established.
