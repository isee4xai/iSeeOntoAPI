### iSee Onto API

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
| DataType (IN) | `/api/onto/KnowledgeLevel` | <http://www.w3id.org/iSeeOnto/explainer#DataType>  | Cockpit |
| AIModelAssessmentMetric (IN) | `/api/onto/AIModelAssessmentMetric` | <http://www.w3id.org/iSeeOnto/aimodelevaluation#AIModelAssessmentMetric>  | Cockpit |
| AIModelAssessmentDimension (IN) | `/api/onto/AIModelAssessmentDimension` | <http://www.w3id.org/iSeeOnto/aimodelevaluation#AIModelAssessmentDimension>  | Cockpit |
| Portability (IN) | `/api/onto/Portability` | <http://www.w3id.org/iSeeOnto/explainer#Portability>  | - |
| ExplainerConcurrentness (IN) | `/api/onto/ExplainerConcurrentness` | <http://www.w3id.org/iSeeOnto/explainer#ExplainerConcurrentness>  | - |
| ExplanationScope (IN) | `/api/onto/ExplanationScope` | <http://www.w3id.org/iSeeOnto/explainer#ExplanationScope>  | - |
| ExplanationTarget (IN) | `/api/onto/ExplanationTarget` | <http://www.w3id.org/iSeeOnto/explainer#ExplanationTarget>  | - |
| UserQuestionTarget (SN) | `/api/onto/UserQuestionTarget` | <http://www.w3id.org/iSeeOnto/user#UserQuestionTarget> | Cockpit | 
| UserDomain (SN) | `/api/onto/UserDomain` | <http://www.w3id.org/iSeeOnto/user#UserDomain> | Cockpit | 
| UserIntent (SN) | `/api/onto/UserIntent` | <http://www.w3id.org/iSeeOnto/user#UserIntent> | Cockpit | 
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

Create a .env file and change the `SPAQRL_ENDPOINT` connection string as required

```
npm start
```

## Docker Setup

```
docker build -f Dockerfile -t isee4xai/ontoapi:dev .

docker-compose  --file docker-compose.yml up -d --build
```

