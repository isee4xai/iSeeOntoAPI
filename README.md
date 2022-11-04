### iSee Onto API

🚧 Under Construction 🚧

### Endpoints Available

#### `GET` Queries

```
SC - Top level sub classes only
SN - Sub classes with children
IN - Instances
```

| Ontology Concept | Endpoint | Parent Class  | Usage |
| ----------- | ----------- | ----------- | ----------- |
| AITask (SN)  | `/api/onto/AITask` | <https://purl.org/heals/eo#AITask> | Cockpit | 
| AIMethod (SN) | `/api/onto/AIMethod` | <https://purl.org/heals/eo#ArtificialIntelligenceMethod> | Cockpit | 
| KnowledgeLevel (IN) | `/api/onto/KnowledgeLevel` | <http://www.w3id.org/iSeeOnto/user#KnowledgeLevel>  | Cockpit |

🚧 Ongoing Development 🚧

### Response Model

#### For Instances (IN)
`key` and `label` 

#### For Classes (SC & SN)
`key`, `label`, `parent` and `children` 

#### Sample Response
```json
[
  {
    "key":"https://purl.org/heals/eo#ArtificialIntelligenceMethod",
    "label":"AI Method",
    "parent":"http://www.w3id.org/iSeeOnto/user#UserQuestionTarget",
    "children": [ ]
  },
  {
  }
]
```


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

