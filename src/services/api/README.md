# services/api

THE single Axios client: base URL, interceptors, envelope unwrapping, error normalization.

**Belongs:** apiClient, request helpers, ApiError normalization.
**Never:** Feature endpoints (live in module repositories), mock imports.
**Imports (allowed direction):** → config, shared types; sole owner of axios
