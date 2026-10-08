# 🚀 CortexAI — Multi-Agent AI Workspace

> A production-oriented Multi-Agent AI Platform built with MERN, LangGraph, LangChain, RAG, Qdrant, Redis, Docker, and AWS.

CortexAI is a full-stack AI workspace that combines conversational AI, specialized AI agents, document intelligence, Retrieval-Augmented Generation (RAG), persistent memory, web search, tool calling, and real-time streaming into a single platform.

The application follows a modular microservice architecture where authentication, chat processing, and AI agent orchestration are separated into independent services.

---

## 🌐 Live Demo

**Live Application:**  
http://13.62.101.113:5174

**GitHub Repository:**  
https://github.com/Divyachauhan786/CortexAI

> Currently deployed on AWS EC2 using Docker Compose.

---

# ✨ Key Features

## 🤖 Multi-Agent AI System

CortexAI uses a supervisor-based architecture to analyze user requests and route them to specialized agents.

- Supervisor-based agent routing
- Chat Agent
- Coding Agent
- Web Search Agent
- RAG / Document Agent
- Tool calling
- Multi-step agent execution
- Context-aware responses
---
## 💬 AI Chat

The platform provides a persistent AI chat experience with:

- Real-time AI responses
- Conversation history
- MongoDB-backed message persistence
- Streaming responses using Server-Sent Events
- Context-aware conversations
- Persistent conversation memory
---
## 📄 Document Intelligence & RAG

Users can upload documents and ask questions about their content.

### Supported Formats

- PDF
- DOCX

### RAG Pipeline

