# Documentation Site Deployment

The documentation at [https://pump-swap-sdk.modelcontextprotocol.name](https://pump-swap-sdk.modelcontextprotocol.name) is the static `docs/` folder hosted on Cloudflare Pages.

| Item | Value |
|------|-------|
| Host | Cloudflare Pages, project `pump-swap-sdk` |
| Production URL | `https://pump-swap-sdk.modelcontextprotocol.name` |
| Headers | `docs/_headers` (security headers; `.md` files served as readable text) |
| DNS | Proxied CNAME in the `modelcontextprotocol.name` zone to `pump-swap-sdk.pages.dev` |

## Deploy

Export `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, then from the repository root:

```bash
npx wrangler@4 pages deploy docs --project-name=pump-swap-sdk --branch=main
```

Deploys are manual. GitHub Actions is not used for this site.

## Verify

```bash
curl -sI https://pump-swap-sdk.modelcontextprotocol.name | head -1   # HTTP/2 200
```

## Rollback

Cloudflare dashboard → Workers & Pages → pump-swap-sdk → Deployments → pick an earlier production deployment → Rollback.
