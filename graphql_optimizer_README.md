# 🎯 GraphQL Performance Optimizer

Complete implementation for GraphQL API performance optimization with N+1 prevention, caching, monitoring, and production hardening.

## 📁 Files

### Core Implementation
- `graphql_optimizer.py` - Complete Python implementation
  - DataLoader for batch loading
  - Multi-level caching (L1/L2)
  - Query complexity analysis
  - Performance monitoring
  - Circuit breaker pattern
  - Query optimization utilities

### React Components
- `src/components/graphql/PerformanceDashboard.tsx`
  - Real-time metrics dashboard
  - Circuit breaker status
  - Query analyzer
  - Configuration panel

## 🚀 Quick Start

```python
from graphql_optimizer import GraphQLEPerformanceOptimizer

# Create optimizer
optimizer = GraphQLEPerformanceOptimizer()

# Create DataLoader for batch loading
loader = optimizer.create_loader(
    "users",
    batch_fn=lambda ids: db.fetch_users(ids)
)

# Execute query with all optimizations
result = optimizer.execute_query(
    query="query { users { id name posts { title } }",
    execute_fn=lambda q, v: graphql.execute(q, variables=v)
)
```

## 📊 Features

### 1. DataLoader (N+1 Prevention)
```python
# Batch multiple requests into single DB query
loader = optimizer.create_loader("users", batch_fn)
await loader.load("user_id_1")  # Batched automatically
await loader.load("user_id_2")  # Combined with previous
```

### 2. Multi-Level Cache
```python
# L1: In-memory (fastest)
# L2: Redis (if configured)
cache = optimizer.cache
cache.set("key", value, ttl=300)  # Auto L1 + L2
```

### 3. Query Complexity Analysis
```python
# Analyze before execution
allowed, reason = optimizer.complexity_analyzer.should_allow(query)
# Enforce depth and complexity limits
```

### 4. Performance Monitoring
```python
# Real-time metrics
metrics = optimizer.monitor.get_metrics()
slow_queries = optimizer.monitor.get_slow_queries()
```

### 5. Circuit Breaker
```python
cb = optimizer.add_circuit_breaker(
    "database",
    failure_threshold=5,
    recovery_timeout_seconds=30
)
result = cb.call(database.query)
```

## 📈 Dashboard

The React dashboard provides:
- Real-time query metrics
- Slow query identification
- Cache hit rates
- Circuit breaker status
- Query complexity analysis
- Configuration panel

## ⚙️ Configuration

```python
query_config = QueryConfig(
    max_depth=7,
    max_complexity=100,
    enable_query_caching=True,
    enable_response_caching=True
)

cache_config = CacheConfig(
    default_ttl=300,
    local_cache_size=10000,
    redis_url="redis://localhost:6379"
)

monitoring_config = MonitoringConfig(
    slow_query_threshold_ms=1000,
    enable_alerting=True
)
```

## 🎯 Performance Metrics

| Metric | Description |
|--------|-------------|
| Execution Time | Total query processing duration |
| Resolver Count | Number of resolver calls |
| DB Queries | SQL/NoSQL operations |
| Cache Hit Rate | Effectiveness of caching |
| Memory Usage | Heap allocation |

## 🛡️ Production Features

1. **Circuit Breaker** - Fail-fast for cascade failure prevention
2. **Multi-level Cache** - L1 (memory) + L2 (Redis)
3. **Query Limits** - Depth and complexity enforcement
4. **Monitoring** - Real-time alerts and metrics
5. **Batch Loading** - N+1 prevention via DataLoader

## 📋 Scoring System

Query complexity scoring:
- **LOW**: < 10 points
- **MEDIUM**: 10-50 points  
- **HIGH**: 50-100 points
- **CRITICAL**: > 100 points

## 🔧 Integration

```python
# With Apollo Server
from graphql_optimizer import GraphQLEPerformanceOptimizer

optimizer = GraphQLEPerformanceOptimizer()

# Add to Apollo plugins
plugins = [
    optimization_plugin(optimizer),
    monitoring_plugin(optimizer)
]
```

## 📦 Stats

- `batches_executed`: Number of batch operations
- `cache_hits`: L1 cache hits
- `cache_misses`: Cache misses
- `total_loaded`: Items loaded via DataLoader

## 🎨 React Components

```tsx
import { PerformanceDashboard } from "./components/graphql/PerformanceDashboard";

<PerformanceDashboard optimizer={optimizer} />
```

## 📝 License

MIT
