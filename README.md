### iSee Onto API

🚧 Under Construction 🚧

### Endpoints Available

#### Queries

`GET` Queries

SC - Top level sub classes only
SN - Sub classes with children
IN - Instances

- AITask (CC): `/api/onto/AITask`
- KnowledgeLevel (IN): `/api/onto/KnowledgeLevel`

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

