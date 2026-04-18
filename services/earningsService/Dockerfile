FROM oven/bun:1.2

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "bun run apply:migrations && bun src/index.ts"]
