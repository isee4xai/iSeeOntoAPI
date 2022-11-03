### iSee Onto API

🚧 Under Construction 🚧

### Endpoints Available

#### Queries

- KnowledgeLevel: `GET /api/onto/KnowledgeLevel`

🚧 Under Construction 🚧


### Setup

```
npm install
```

Create a .env file and change the DB connection string as required

```
npm start
```

## Docker Setup

```
docker build -f Dockerfile.dev -t isee4xai/ontoapi:dev .

docker-compose  --file docker-compose.dev.yml up -d --build
```

