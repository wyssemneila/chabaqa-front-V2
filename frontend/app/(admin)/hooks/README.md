# Admin Dashboard Data Caching

This directory contains custom hooks for data fetching with SWR caching in the admin dashboard.

## Overview

The admin dashboard uses SWR (stale-while-revalidate) for efficient data caching and automatic revalidation. This provides:

- **Automatic caching**: Data is cached in memory and reused across components
- **Background revalidation**: Data is automatically refreshed in the background
- **Optimistic updates**: UI updates immediately while data syncs in the background
- **Error retry**: Automatic retry on failed requests
- **Deduplication**: Multiple requests for the same data are deduplicated

## Cache Configuration

Different data types have different cache times based on how frequently they change:

- **Realtime data** (1 minute): Dashboard metrics, moderation queue, security events
- **Moderate data** (5 minutes): User lists, community lists, financial data, analytics
- **Slow-changing data** (15 minutes): Audit logs, email templates
- **Static data** (1 hour): Configuration data (not currently used)

## Usage

### Basic Usage

```typescript
import { useDashboardMetrics } from '@/app/(admin)/hooks/use-admin-data'

function DashboardPage() {
  const { data, error, isLoading, mutate } = useDashboardMetrics()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <div>{/* Render dashboard with data */}</div>
}
```

### With Filters

```typescript
import { useUsers } from '@/app/(admin)/hooks/use-admin-data'

function UsersPage() {
  const [filters, setFilters] = useState({ status: 'active' })
  const { data, error, isLoading } = useUsers(filters)
  
  // Data is automatically refetched when filters change
  // and cached for subsequent renders with the same filters
}
```

### Manual Revalidation

```typescript
import { useDashboardMetrics } from '@/app/(admin)/hooks/use-admin-data'

function DashboardPage() {
  const { data, mutate } = useDashboardMetrics()
  
  const handleRefresh = () => {
    mutate() // Manually trigger revalidation
  }
  
  return (
    <div>
      <button onClick={handleRefresh}>Refresh</button>
      {/* Render dashboard */}
    </div>
  )
}
```

### Cache Invalidation After Mutations

```typescript
import { useUsers } from '@/app/(admin)/hooks/use-admin-data'
import { invalidateUsers } from '@/app/(admin)/hooks/use-cache-invalidation'
import { adminApi } from '@/lib/api/admin-api'

function UserManagement() {
  const { data: users } = useUsers()
  
  const handleSuspendUser = async (userId: string) => {
    await adminApi.users.suspendUser(userId, { reason: 'Policy violation' })
    
    // Invalidate cache to refetch fresh data
    await invalidateUsers()
  }
}
```

## Available Hooks

### Dashboard
- `useDashboardMetrics()` - Main dashboard metrics (users, communities, content, revenue)

### Users
- `useUsers(filters?)` - User list with optional filters
- `useUserDetails(userId)` - Individual user details

### Communities
- `useCommunities(filters?)` - Community list with optional filters
- `usePendingCommunities()` - Pending community approvals
- `useCommunityDetails(communityId)` - Individual community details

### Content Moderation
- `useModerationQueue(filters?)` - Moderation queue with optional filters
- `useContentDetails(contentId)` - Individual content item details

### Financial
- `useFinancialDashboard(period)` - Financial dashboard data
- `useSubscriptions(filters?)` - Subscriptions list
- `useTransactions(filters?)` - Transactions list
- `usePayouts(filters?)` - Payouts list

### Analytics
- `useAnalyticsDashboard(period)` - Analytics dashboard data

### Security
- `useAuditLogs(filters?)` - Audit logs with optional filters
- `useSecurityEvents(filters?)` - Security events with optional filters

### Communication
- `useEmailCampaigns()` - Email campaigns list
- `useCampaignDetails(campaignId)` - Individual campaign details
- `useEmailTemplates()` - Email templates list

## Cache Invalidation

Use the cache invalidation utilities from `use-cache-invalidation.ts` to manually invalidate cached data after mutations:

```typescript
import {
  invalidateUsers,
  invalidateUserDetails,
  invalidateCommunities,
  invalidateModerationQueue,
  // ... other invalidation functions
} from '@/app/(admin)/hooks/use-cache-invalidation'

// Invalidate specific cache
await invalidateUsers()

// Invalidate with filters
await invalidateUsers({ status: 'active' })

// Invalidate specific item
await invalidateUserDetails('user-id-123')

// Invalidate all admin cache (use with caution)
await invalidateAllAdminCache()
```

## Best Practices

1. **Use hooks at the component level**: Don't lift data fetching to parent components unnecessarily
2. **Invalidate cache after mutations**: Always invalidate relevant cache after create/update/delete operations
3. **Use filters in cache keys**: Filters are automatically included in cache keys for proper isolation
4. **Handle loading and error states**: Always handle `isLoading` and `error` states in your components
5. **Avoid manual refetching**: Let SWR handle automatic revalidation instead of manual refetching
6. **Use optimistic updates**: For better UX, update the UI optimistically before the API call completes

## Example: Complete CRUD Flow

```typescript
import { useUsers } from '@/app/(admin)/hooks/use-admin-data'
import { invalidateUsers, invalidateUserDetails } from '@/app/(admin)/hooks/use-cache-invalidation'
import { adminApi } from '@/lib/api/admin-api'
import { toast } from 'sonner'

function UserManagement() {
  const { data: users, isLoading, error } = useUsers()
  
  const handleSuspendUser = async (userId: string) => {
    try {
      // Perform mutation
      await adminApi.users.suspendUser(userId, { reason: 'Policy violation' })
      
      // Invalidate cache to refetch fresh data
      await Promise.all([
        invalidateUsers(),
        invalidateUserDetails(userId)
      ])
      
      // Show success feedback
      toast.success('User suspended successfully')
    } catch (error) {
      console.error('[Suspend User] Error:', error)
      toast.error('Failed to suspend user')
    }
  }
  
  if (isLoading) return <div>Loading users...</div>
  if (error) return <div>Error loading users</div>
  
  return (
    <div>
      {users.map(user => (
        <div key={user._id}>
          <span>{user.username}</span>
          <button onClick={() => handleSuspendUser(user._id)}>
            Suspend
          </button>
        </div>
      ))}
    </div>
  )
}
```

## Performance Benefits

- **Reduced API calls**: Data is cached and reused across components
- **Faster page loads**: Cached data is displayed immediately
- **Better UX**: Background revalidation keeps data fresh without blocking the UI
- **Automatic deduplication**: Multiple components requesting the same data only trigger one API call
- **Optimized re-renders**: Components only re-render when their specific data changes

## Migration Guide

To migrate existing pages to use caching:

1. Replace `useState` and `useEffect` data fetching with the appropriate hook
2. Remove manual loading state management (use `isLoading` from the hook)
3. Remove manual error handling (use `error` from the hook)
4. Add cache invalidation after mutations
5. Remove manual refetch functions (use `mutate` from the hook)

### Before (without caching):

```typescript
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await adminApi.users.getUsers()
      setData(response.data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])
```

### After (with caching):

```typescript
const { data, isLoading, error } = useUsers()
```

Much simpler and more efficient!
