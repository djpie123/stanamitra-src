import { createServer } from "http";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";
import { connect, getMongoClient } from "./auth.js";
import session from "express-session";
import MongoStore from "connect-mongo";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).slice(0, 60)}…`;
      }
      log(logLine);
    }
  });

  next();
});

export default async function runApp(setup) {
  
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err && err.stack ? err.stack : err);
  });
  process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled rejection at promise', p, 'reason:', reason);
  });
 
  try {
    const cfgPath = path.join(__dirname, "mongo-config.json");
    let cfg = {};
    if (fs.existsSync(cfgPath)) {
      try {
        cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) || {};
      } catch (err) {
        console.warn('Failed to parse mongo-config.json, falling back to defaults');
        cfg = {};
      }
    }
    if (fs.existsSync(cfgPath)) {
      
      try {
        log('Attempting to connect to MongoDB for session store');
        await connect();
        log('MongoDB connect promise resolved');
        const client = getMongoClient();
        if (client) {
          app.use(
            session({
              secret: cfg.sessionSecret || "dev-secret",
              resave: false,
              saveUninitialized: false,
              store: MongoStore.create({ clientPromise: Promise.resolve(client) }),
              cookie: { maxAge: 1000 * 60 * 60 * 24 * 7, httpOnly: true, secure: false, sameSite: 'lax' },
            })
          );
          log('Using Mongo-backed sessions');
        } else {
          
          app.use(session({ secret: cfg.sessionSecret || "dev-secret", resave: false, saveUninitialized: false, cookie: { maxAge: 1000 * 60 * 60 * 24 * 7, httpOnly: true, sameSite: 'lax' } }));
          log('Mongo client not available after connect; falling back to memory session');
        }
      } catch (err) {
        console.warn('Mongo connection failed while setting up sessions; using memory store.', err.message || err);
        app.use(session({ secret: cfg.sessionSecret || "dev-secret", resave: false, saveUninitialized: false }));
      }
    } else {
      
      app.use(session({ secret: "dev-secret", resave: false, saveUninitialized: false }));
    }
      } catch (err) {
       
        console.warn('Unexpected error while configuring sessions, falling back to memory store', err.message || err);
        app.use(session({ secret: cfg.sessionSecret || "dev-secret", resave: false, saveUninitialized: false, cookie: { maxAge: 1000 * 60 * 60 * 24 * 7, httpOnly: true, sameSite: 'lax' } }));
      }

  
  app.use((req, res, next) => {
    
    if (req.session && req.session.userEmail && req.session.userName) {
      res.locals.user = {
        name: req.session.userName,
        email: req.session.userEmail,
        wishlist: req.session.userWishlist || []
      };
    } else {
      res.locals.user = null;
    }
  
    res.locals.successMessage = req.session && req.session.successMessage ? req.session.successMessage : null;
    res.locals.errorMessage = req.session && req.session.errorMessage ? req.session.errorMessage : null;
    
    if (req.session) {
      delete req.session.successMessage;
      delete req.session.errorMessage;
    }
    next();
  });

    // Detect which image processing libs are available (helpful for Vercel/runtime debugging)
    (async function detectImageLibs() {
      try {
        const sharpModule = await import('sharp');
        log('Detected `sharp` available — server-side resizing will prefer sharp', 'startup');
      } catch (err) {
        try {
          const jimpModule = await import('jimp');
          log('Detected `jimp` available — using jimp as fallback for resizing', 'startup');
        } catch (err3) {
          log('No native image processing libraries detected (sharp/jimp). Falling back to base64 storage for images.', 'startup');
        }
      }
    })();

  const server = await registerRoutes(app);

  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    log(`Error handled: ${status} - ${message}`, 'express-error');
  });

  await setup(app, server);


  let port = 5000;
  try {
    const cfgPath = path.join(__dirname, "mongo-config.json");
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) || {};
      if (cfg.port) port = parseInt(cfg.port, 10);
    }
  } catch (err) {
    
  }
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
  server.on('error', (err) => {
    log(`Server error: ${err && err.message ? err.message : err}`,'server');
   
    process.exit(1);
  });
}
