module.exports = {
  apps: [
    {
      name: "opencode-web",
      cwd: "/home/ubuntu/chabaqa",
      script: "/root/.opencode/bin/opencode",
      args: [
        "serve",
        "--hostname",
        "127.0.0.1",
        "--port",
        "4096",
        "--cors",
        "https://opencode.chabaqa.io"
      ],
      interpreter: "none",
      env: {
        NODE_ENV: "production"
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    }
  ]
}
