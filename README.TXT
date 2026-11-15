ROLX
====

ROLX is a React storefront with a NestJS API and MongoDB. The store has
Damascus and Latakia catalogs, name search, collection and gender filters,
USD price sorting, cart, checkout, and contact. Staff tools cover branch
settings, administrator accounts, and central warehouse receipts.

1. Prerequisites
----------------

- Git, Node.js 24.14.1 and its bundled npm. Check with node --version
  and npm --version.
- Docker with the Compose plugin. Start Docker Desktop or the Docker
  Engine before running the Docker commands.
- A current browser with Web Locks support. Use http://localhost for
  local development and HTTPS for a hosted site.
- Internet access for the first dependency install, the MongoDB image,
  and optional photo downloads.
- Python 3.10 or newer only if you plan to use the MongoDB admin tool.

2. Clone and start MongoDB and the API
-------------------------------------

Run these commands in your first terminal:

  git clone --branch main https://github.com/moner005/react-Store.git
  cd react-Store
  cd server
  npm ci
  docker compose up -d mongo
  docker compose exec mongo mongosh --quiet --eval "db.runCommand({ping:1}).ok"

Wait for the MongoDB command to print 1. If the container is still
starting, run the command again. Then run:

  npm run seed:catalog
  npm run dev

Leave this terminal open. The API runs at http://localhost:5001.
Open http://localhost:5001/health to check the server, and
http://localhost:5001/ready to check its MongoDB connection.

The defaults work without a .env file. To change them, copy
server/.env.example to server/.env. From the server directory use
Copy-Item .env.example .env in PowerShell, or cp .env.example .env
in a Unix shell.

  PORT=5001
  HOST=127.0.0.1
  CLIENT_ORIGIN=http://localhost:5173
  MONGO_URI=mongodb://127.0.0.1:27017
  MONGO_DATABASE=react_store

With a running MongoDB instance of your own, set MONGO_URI and
MONGO_DATABASE before seeding and starting the API. Use the same
database for both commands. Docker Compose binds the development
database to loopback and stores its data in a named volume.

3. Start the frontend
---------------------

Open a second terminal at the cloned repository and run:

  cd client
  npm ci
  npm run dev -- --host localhost --port 5173 --strictPort

Open http://localhost:5173 in your browser. Use this exact origin
with the default API configuration. If you change the frontend host
or port, set CLIENT_ORIGIN on the API to the exact browser origin.
If you change the API URL, copy client/.env.example to client/.env
and set VITE_API_URL, for example:

  VITE_API_URL=http://localhost:5001

Restart the affected dev server after changing its environment file.

4. Download catalog photos
--------------------------

Run either command in a separate terminal from server/:

  npm run seed:photos -- --limit=24
  npm run seed:photos

Use the first command for a small photo sample or the second for the
full catalog. The full import downloads thousands of files and can
take several minutes. A later run reuses downloaded files. The
storefront displays a placeholder when a photo is unavailable.
Downloads go to server/assets/catalog/rolex/ and are served by NestJS.

The catalog seed imports 4,025 watch models and assigns each model to
one branch. It preserves existing prices and valid branch assignments
when rerun. For a previously seeded database or manually added catalog
records, run npm run catalog:assign-branches from server/ to populate
the branch and store browsing classifications. Men, Women, and Unisex
are store classifications based on collection.

5. Create accounts and try the workflows
----------------------------------------

Customer: open http://localhost:5173/register and create an account.
Shopping and browser checkout also work as a guest. Choose Store,
choose a branch, open a watch, add it to the cart, then select Checkout
and Confirm order. The latest receipt is stored in the browser and
can be opened across tabs on the same origin.

Owner: from server/, create or edit .env and set OWNER_NAME,
OWNER_EMAIL and OWNER_PASSWORD to values you choose. Use a valid
email and a password of 8 to 128 characters. Run:

  npm run owner:create

Sign in through http://localhost:5173/login. The owner dashboard links
to branch settings, administrator accounts, and the central warehouse.
Use Administrator accounts to create an admin for Damascus and an
admin for Latakia. Each admin can manage their assigned branch.
Keep owner credentials and any database exports out of source control.

The Contact form prepares a draft in the visitor's email app addressed
to rolex.syria@gmail.com. Branch stock counts and server-side order
history are future work. Warehouse receipts track central stock.

6. Verification and production builds
-------------------------------------

From client/:

  npm test
  npm run lint
  npm run typecheck
  npm run build

From server/:

  npm run typecheck
  npm test
  npm run build

Stop the development API before starting the compiled API on the
same port. Then run from server/:

  npm start

For a hosted frontend, set VITE_API_URL before building, serve
client/dist, and configure the host to serve index.html for SPA
routes. For the API, configure HOST, PORT, CLIENT_ORIGIN,
MONGO_URI, and MONGO_DATABASE for that environment, then run npm
start from server/. Host the frontend and API on the same site for
session cookies, or route API traffic through a same-origin reverse
proxy. Provide the local catalog photo folder to the API if you want
to serve the downloaded photos there.

If the API starts and the catalog is empty, check /ready and confirm
the seed and API use the same MONGO_DATABASE. If requests fail in the
browser, check VITE_API_URL and CLIENT_ORIGIN. If a port is in use,
stop the process occupying it or update the matching configuration
on both sides. Stop MongoDB with docker compose stop mongo from
server/ when finished.

7. Optional MongoDB admin tool
------------------------------

From the repository root:

  python -m pip install -r server/tools/requirements.txt
  python server/tools/mongo_admin.py --db react_store collections
  python server/tools/mongo_admin.py --db react_store find catalog_models --limit 3
  python server/tools/mongo_admin.py --help

The tool uses the MONGO_URI shell variable when set and defaults to
mongodb://127.0.0.1:27017.
Bulk updates and deletes run as dry runs by default. Applying them
requires an expected match count and a new backup file. See README.md
for examples, docs/api-contract.md for API details, and
docs/project-analysis.md for the project record.
