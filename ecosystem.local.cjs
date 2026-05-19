const path = require("path");

const root = __dirname;

module.exports = {
  apps: [
    {
      name: "chabaqa-backend-dev",
      cwd: path.join(root, "backend"),
      script: path.join(root, "backend", "node_modules", ".bin", "nest.cmd"),
      args: "start --watch",
      interpreter: "none",
      env: {
        PORT: 3000,
        HOST: "0.0.0.0",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: "chabaqa-frontend-dev",
      cwd: path.join(root, "frontend"),
      script: "npm.cmd",
      args: "run dev",
      interpreter: "none",
      env: {
        PORT: 8080,
        NEXT_PUBLIC_API_URL: "http://localhost:3000/api",
        API_INTERNAL_URL: "http://localhost:3000/api",
        NEXT_PUBLIC_APP_URL: "http://localhost:8080",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
