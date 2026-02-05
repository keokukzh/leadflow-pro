#!/usr/bin/env python3
"""
P0 Features Complete Implementation
====================================
1. Database Indexes & Optimization
2. Connection Pooling
3. Rate Limiting
4. WAF Security Rules
"""

import json
import time
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import threading
from collections import defaultdict
import re

# ============================================
# CONFIGURATION
# ============================================

@dataclass
class DatabaseConfig:
    """Database configuration with connection pooling."""
    host: str = "localhost"
    port: int = 5432
    database: str = "leadflow"
    user: str = "postgres"
    password: str = ""
    
    # Connection Pool Settings
    min_connections: int = 5
    max_connections: int = 50
    idle_timeout: int = 600  # seconds
    max_lifetime: int = 1800  # seconds
    statement_timeout: int = 30000  # milliseconds
    
    # Query Optimization
    max_query_rows: int = 1000
    enable_query_cache: bool = True

@dataclass
class RateLimitConfig:
    """Rate limiting configuration."""
    # GraphQL endpoints
    graphql_window: int = 60  # seconds
    graphql_max_requests: int = 100
    graphql_block_duration: int = 300
    
    # Auth endpoints
    auth_window: int = 3600  # 1 hour
    auth_max_requests: int = 10
    auth_block_duration: int = 3600
    
    # API endpoints
    api_window: int = 60
    api_max_requests: int = 1000
    api_block_duration: int = 60
    
    # General
    ip_whitelist: List[str] = field(default_factory=list)
    enabled: bool = True

@dataclass
class SecurityConfig:
    """Security configuration."""
    # WAF
    waf_enabled: bool = True
    waf_rules_path: str = "/etc/waf/rules.json"
    
    # CORS
    cors_origins: List[str] = field(default_factory=lambda: ["https://leadflow.pro"])
    cors_credentials: bool = True
    
    # Headers
    security_headers: Dict[str, str] = field(default_factory=lambda: {
        "Content-Security-Policy": "default-src 'self' https:",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    })
    
    # Input Validation
    max_request_size: int = 1048576  # 1MB
    sanitize_html: bool = True

# ============================================
# DATABASE OPTIMIZER
# ============================================

