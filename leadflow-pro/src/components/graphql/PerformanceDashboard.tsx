import { Lead } from "@/lib/actions/server-actions";

// ============================================
// 📊 PERFORMANCE DASHBOARD COMPONENT
// ============================================

interface PerformanceDashboardProps {
  optimizer: GraphQLPerformanceOptimizer;
}

export function PerformanceDashboard({ optimizer }: PerformanceDashboardProps) {
  const metrics = optimizer.get_dashboard_data();
  
  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8">📊 GraphQL Performance Dashboard</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard 
          title="Queries/min" 
          value={metrics.monitor.queries_per_second} 
          unit="/s"
          color="blue"
        />
        <MetricCard 
          title="Cache Hit Rate" 
          value={metrics.cache.hit_rate} 
          unit="%"
          color="green"
        />
        <MetricCard 
          title="Avg Response" 
          value={metrics.monitor.avg_execution_time_ms} 
          unit="ms"
          color="yellow"
        />
        <MetricCard 
          title="Error Rate" 
          value={metrics.monitor.error_rate} 
          unit="%"
          color="red"
        />
      </div>
      
      {/* Slow Queries */}
      <div className="bg-slate-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">🐌 Slow Queries</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-2">Query</th>
              <th className="pb-2">Time</th>
              <th className="pb-2">Complexity</th>
              <th className="pb-2">Cache</th>
            </tr>
          </thead>
          <tbody>
            {metrics.slow_queries.map((query, i) => (
              <tr key={i} className="border-t border-slate-700">
                <td className="py-2 font-mono text-sm">{query.operation}</td>
                <td className="py-2">{query.time_ms.toFixed(2)}ms</td>
                <td className="py-2">{query.complexity}</td>
                <td className="py-2">{query.cache_hit_rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Circuit Breakers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(metrics.circuit_breakers).map(([name, state]) => (
          <div 
            key={name}
            className={`p-4 rounded-xl border-2 ${
              state === 'closed' ? 'border-green-500 bg-green-500/10' :
              state === 'open' ? 'border-red-500 bg-red-500/10' :
              'border-yellow-500 bg-yellow-500/10'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold">{name}</span>
              <span className={`px-2 py-1 rounded text-sm ${
                state === 'closed' ? 'bg-green-500' :
                state === 'open' ? 'bg-red-500' : 'bg-yellow-500'
              }`}>
                {state.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, color }: { 
  title: string; 
  value: number; 
  unit: string;
  color: "blue" | "green" | "yellow" | "red";
}) {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500"
  };
  
  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <p className="text-slate-400 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold">
        {typeof value === 'number' ? value.toFixed(1) : value}
        <span className="text-lg text-slate-500 ml-1">{unit}</span>
      </p>
      <div className={`h-1 ${colors[color]} mt-2 rounded-full`} />
    </div>
  );
}

// ============================================
// 🎯 OPTIMIZED RESOLVERS
// ============================================

import { DataLoader } from "./dataloader";

interface OptimizedResolversProps {
  loaders: {
    users: DataLoader;
    posts: DataLoader;
    comments: DataLoader;
  };
}

export const optimizedResolvers = {
  Query: {
    users: async (parent, args, context, info) => {
      const requestedFields = extractRequestedFields(info);
      
      // Use DataLoader for batch loading
      const users = await context.loaders.users.loadMany(
        args.ids || []
      );
      
      // Filter to requested fields only
      return users.map(user => filterFields(user, requestedFields));
    },
    
    user: async (parent, { id }, context, info) => {
      return context.loaders.users.load(id);
    }
  },
  
  User: {
    posts: async (user, args, context, info) => {
      return context.loaders.postsByUserId.load(user.id);
    },
    
    profile: async (user, args, context, info) => {
      return context.loaders.profiles.load(user.profileId);
    }
  },
  
  Post: {
    author: async (post, args, context, info) => {
      return context.loaders.users.load(post.authorId);
    },
    
    comments: async (post, args, context, info) => {
      return context.loaders.commentsByPostId.load(post.id);
    }
  }
};

// Helper functions
function extractRequestedFields(info: any): Set<string> {
  const selections = info.fieldNodes[0].selectionSet.selections;
  const fields = new Set<string>();
  
  function traverse(sels: any[]) {
    for (const sel of sels) {
      if (sel.kind === 'Field') {
        fields.add(sel.name.value);
        if (sel.selectionSet) {
          traverse(sel.selectionSet.selections);
        }
      }
    }
  }
  
  traverse(selections);
  return fields;
}

function filterFields(obj: any, fields: Set<string>): any {
  if (!obj) return obj;
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (fields.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

// ============================================
// 🛡️ CIRCUIT BREAKER COMPONENT
// ============================================

interface CircuitBreakerProps {
  name: string;
  state: "closed" | "open" | "half_open";
  failureCount: number;
  lastFailure: string;
}

export function CircuitBreakerStatus({ name, state, failureCount, lastFailure }: CircuitBreakerProps) {
  return (
    <div className={`p-4 rounded-lg border-2 ${
      state === 'closed' ? 'border-green-500 bg-green-500/10' :
      state === 'open' ? 'border-red-500 bg-red-500/10' :
      'border-yellow-500 bg-yellow-500/10'
    }`}>
      <div className="flex justify-between items-center">
        <span className="font-bold">{name}</span>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            state === 'closed' ? 'bg-green-500' :
            state === 'open' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'
          }`} />
          <span className={`px-2 py-0.5 rounded text-xs ${
            state === 'closed' ? 'bg-green-500/20 text-green-400' :
            state === 'open' ? 'bg-red-500/20 text-red-400' : 
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {state.toUpperCase()}
          </span>
        </div>
      </div>
      {state === 'open' && (
        <p className="text-xs text-slate-400 mt-2">
          {failureCount} failures. Last: {lastFailure}
        </p>
      )}
    </div>
  );
}

// ============================================
// 📈 QUERY ANALYZER COMPONENT
// ============================================

interface QueryAnalyzerProps {
  query: string;
  variables?: Record<string, any>;
}

export function QueryAnalyzer({ query, variables }: QueryAnalyzerProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  
  useEffect(() => {
    // Analyze query on mount
    if (query) {
      analyzeGraphQLQuery(query, variables).then(setAnalysis);
    }
  }, [query, variables]);
  
  if (!analysis) {
    return <div className="p-4 text-slate-400">Analyzing query...</div>;
  }
  
  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="font-bold mb-4">📊 Query Analysis</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-slate-400 text-sm">Depth</p>
          <p className={`text-xl font-bold ${
            analysis.depth > 7 ? 'text-red-400' : 
            analysis.depth > 5 ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {analysis.depth}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Complexity</p>
          <p className={`text-xl font-bold ${
            analysis.complexity > 100 ? 'text-red-400' :
            analysis.complexity > 50 ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {analysis.complexity}
          </p>
        </div>
      </div>
      
      {analysis.warnings?.length > 0 && (
        <div className="mt-4">
          <p className="text-slate-400 text-sm mb-2">⚠️ Warnings</p>
          {analysis.warnings.map((warning: string, i: number) => (
            <p key={i} className="text-yellow-400 text-sm">• {warning}</p>
          ))}
        </div>
      )}
      
      <div className={`mt-4 p-3 rounded ${
        analysis.is_valid ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
      }`}>
        {analysis.is_valid ? '✅ Query Allowed' : `❌ ${analysis.reason}`}
      </div>
    </div>
  );
}

// ============================================
// 🎨 CONFIGURATION PANEL
// ============================================

interface OptimizerConfig {
  maxDepth: number;
  maxComplexity: number;
  cacheTtl: number;
  enableQueryCaching: boolean;
  enableResponseCaching: boolean;
}

export function OptimizerConfigPanel({ 
  config, 
  onChange 
}: { 
  config: OptimizerConfig;
  onChange: (config: OptimizerConfig) => void;
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="font-bold mb-4">⚙️ Optimizer Configuration</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Max Query Depth
          </label>
          <input
            type="range"
            min="3"
            max="15"
            value={config.maxDepth}
            onChange={(e) => onChange({
              ...config, 
              maxDepth: parseInt(e.target.value)
            })}
            className="w-full"
          />
          <p className="text-right text-slate-500 text-sm">{config.maxDepth}</p>
        </div>
        
        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Max Complexity Score
          </label>
          <input
            type="range"
            min="50"
            max="500"
            value={config.maxComplexity}
            onChange={(e) => onChange({
              ...config, 
              maxComplexity: parseInt(e.target.value)
            })}
            className="w-full"
          />
          <p className="text-right text-slate-500 text-sm">{config.maxComplexity}</p>
        </div>
        
        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Cache TTL (seconds)
          </label>
          <input
            type="number"
            value={config.cacheTtl}
            onChange={(e) => onChange({
              ...config, 
              cacheTtl: parseInt(e.target.value)
            })}
            className="w-full bg-slate-700 rounded px-3 py-2"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Query Caching</span>
          <button
            onClick={() => onChange({
              ...config,
              enableQueryCaching: !config.enableQueryCaching
            })}
            className={`w-12 h-6 rounded-full transition-colors ${
              config.enableQueryCaching ? 'bg-green-500' : 'bg-slate-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              config.enableQueryCaching ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Response Caching</span>
          <button
            onClick={() => onChange({
              ...config,
              enableResponseCaching: !config.enableResponseCaching
            })}
            className={`w-12 h-6 rounded-full transition-colors ${
              config.enableResponseCaching ? 'bg-green-500' : 'bg-slate-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              config.enableResponseCaching ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PerformanceDashboard;
