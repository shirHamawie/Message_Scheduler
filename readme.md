# Message Scheduler System

A scalable, persistent message scheduling system built with Node.js, TypeScript, Express, and Redis.  
Messages can be scheduled for future delivery, and the system ensures reliable, distributed processing with Redis-based locking.

---

## Features

- **Schedule messages** to be printed at a specific time via HTTP API.
- **Persistent storage** using Redis (messages survive server restarts).
- **Distributed processing**: Multiple server instances can run schedulers concurrently without duplicate processing.
- **Atomic operations**: Ensures message removal is safe and consistent.
- **Flexible logging**: Inject your own logger.
- **Comprehensive tests** using Jest and Supertest.

---

## Project Structure

```
.
├── cacheStores/
│   └── redisCacheStore.ts
├── controllers/
│   └── APIController.ts
├── messageStores/
│   └── redisMessageStore.ts
├── schedulers/
│   └── messageScheduler.ts
├── services/
│   └── messageService.ts
├── tests/
│   └── app.test.ts
├── redisClient.ts
├── server.ts
├── types.ts
├── package.json
├── tsconfig.json
└── jest.config.js
```

---

## Installation

Install the required runtime and development dependencies:

```sh
npm install express ioredis uuid
npm install --save-dev typescript @types/node @types/express @types/uuid jest ts-jest @types/jest supertest @types/supertest
```

Then build the project:

```sh
npx tsc
```

---

## Running the Server

Make sure your Redis server is running locally or accessible remotely.

```sh
npx ts-node server.ts
```

The server will start on port 3000 by default.

---

## API Usage

**Schedule a message:**

```http
POST /echoAtTime
Content-Type: application/json

{
  "time": "2024-06-13T12:00:00Z",
  "message": "Hello future!"
}
```

- `time`: ISO string, timestamp, or Date-parsable value.
- `message`: The message to be printed at the scheduled time.

---

## Running Tests

```sh
npm test
```

---

## How It Works

- Messages are stored in Redis hashes, and their IDs are tracked in a sorted set by timestamp.
- A background scheduler polls for due messages and prints them (using the injected logger).
- Redis locks prevent duplicate processing when multiple schedulers are running.
- The API validates input and schedules messages for future delivery.
- All cache operations are abstracted via an interface, making the codebase extensible and testable.

---

## Customization

- **Logger**: Pass any logger implementing `{ log: (msg: string) => void, error: (msg: string) => void }` to `MessageScheduler`.
- **Scheduler interval**: Change the polling interval when constructing `MessageScheduler`.

---

---

## License

MIT