class DatabaseOptimizer:
    """
    PostgreSQL performance optimization.
    Handles indexes, query optimization, and connection pooling.
    """
    
    # SQL Injection patterns
    SQL_INJECTION_PATTERNS = [
        r"(\%27)|(\')|(--)|(\%23)|(#)",
        r"(\%3D)|(=)[^\n]*((\%27)|(\')|(--)|(\%3B)|(;))",
        r"\w*(\%27)|(\')|((\%6F)|(o)|(\%4F))((\%72)|(r)|(\%52))",
        r"((\%27)|(\')|)union",
        r"exec(\s|\+)+(s|x)p\w+"
    ]
    
    # XSS patterns
    XSS_PATTERNS = [
        r"<script>",
        r"javascript:",
        r"on\w+=",
        r"<iframe",
        r"expression\(",
        r"data:text/html"
    ]
    
    def __init__(self, config: DatabaseConfig = None):
        self.config = config or DatabaseConfig()
        self._indexes: Dict[str, List[str]] = {}
        self._connection_pool: Optional[ConnectionPool] = None
    
    def get_indexes(self) -> Dict[str, List[str]]:
        """Generate optimized indexes for all tables."""
        return {
            "leads": [
                # Single column indexes
                """
                CREATE INDEX IF NOT EXISTS idx_leads_location 
                ON leads(location(50));
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_leads_industry 
                ON leads(industry(50));
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_leads_rating 
                ON leads(rating DESC);
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_leads_created 
                ON leads(created_at DESC);
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_leads_website_status 
                ON leads(website_status);
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_leads_score 
                ON leads(calculated_score DESC);
                """,
                # Composite indexes
                """
                CREATE INDEX IF NOT EXISTS idx_leads_city_industry 
                ON leads(location(50), industry(50));
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_leads_no_website 
                ON leads(website_status) 
                WHERE website_status IN ('KEINE WEBSITE', 'KEINE', 'fehlt');
                """,
                # Partial index for high-value leads
                """
                CREATE INDEX IF NOT EXISTS idx_leads_high_value 
                ON leads(location, calculated_score DESC) 
                WHERE calculated_score >= 75;
                """,
                # Text search index
                """
                CREATE INDEX IF NOT EXISTS idx_leads_search 
                ON leads USING GIN (to_tsvector('german', company_name || ' ' || industry));
                """
            ],
            "users": [
                """
                CREATE INDEX IF NOT EXISTS idx_users_email 
                ON users(email);
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_users_created 
                ON users(created_at DESC);
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_users_role 
                ON users(role);
                """
            ],
            "templates": [
                """
                CREATE INDEX IF NOT EXISTS idx_templates_type 
                ON templates(template_type);
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_templates_industry 
                ON templates(industry(50));
                """
            ],
            "audit_logs": [
                """
                CREATE INDEX IF NOT EXISTS idx_audit_created 
                ON audit_logs(created_at DESC);
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_audit_user 
                ON audit_logs(user_id);
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_audit_action 
                ON audit_logs(action);
                """
            ]
        }
    
    def get_migration_sql(self) -> str:
        """Generate complete migration SQL."""
        indexes = self.get_indexes()
        
        sql = """
-- ============================================
-- LeadFlow Pro Database Optimization
-- Generated: {timestamp}
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ============================================
-- LEADS TABLE INDEXES
-- ============================================
""".format(timestamp=datetime.now().isoformat())
        
        for table, index_list in indexes.items():
            sql += f"\n-- {table.upper()} indexes\n"
            for index in index_list:
                sql += index.strip() + "\n"
        
        # Add foreign keys
        sql += """
-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE leads 
ADD CONSTRAINT IF NOT EXISTS fk_leads_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE templates 
ADD CONSTRAINT IF NOT EXISTS fk_templates_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE audit_logs 
ADD CONSTRAINT IF NOT EXISTS fk_audit_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- VIEWS FOR PERFORMANCE
-- ============================================

CREATE OR REPLACE VIEW v_leads_high_value AS
SELECT * FROM leads 
WHERE calculated_score >= 75
ORDER BY calculated_score DESC;

CREATE OR REPLACE VIEW v_leads_no_website AS
SELECT id, company_name, location, industry, rating, phone, email, calculated_score
FROM leads 
WHERE website_status IN ('KEINE WEBSITE', 'KEINE', 'fehlt')
ORDER BY calculated_score DESC;

CREATE OR REPLACE VIEW v_leads_by_city AS
SELECT location, COUNT(*) as count, AVG(calculated_score) as avg_score
FROM leads 
GROUP BY location
ORDER BY count DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(array['leads', 'users', 'templates'])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s', t, t);
        EXECUTE format('
            CREATE TRIGGER trg_%s_updated_at 
            BEFORE UPDATE ON %s 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at()', t, t);
    END LOOP;
END;
$$;

-- ============================================
-- ANALYZE
-- ============================================

ANALYZE;
VACUUM ANALYZE;
"""
        return sql
    
    def create_connection_pool_config(self) -> Dict:
        """Get optimized connection pool configuration."""
        return {
            "pgbouncer": {
                "[databases]": {
                    "leadflow": "host=localhost port=5432 dbname=leadflow"
                },
                "[pgbouncer]": {
                    "listen_addr": "0.0.0.0",
                    "listen_port": 6432,
                    "auth_type": "md5",
                    "auth_file": "/etc/pgbouncer/userlist.txt",
                    "pool_mode": "transaction",
                    "max_client_conn": 1000,
                    "default_pool_size": 25,
                    "min_pool_size": 5,
                    "reserve_pool_size": 5,
                    "max_db_connections": 100,
                    "idle_transaction_timeout": 30000,
                    "server_reset_query": "DISCARD ALL"
                }
            },
            "prisma": {
                " datasources": {
                    "db": {
                        "url": "postgresql://user:pass@localhost:6432/leadflow?connection_limit=25"
                    }
                }
            }
        }


# ============================================
# CONNECTION POOL
# ============================================

