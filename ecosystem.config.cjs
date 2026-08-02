module.exports = {
  apps: [
    {
      name: 'agent-consigner-api',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'api/index.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        OKX_AGENT_ID: '5859',
        FIREBASE_API_KEY: 'AIzaSyDKTOg2HA8RznXA2BSa0Tt3EnamGKX8CRQ',
        FIREBASE_AUTH_DOMAIN: 'verdict-hackathon.firebaseapp.com',
        FIREBASE_DATABASE_URL: 'https://verdict-hackathon-default-rtdb.europe-west1.firebasedatabase.app',
        FIREBASE_PROJECT_ID: 'verdict-hackathon',
        FIREBASE_STORAGE_BUCKET: 'verdict-hackathon.firebasestorage.app',
        FIREBASE_MESSAGING_SENDER_ID: '20008028767',
        FIREBASE_APP_ID: '1:20008028767:web:8b37869b380668423929ea',
        VITE_FIREBASE_API_KEY: 'AIzaSyDKTOg2HA8RznXA2BSa0Tt3EnamGKX8CRQ',
        VITE_FIREBASE_AUTH_DOMAIN: 'verdict-hackathon.firebaseapp.com',
        VITE_FIREBASE_DATABASE_URL: 'https://verdict-hackathon-default-rtdb.europe-west1.firebasedatabase.app',
        VITE_FIREBASE_PROJECT_ID: 'verdict-hackathon',
        VITE_FIREBASE_STORAGE_BUCKET: 'verdict-hackathon.firebasestorage.app',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '20008028767',
        VITE_FIREBASE_APP_ID: '1:20008028767:web:8b37869b380668423929ea',
        ENABLE_A2A_DAEMON: 'true'
      }
    },
    {
      name: 'agent-consigner-watcher',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'scripts/task-watcher.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        OKX_AGENT_ID: '5859',
        POLL_INTERVAL_MS: 10000
      }
    }
  ]
};
