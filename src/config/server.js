import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { getUserFromAuthHeader } from './utils/auth.js';

async function start() {
  await connectDB();

  const app = express();

  // Security + CORS
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120
    })
  );

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    formatError(formattedError) {
      // Hide internal stack traces in production
      return formattedError;
    }
  });
  await apollo.start();

  app.use(
    '/graphql',
    bodyParser.json(),
    expressMiddleware(apollo, {
      context: async ({ req }) => {
        const user = await getUserFromAuthHeader(req.headers.authorization);
        return { user };
      }
    })
  );

  const httpServer = http.createServer(app);
  httpServer.listen(env.port, () => {
    console.log(`🚀 GraphQL ready at http://localhost:${env.port}/graphql`);
  });
}

start().catch((e) => {
  console.error('Server failed to start', e);
  process.exit(1);
});