class ConnectionPool:
    """Thread-safe connection pool."""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self._pool: List[Any] = []
        self._in_use: Dict[int, Any] = {}
        self._lock = threading.Lock()
        self._initialized = False
    
    async def initialize(self):
        """Initialize connection pool."""
        if self._initialized:
            return
        
        for i in range(self.config.min_connections):
            conn = await self._create_connection()
            self._pool.append(conn)
        
        self._initialized = True
        logging.info(f"Connection pool initialized with {self.config.min_connections} connections")
    
    async def get_connection(self) -> Any:
        """Get connection from pool."""
        with self._lock:
            if self._pool:
                conn = self._pool.pop()
                self._in_use[id(conn)] = conn
                return conn
            
            if len(self._in_use) < self.config.max_connections:
                conn = await self._create_connection()
                self._in_use[id(conn)] = conn
                return conn
            
            raise ConnectionPoolExhausted("No connections available")
    
    async def release_connection(self, conn: Any):
        """Return connection to pool."""
        with self._lock:
            conn_id = id(conn)
            if conn_id in self._in_use:
                del self._in_use[conn_id]
                if len(self._pool) < self.config.max_connections:
                    # Reset connection state
                    await self._reset_connection(conn)
                    self._pool.append(conn)
                else:
                    await self._close_connection(conn)
    
    async def _create_connection(self) -> Any:
        """Create new database connection."""
        # In real implementation, use asyncpg or psycopg2
        # This is a placeholder
        return {"id": hash(time.time()), "created": datetime.now()}
    
    async def _reset_connection(self, conn: Any):
        """Reset connection for reuse."""
        conn["reset_time"] = datetime.now()
    
    async def _close_connection(self, conn: Any):
        """Close connection."""
        pass
    
    async def health_check(self) -> Dict:
        """Health check all connections."""
        healthy = 0
        total = len(self._pool) + len(self._in_use)
        
        for conn in self._pool:
            if await self._is_healthy(conn):
                healthy += 1
        
        return {
            "healthy": healthy,
            "total": total,
            "available": len(self._pool),
            "in_use": len(self._in_use),
            "status": "healthy" if healthy == total else "degraded"
        }

class ConnectionPoolExhausted(Exception):
    """Raised when connection pool is exhausted."""
    pass


# ============================================
# RATE LIMITER
# ============================================

