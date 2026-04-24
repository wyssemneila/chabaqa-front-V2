module.exports = {
  apps: [
    {
      name: "chabaqa-backend",
      cwd: "/home/ubuntu/chabaqa/backend",
      script: "dist/main.js",
      interpreter: "node",
      exec_mode: "fork",
      env_file: "/home/ubuntu/chabaqa/backend/.env",
      env: { NODE_ENV: "production", PORT: 3000, HOST: "0.0.0.0" },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    },
    {
      name: "chabaqa-frontend",
      cwd: "/home/ubuntu/chabaqa/frontend",
      script: ".next/standalone/server.js",
      interpreter: "node",
      exec_mode: "fork",
      env_file: "/home/ubuntu/chabaqa/frontend/.env",
      env: { NODE_ENV: "production", PORT: 8080, HOSTNAME: "0.0.0.0" },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    }
  ]
}
