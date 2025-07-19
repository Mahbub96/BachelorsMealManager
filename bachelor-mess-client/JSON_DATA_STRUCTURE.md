# Bachelor Mess - JSON Data Structure

## Overview

The application now uses direct JSON file imports for data instead of API calls. This makes the app much faster and simpler to maintain.

## Data Files Location

All JSON data files are located in: `bachelor-mess-server/data/`

## File Structure

```
bachelor-mess-server/
├── data/
│   ├── analytics.json    # Charts and analytics data
│   ├── stats.json        # Dashboard statistics
│   └── activities.json   # Recent activities
```

## Data Structure

### 1. Analytics Data (`analytics.json`)

Contains all chart data organized by timeframe (week/month/year):

```json
{
  "mealDistribution": {
    "week": [...],
    "month": [...],
    "year": [...]
  },
  "expenseTrend": {
    "week": [...],
    "month": [...],
    "year": [...]
  },
  "categoryBreakdown": {
    "week": [...],
    "month": [...],
    "year": [...]
  },
  "monthlyProgress": {
    "current": 75,
    "target": 100
  }
}
```

### 2. Stats Data (`stats.json`)

Dashboard key metrics:

```json
{
  "totalMembers": 12,
  "monthlyExpense": 32400,
  "averageMeals": 2.4,
  "balance": 1200,
  "totalMeals": 156,
  "pendingPayments": 3,
  "monthlyBudget": 40000,
  "budgetUsed": 81
}
```

### 3. Activities Data (`activities.json`)

Recent activities with user information:

```json
[
  {
    "id": "1",
    "type": "meal",
    "title": "Breakfast Added",
    "description": "Rahim added breakfast for today",
    "time": "2 hours ago",
    "priority": "low",
    "amount": 120,
    "user": "Rahim",
    "icon": "🍽️"
  }
]
```

## Benefits

### ⚡ **Performance**

- **Instant loading** - No API calls or network delays
- **No server required** - Works offline
- **Fast data access** - Direct JSON imports

### 🛠️ **Maintenance**

- **Easy to update** - Just edit JSON files
- **Version control** - Track data changes in Git
- **No deployment** - No server setup needed

### 📊 **Flexibility**

- **Multiple timeframes** - Week/month/year data
- **Rich metadata** - Icons, users, priorities
- **Extensible** - Easy to add new data types

## How to Update Data

### 1. Edit JSON Files

Simply modify the JSON files in `bachelor-mess-server/data/`:

```bash
# Edit analytics data
nano bachelor-mess-server/data/analytics.json

# Edit stats
nano bachelor-mess-server/data/stats.json

# Edit activities
nano bachelor-mess-server/data/activities.json
```

### 2. Add New Timeframes

To add new timeframes (e.g., "quarter"), update `analytics.json`:

```json
{
  "mealDistribution": {
    "week": [...],
    "month": [...],
    "year": [...],
    "quarter": [...]  // New timeframe
  }
}
```

### 3. Add New Stats

To add new statistics, update `stats.json`:

```json
{
  "totalMembers": 12,
  "monthlyExpense": 32400,
  "newMetric": 100 // New stat
}
```

### 4. Add New Activities

To add new activities, update `activities.json`:

```json
[
  {
    "id": "7",
    "type": "new_type",
    "title": "New Activity",
    "description": "Description here",
    "time": "1 hour ago",
    "priority": "medium",
    "user": "User Name",
    "icon": "🎯"
  }
]
```

## API Service Usage

The `services/api.js` file now directly imports JSON data:

```javascript
import analyticsData from "../bachelor-mess-server/data/analytics.json";
import statsData from "../bachelor-mess-server/data/stats.json";
import activitiesData from "../bachelor-mess-server/data/activities.json";
```

## Component Integration

All components automatically use the JSON data:

- **ChartsSection**: Uses analytics data for charts
- **StatsCards**: Uses stats data for metrics
- **RecentActivity**: Uses activities data for feed
- **QuickActions**: Self-contained navigation

## Data Validation

The JSON files are validated by TypeScript interfaces in `hooks/useAnalytics.ts`:

```typescript
export interface AnalyticsData {
  mealDistribution: Array<{...}>;
  expenseTrend: Array<{...}>;
  categoryBreakdown: Array<{...}>;
  monthlyProgress: {...};
}
```

## Migration from API

If you want to switch back to API calls later:

1. Update `services/api.js` to use fetch/axios
2. Point to your API endpoints
3. Components will work without changes

## Best Practices

### 1. Data Organization

- Keep related data in the same file
- Use consistent naming conventions
- Include metadata (icons, users, timestamps)

### 2. Performance

- Keep JSON files reasonably sized
- Use arrays for list data
- Minimize nested objects

### 3. Maintenance

- Version control your JSON files
- Document data structure changes
- Test data updates in development

## Troubleshooting

### Data Not Loading

- Check JSON file syntax
- Verify file paths in imports
- Check TypeScript interfaces

### Charts Not Updating

- Ensure timeframe data exists
- Check data structure matches interface
- Verify chart component props

### Activities Not Showing

- Check activities array structure
- Verify required fields (id, title, etc.)
- Check priority and icon fields

## Conclusion

This JSON-based approach provides:

- ✅ **Lightning fast performance**
- ✅ **Zero server dependencies**
- ✅ **Easy data management**
- ✅ **Full offline capability**
- ✅ **Simple deployment**

The application is now completely self-contained with all data loaded directly from JSON files!