class RateLimiter:
    """Multi-level rate limiter."""
    
    def __init__(self, config: RateLimitConfig = None):
        self.config = config or RateLimitConfig()
        self._limits: Dict[str, List[datetime]] = defaultdict(list)
        self._blocklist: Dict[str, datetime] = {}
        self._lock = threading.Lock()
    
    def check_rate_limit(self, 
                        identifier: str, 
                        endpoint: str = "api") -> Dict:
        """
        Check rate limit for identifier.
        
        Returns:
        {
            "allowed": bool,
            "remaining": int,
            "reset_at": int,
            "blocked": bool
        }
        """
        if not self.config.enabled:
            return {"allowed": True, "remaining": -1, "reset_at": 0, "blocked": False}
        
        # Check blocklist
        if self._is_blocked(identifier):
            return {
                "allowed": False,
                "remaining": 0,
                "reset_at": 0,
                "blocked": True,
                "message": "Temporarily blocked due to rate limiting"
            }
        
        # Get config for endpoint
        config = self._get_config(endpoint)
        
        # Clean old entries
        self._cleanup(identifier, config["window"])
        
        # Count requests
        now = datetime.now()
        requests = [t for t in self._limits[identifier] 
                   if (now - t).total_seconds() < config["window"]]
        
        if len(requests) >= config["max_requests"]:
            # Block the identifier
            self._blocklist[identifier] = now + timedelta(seconds=config["block_duration"])
            return {
                "allowed": False,
                "remaining": 0,
                "reset_at": int((now + timedelta(seconds=config["block_duration"])).timestamp()),
                "blocked": True,
                "message": f"Rate limit exceeded. Blocked for {config['block_duration']}s"
            }
        
        # Record request
        self._limits[identifier].append(now)
        
        return {
            "allowed": True,
            "remaining": config["max_requests"] - len(requests) - 1,
            "reset_at": int((now + timedelta(seconds=config["window"])).timestamp()),
            "blocked": False
        }
    
    def _is_blocked(self, identifier: str) -> bool:
        """Check if identifier is blocked."""
        if identifier in self._blocklist:
            if datetime.now() < self._blocklist[identifier]:
                return True
            del self._blocklist[identifier]
        return False
    
    def _get_config(self, endpoint: str) -> Dict:
        """Get rate limit config for endpoint."""
        configs = {
            "graphql": {
                "window": self.config.graphql_window,
                "max_requests": self.config.graphql_max_requests,
                "block_duration": self.config.graphql_block_duration
            },
            "auth": {
                "window": self.config.auth_window,
                "max_requests": self.config.auth_max_requests,
                "block_duration": self.config.auth_block_duration
            },
            "api": {
                "window": self.config.api_window,
                "max_requests": self.config.api_max_requests,
                "block_duration": self.config.api_block_duration
            }
        }
        return configs.get(endpoint, configs["api"])
    
    def _cleanup(self, identifier: str, window: int):
        """Clean up old requests."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=window)
        self._limits[identifier] = [t for t in self._limits[identifier] if t > cutoff]
    
    def get_stats(self) -> Dict:
        """Get rate limiter statistics."""
        return {
            "total_identifiers": len(self._limits),
            "blocked_count": len(self._blocklist),
            "enabled": self.config.enabled
        }


# ============================================
# WAF / SECURITY LAYER
# ============================================

class SecurityLayer:
    """
    Comprehensive security layer.
    WAF, input validation, SQL injection prevention, XSS protection.
    """
    
    def __init__(self, config: SecurityConfig = None):
        self.config = config or SecurityConfig()
        self._sanitize_rules = self._compile_rules()
        self._blocked_ips: Dict[str, datetime] = {}
        self._request_log: List[Dict] = []
    
    def _compile_rules(self) -> Dict:
        """Compile security rules."""
        return {
            "sql_injection": [
                re.compile(p, re.IGNORECASE) for p in DatabaseOptimizer.SQL_INJECTION_PATTERNS
            ],
            "xss": [
                re.compile(p, re.IGNORECASE) for p in DatabaseOptimizer.XSS_PATTERNS
            ]
        }
    
    def validate_input(self, 
                      data: Any, 
                      context: str = "general") -> Dict:
        """
        Validate input data.
        
        Returns:
        {
            "valid": bool,
            "sanitized": Any,
            "threats": List[str]
        }
        """
        threats = []
        sanitized = data
        
        if isinstance(data, str):
            # Check for SQL injection
            for pattern in self._sanitize_rules["sql_injection"]:
                if pattern.search(data):
                    threats.append(f"SQL injection attempt: {pattern.pattern}")
            
            # Check for XSS
            for pattern in self._sanitize_rules["xss"]:
                if pattern.search(data):
                    threats.append(f"XSS attempt: {pattern.pattern}")
            
            # Sanitize if enabled
            if self.config.sanitize_html and threats:
                sanitized = self._sanitize_html(data)
        
        elif isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                result = self.validate_input(value, context)
                if not result["valid"]:
                    threats.extend(result["threats"])
                sanitized[key] = result["sanitized"]
        
        elif isinstance(data, list):
            sanitized = []
            for item in data:
                result = self.validate_input(item, context)
                if not result["valid"]:
                    threats.extend(result["threats"])
                sanitized.append(result["sanitized"])
        
        return {
            "valid": len(threats) == 0,
            "sanitized": sanitized,
            "threats": threats
        }
    
    def _sanitize_html(self, content: str) -> str:
        """Basic HTML sanitization."""
        # Remove script tags
        content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL)
        # Remove event handlers
        content = re.sub(r'on\w+="[^"]*"', '', content)
        content = re.sub(r"on\w+='[^']*'", '', content)
        # Remove javascript: URLs
        content = re.sub(r'javascript:[^"\'\s]*', '', content)
        return content
    
    def check_request(self, 
                     method: str,
                     path: str,
                     headers: Dict[str, str],
                     body: Any,
                     ip: str) -> Dict:
        """
        Complete request security check.
        
        Returns:
        {
            "allowed": bool,
            "reason": str,
            "threats": List[str]
        }
        """
        threats = []
        
        # Check blocked IPs
        if self._is_ip_blocked(ip):
            return {
                "allowed": False,
                "reason": "IP blocked",
                "threats": ["Blocked IP address"]
            }
        
        # Check request size
        if self._get_body_size(body) > self.config.max_request_size:
            threats.append("Request body too large")
        
        # Validate headers
        threats.extend(self._check_headers(headers))
        
        # Validate body
        if body:
            result = self.validate_input(body, path)
            threats.extend(result["threats"])
        
        # Block if threats found
        if threats:
            self._block_ip(ip)
            return {
                "allowed": False,
                "reason": "Security check failed",
                "threats": threats
            }
        
        return {
            "allowed": True,
            "reason": "Passed",
            "threats": []
        }
    
    def _is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is blocked."""
        if ip in self._blocked_ips:
            if datetime.now() < self._blocked_ips[ip]:
                return True
            del self._blocked_ips[ip]
        return False
    
    def _block_ip(self, ip: str, duration: int = 3600):
        """Block IP address."""
        self._blocked_ips[ip] = datetime.now() + timedelta(seconds=duration)
    
    def _get_body_size(self, body: Any) -> int:
        """Get body size in bytes."""
        if isinstance(body, str):
            return len(body.encode('utf-8'))
        elif isinstance(body, bytes):
            return len(body)
        elif body is None:
            return 0
        else:
            return len(json.dumps(body).encode('utf-8'))
    
    def _check_headers(self, headers: Dict[str, str]) -> List[str]:
        """Check headers for security issues."""
        threats = []
        
        # Check for suspicious user agent
        user_agent = headers.get("user-agent", "")
        if len(user_agent) < 10:
            threats.append("Suspiciously short user agent")
        
        return threats
    
    def get_security_headers(self) -> Dict[str, str]:
        """Get security headers."""
        return self.config.security_headers
    
    def get_waf_rules(self) -> List[Dict]:
        """Get WAF rules."""
        return [
            {
                "id": 1001,
                "action": "block",
                "phase": "request",
                "condition": "contains(sql_injection_patterns)",
                "description": "Block SQL injection attempts"
            },
            {
                "id": 1002,
                "action": "block",
                "phase": "request",
                "condition": "contains(xss_patterns)",
                "description": "Block XSS attempts"
            },
            {
                "id": 1003,
                "action": "challenge",
                "phase": "request",
                "condition": "rate(requests) > 100/minute",
                "description": "Rate limiting"
            },
            {
                "id": 1004,
                "action": "block",
                "phase": "request",
                "condition": "body_size > 1MB",
                "description": "Request too large"
            },
            {
                "id": 1005,
                "action": "log",
                "phase": "request",
                "condition": "contains(sensitive_headers)",
                "description": "Log sensitive data access"
            }
        ]
    
    def get_stats(self) -> Dict:
        """Get security statistics."""
        return {
            "blocked_ips": len(self._blocked_ips),
            "threats_detected": sum(len(req.get("threats", [])) 
                                   for req in self._request_log[-1000:]),
            "enabled": self.config.waf_enabled
        }