```text
Document Upload
       ↓
Document Parsing
       ↓
Text Chunking
       ↓
Embedding Generation
       ↓
Qdrant Vector Storage
       ↓
Semantic Retrieval
       ↓
Relevant Context
       ↓
LLM
       ↓
Grounded Response

The system retrieves relevant document chunks before generating an answer, helping reduce hallucinations and keeping responses grounded in uploaded content.

🧠 Persistent AI Memory

CortexAI maintains useful conversation-related information using MongoDB.

The system can extract relevant memories from conversations and provide them as context for future interactions.

Conversation
     ↓
Memory Extraction
     ↓
MongoDB
     ↓
Future Conversation
     ↓
Relevant Memory Context
🔎 Web Search & Tool Calling

The agent system can determine when external information or tools are required.

Supported capabilities include:

Web search
Calculator/tool execution
Tool registry
LangGraph ToolNode
Multi-step tool workflows
🔐 Authentication

Authentication is implemented using:

Firebase Authentication
Google Sign-In
Firebase Admin SDK
HTTP-only session cookies
Redis-backed sessions
Protected backend routes
⚡ Streaming AI Responses

AI responses are streamed to the frontend using Server-Sent Events (SSE).

Instead of waiting for the complete response, users can see the AI response progressively as it is generated.

Frontend
   ↓
API Gateway
   ↓
Agent Service
   ↓
LangGraph
   ↓
LLM
   ↓
Streaming Response
   ↓
SSE
   ↓
Frontend
🏗️ System Architecture
                         ┌────────────────────┐
                         │      Frontend      │
                         │   React + Redux    │
                         └─────────┬──────────┘
                                   │
                                   ▼
                         ┌────────────────────┐
                         │    API Gateway     │
                         │      :8000         │
                         └─────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
             ┌────────────┐ ┌────────────┐ ┌────────────┐
             │    Auth    │ │    Chat    │ │   Agent    │
             │  Service   │ │  Service   │ │  Service   │
             │   :8001    │ │   :8002    │ │   :8003    │
             └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
                   │              │              │
                   ▼              ▼              ▼
                Redis          MongoDB        LangGraph
                                                 │
                                  ┌──────────────┼──────────────┐
                                  │              │              │
                                  ▼              ▼              ▼
                                Chat          Search         Coding
                                                              
                                                 │
                                                 ▼
                                               RAG
                                                 │
                                                 ▼
                                               Qdrant
🧠 Multi-Agent Architecture

The Agent Service uses LangGraph to orchestrate specialized agents.

                         User Query
                             │
                             ▼
                     ┌──────────────┐
                     │  Supervisor  │
                     └──────┬───────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
           CHAT           SEARCH         CODING
             │              │              │
             │              ▼              │
             │         Web Search          │
             │                             │
             │                             ▼
             │                         Code Tasks
             │
             ▼
       Conversation
          Context

                    ┌──────────────┐
                    │     RAG      │
                    └──────┬───────┘
                           │
                           ▼
                     Qdrant Search
                           │
                           ▼
                  Retrieved Context
                           │
                           ▼
                    Grounded Answer

The supervisor determines which specialized agent should handle the user's request.

📊 RAG Architecture
                ┌──────────────┐
                │  PDF / DOCX  │
                └──────┬───────┘
                       │
                       ▼
                Document Parser
                       │
                       ▼
                  Text Chunks
                       │
                       ▼
              Gemini Embeddings
                       │
                       ▼
                    Qdrant
                       │
                       ▼
                Vector Search
                       │
                       ▼
              Relevant Chunks
                       │
                       ▼
                LLM Context
                       │
                       ▼
                Final Answer

The system also applies user-scoped retrieval so that document context is associated with the correct user and document.

🗄️ Data & Infrastructure

Different technologies are used for different responsibilities.

MongoDB

Used for:

Users
Conversations
Messages
Persistent memory
Application data
Redis

Used for:

Authentication sessions
Session management
Fast temporary data access
Qdrant

Used for:

Document embeddings
Vector storage
Semantic similarity search
RAG retrieval
🛠️ Tech Stack
Frontend
React
Vite
Redux Toolkit
Axios
Firebase Authentication
Backend
Node.js
Express.js
MongoDB
Mongoose
Redis
AI / LLM
LangChain
LangGraph
Google Gemini
Groq
Tavily
RAG / Vector Search
Qdrant
Gemini Embeddings
Recursive Character Text Splitter
Semantic Search
Infrastructure
Docker
Docker Compose
Nginx
AWS EC2
📁 Project Structure
CortexAI/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── nginx.conf
│
├── services/
│   │
│   ├── gateway/
│   │   ├── src/
│   │   └── Dockerfile
│   │
│   ├── auth-service/
│   │   ├── src/
│   │   ├── credentials/
│   │   └── Dockerfile
│   │
│   ├── chat-service/
│   │   ├── src/
│   │   └── Dockerfile
│   │
│   └── agent-service/
│       ├── src/
│       └── Dockerfile
│
├── infrastructure/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
🖥️ Screenshots
<img width="1511" height="887" alt="Screenshot 2026-09-22 200934" src="https://github.com/user-attachments/assets/4d125ace-c455-4af3-9263-fc778f7a2d6d" /><img width="1886" height="617" alt="Screenshot 2026-09-22 201351" src="https://github.com/user-attachments/assets/08ea1f17-60c1-4a50-82ab-b6aa74192de5" />

🔄 Request Flow

A typical AI request follows this architecture:

User
 ↓
React Frontend
 ↓
API Gateway
 ↓
Agent Service
 ↓
Supervisor
 ↓
Specialized Agent
 ↓
Tool / RAG / LLM
 ↓
Response
 ↓
SSE Stream
 ↓
Frontend
🐳 Running Locally
1. Clone the repository
git clone https://github.com/Divyachauhan786/CortexAI.git
cd CortexAI
2. Configure Environment Variables

Create the required environment files using the provided examples.

cp .env.example .env

Configure the required credentials for:

MongoDB
Redis
Google Gemini
Groq
Tavily
Firebase
Session configuration

Never commit real credentials to GitHub.

3. Start the Application

Using Docker Compose:

docker compose up -d --build

Check running containers:

docker compose ps
4. Stop the Application
docker compose down
🔐 Environment Variables

Example configuration is provided through:

.env.example

Typical configuration includes:

MONGODB_URI=
REDIS_URL=
GOOGLE_API_KEY=
GROQ_API_KEY=
TAVILY_API_KEY=
JWT_SECRET=
FRONTEND_URL=

Firebase Admin credentials must remain private and must never be committed to GitHub.

☁️ AWS Deployment

CortexAI has been containerized and deployed using Docker Compose on AWS EC2.

Deployment architecture:

                         AWS EC2
                            │
                     Docker Compose
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
         Frontend         Gateway        Services
          Nginx              │        ┌────┼────┐
                             │        │    │    │
                             ▼        ▼    ▼    ▼
                           Auth     Chat Agent Redis
                                      │
                                      ▼
                                   MongoDB
                                      │
                                      ▼
                                    Qdrant
Current Deployment

Frontend:

http://13.62.101.113:5174

Gateway:

http://13.62.101.113:8080

The current deployment uses an EC2 public IP. HTTPS and a custom domain can be added for a production-ready public deployment.

🧪 Production-Oriented Features

The project includes several production-focused components:

Microservice architecture
Dockerized services
Docker Compose orchestration
Health checks
Service isolation
Database indexes
Rate limiting
Centralized logging
Centralized error handling
Environment-based configuration
Protected authentication routes
Redis session management
Persistent conversation storage
User-scoped document retrieval
Streaming AI responses
RAG pipeline
Vector database integration
🔒 Security

Sensitive configuration is intentionally excluded from version control.

Ignored resources include:

.env
.env.*
credentials/
Firebase Admin SDK credentials
node_modules/
uploads/
dist/
build/
logs/

Production secrets should be supplied through environment variables or a secure secret-management system.

🎯 Engineering Highlights

CortexAI demonstrates the implementation of a modern AI application beyond a basic LLM chatbot.

AI Engineering
Multi-agent orchestration
Supervisor-based routing
LangGraph workflows
Tool calling
RAG
Vector search
Embeddings
Persistent AI memory
Streaming responses
Backend Engineering
Microservices
REST APIs
Authentication
Redis sessions
MongoDB persistence
Rate limiting
Error handling
Service health checks
DevOps / Deployment
Docker
Docker Compose
Nginx
AWS EC2
Environment-based configuration
Container health monitoring
🚧 Future Improvements

Planned improvements include:

Custom domain + HTTPS
CI/CD pipeline
Advanced agent planning
More specialized AI agents
Advanced observability
Agent evaluation pipelines
Role-based access control
Additional document formats
Agent performance analytics
Cloud-native scaling

👨‍💻 Author
Divya Chauhan
B.Tech Computer Science Engineering

GitHub:
https://github.com/Divyachauhan786

⭐ Project

If you find CortexAI interesting, feel free to explore the repository and follow the project development.

roject README"
git push
