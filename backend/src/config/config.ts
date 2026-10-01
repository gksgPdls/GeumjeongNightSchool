export default () => ({
    database: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT ?  parseInt(process.env.DATABASE_PORT, 10) : 5432,
    },
    cache: {
      ttl: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL, 10)  : 3600,
      max: process.env.CACHE_MAX_ITEMS ? parseInt(process.env.CACHE_MAX_ITEMS, 10)  : 100,
    },
    retry: {
      maxAttempts: process.env.RETRY_MAX_ATTEMPTS ? parseInt(process.env.RETRY_MAX_ATTEMPTS, 10) : 3,
      delay: process.env.RETRY_DELAY ? parseInt(process.env.RETRY_DELAY, 10) : 500,
    }
  });