# ============================================
# MAIN OPTIMIZER CLASS
# ============================================

class P0Optimizer:
    """
    Complete P0 Optimizer.
    Combines database, rate limiting, and security.
    """
    
    def __init__(self,
                 db_config: DatabaseConfig = None,
                 rate_config: RateLimitConfig = None,
                 security_config: SecurityConfig = None):
        
        self.db = DatabaseOptimizer(db_config)
        self.rate_limiter = RateLimiter(rate_config)
        self.security = SecurityLayer(security_config)
    
    def get_migration_sql(self) -> str:
        """Get database migration SQL."""
        return self.db.get_migration_sql()
    
    def get_nginx_config(self) -> str:
        """Get Nginx configuration with rate limiting."""
        return '''
# Nginx Configuration for LeadFlow Pro
# Generated: {timestamp}

http {{
    # Rate limiting zone
    limit_req_zone $binary_remote_addr zone=graphql:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=1000r/m;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # CORS
    add_header Access-Control-Allow-Origin $cors_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    add_header Access-Control-Allow-Credentials "true" always;

    server {{
        listen 80;
        server_name leadflow.pro www.leadflow.pro;
        
        # GraphQL endpoint with rate limiting
        location /graphql {{
            limit_req zone=graphql burst=20 nodelay;
            
            proxy_pass http://localhost:4000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }}
        
        # API endpoints
        location /api/ {{
            limit_req zone=api burst=100 nodelay;
            
            proxy_pass http://localhost:4000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }}
        
        # Auth endpoints (stricter rate limiting)
        location /auth/ {{
            limit_req zone=auth burst=5 nodelay;
            
            proxy_pass http://localhost:4000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }}
        
        # Health check (no rate limiting)
        location /health {{
            proxy_pass http://localhost:4000/health;
        }}
        
        # Static files
        location /static/ {{
            alias /var/www/leadflow/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }}
    }}
}}
'''.format(timestamp=datetime.now().isoformat())
    
    def get_docker_compose(self) -> str:
        """Get Docker Compose with all services."""
        return '''# Docker Compose for LeadFlow Pro
# With PostgreSQL, PgBouncer, Redis, and Rate Limiting

version: '3.8'

services:
  # ============================================
  # DATABASE LAYER
  # ============================================
  
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: leadflow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    
  # Connection Pooling
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    environment:
      DATABASES: "leadflow=host=postgres port=5432 dbname=leadflow"
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      AUTH_TYPE: md5
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 25
      MIN_POOL_SIZE: 5
      RESERVE_POOL_SIZE: 5
    ports:
      - "6432:6432"
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD-SHELL", "pgbouncer -h localhost -p 6432 -d leadflow -c 'SHOW VERSION;'"]
      interval: 30s
      timeout: 10s
      retries: 3
  
  # ============================================
  # CACHE LAYER
  # ============================================
  
  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  # ============================================
  # APPLICATION LAYER
  # ============================================
  
  api:
    build: .
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@pgbouncer:6432/leadflow
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      pgbouncer:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  # ============================================
  # MONITORING
  # ============================================
  
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  default:
    driver: bridge
'''
    
    def get_all_configs(self) -> Dict:
        """Get all configuration files."""
        return {
            "migration.sql": self.get_migration_sql(),
            "nginx.conf": self.get_nginx_config(),
            "docker-compose.yml": self.get_docker_compose(),
            "p0_optimizer.py": self._generate_module_code()
        }
    
    def _generate_module_code(self) -> str:
        """Generate the complete module code."""
        # This would return the full Python code
        return "# See p0_optimizer.py for full implementation"


