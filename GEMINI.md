# Google Maps Platform Security & Integration Directives

## 1. Zero-Hardcoding & Key Management Hygiene
- **Key Retrieval**: Never hardcode Google Maps API keys or tokens into source code or Git repositories.
- **Client-Side Keys**: Load client-side browser API keys through environment variables (`import.meta.env.VITE_GOOGLE_MAPS_API_KEY`) via `@vis.gl/react-google-maps`.
- **API Key Restrictions**: Production API keys must be strictly restricted in the Google Cloud Console:
  - **Application Restriction**: HTTP referrers restricted to authorized domain origins (e.g., `https://your-domain.com/*`).
  - **API Restrictions**: Scoped exclusively to Maps JavaScript API, Places API, and Geocoding API.
- **Backend / Elevated Services**: Any server-side Maps operations (e.g., backend geocoding, route matrices) must retrieve credentials via Google Cloud Secret Manager or environment variables (`GOOGLE_MAPS_API_KEY`) and run behind isolated `/api/*` endpoints.

## 2. Modern Google Maps JavaScript API Standards (Zero-Legacy Mandate)
- **Library Standard**: Exclusively use `@vis.gl/react-google-maps`. Deprecated libraries like `react-google-maps/api` or `google-map-react` are strictly prohibited.
- **Map ID Requirement**: Always specify a `mapId` (e.g., `DEMO_MAP_ID` or custom Cloud Map ID) on the `<Map>` component to enable vector rendering and modern marker rendering pipelines.
- **Advanced Markers Only**: Always render points of interest using `<AdvancedMarker>` and `<Pin>`. The deprecated `google.maps.Marker` is strictly prohibited.
- **Data Sanitization**: All geographic metadata (lat/lng coordinates, place names, addresses) must be sanitized and validated prior to database persistence in Cloud Firestore.
