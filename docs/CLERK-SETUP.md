# Clerk Setup Guide

## 1. JWT Template

Create a custom JWT template in Clerk Dashboard:
1. Go to Clerk Dashboard → Sessions → Customize JWT
2. Add the following claims in the JSON editor:

```json
{
  "tenant_id": "{{user.public_metadata.tenant_id}}",
  "role": "{{user.public_metadata.role}}"
}
```

3. Name it "RAE JWT Template"

## 2. Webhook

1. Clerk Dashboard → Webhooks → Add Endpoint
2. URL: `https://your-api-url.com/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`
4. Copy the Signing Secret → add as `CLERK_WEBHOOK_SECRET` in .env

## 3. OAuth (Google)

1. Clerk Dashboard → Social Connections → Google
2. Enable and configure with your Google OAuth credentials

## 4. Required Environment Variables

```env
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## 5. URLs

- Clerk Dashboard: https://dashboard.clerk.com
- JWT Template: Sessions → Customize JWT
- Webhooks: Webhooks → Add Endpoint