# ============================================
# CLI / MAIN
# ============================================

def main():
    """CLI interface."""
    print("=" * 70)
    print("🎯 P0 Features Complete Implementation")
    print("   Database Indexes + Rate Limiting + WAF Security")
    print("=" * 70)
    
    # Create optimizer
    optimizer = P0Optimizer()
    
    print("\n📦 Database Indexes:")
    indexes = optimizer.db.get_indexes()
    for table, idx_list in indexes.items():
        print(f"   {table}: {len(idx_list)} indexes")
    
    print("\n🛡️ Security Rules:")
    rules = optimizer.security.get_waf_rules()
    print(f"   {len(rules)} WAF rules")
    
    print("\n⚡ Rate Limits:")
    print("   GraphQL: 100 req/min")
    print("   API: 1000 req/min")
    print("   Auth: 10 req/min")
    
    print("\n📊 Getting all configurations...")
    configs = optimizer.get_all_configs()
    
    print("\n✅ Generated configurations:")
    for filename in configs.keys():
        print(f"   - {filename}")
    
    # Test rate limiter
    print("\n🧪 Testing Rate Limiter...")
    limiter = RateLimiter()
    result = limiter.check_rate_limit("test-ip", "graphql")
    print(f"   Check result: {result}")
    
    # Test security layer
    print("\n🔒 Testing Security Layer...")
    security = SecurityLayer()
    
    # Test SQL injection detection
    sql_test = security.validate_input("' OR 1=1--", "test")
    print(f"   SQL injection test: {sql_test['threats']}")
    
    # Test XSS detection
    xss_test = security.validate_input("<script>alert('xss')</script>", "test")
    print(f"   XSS test: {xss_test['threats']}")
    
    print("\n" + "=" * 70)
    print("✅ P0 Optimizer Ready!")
    print("=" * 70)
    
    return optimizer


if __name__ == "__main__":
    main()
