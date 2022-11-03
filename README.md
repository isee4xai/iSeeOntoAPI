### iSee Onto API

🚧 Under Construction 🚧

### Endpoints Available

#### `GET` Queries

```
SC - Top level sub classes only
SN - Sub classes with children
IN - Instances
```

| Ontology Concept  | Endpoint  | Usage |
| ----------- | ----------- | ----------- |
| AITask (SN) | `/api/onto/AITask` | Cockpit | 
| KnowledgeLevel (IN) | `/api/onto/KnowledgeLevel`| Cockpit |

🚧 Ongoing Development 🚧


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

