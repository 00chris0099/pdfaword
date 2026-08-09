# PDFForge

Conversor PDF a Word con OCR avanzado. Preserva tablas, imágenes, colores, cabeceras, formas y layout multi-columna.

## Features

- **OCR de alta precisión** — PaddleOCR PP-StructureV3 (96%+ precisión) con fallback a PyMuPDF
- **Preservación de formato** — Tablas, imágenes, colores, fuentes, bold/italic
- **Traducción automática** — 100+ idiomas via Google Translate
- **Batch upload** — Convierte hasta 20 PDFs en paralelo
- **API REST** — Documentación interactiva en `/docs`
- **Planes** — Free (5 credits), Pro (100/month), Enterprise (unlimited)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | FastAPI, Python 3.12, SQLAlchemy, SQLite |
| OCR | PaddleOCR PP-StructureV3 / PyMuPDF fallback |
| Conversion | pdf2docx |
| Translation | deep-translator (Google) |

## Quick Start (Local)

### Prerequisites

- Python 3.12+
- Node.js 22+

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs

## Docker Deployment

```bash
# Build and start
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile |

### Conversion
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/convert` | Upload PDF (single) |
| GET | `/api/convert/{id}/status` | Check status |
| GET | `/api/convert/{id}/download` | Download DOCX |
| DELETE | `/api/convert/{id}` | Delete conversion |

### Batch
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/convert/batch` | Upload multiple PDFs |
| GET | `/api/convert/batch/{id}` | Batch status |
| GET | `/api/convert/batch/{id}/download` | Download ZIP |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/convert/credits` | Check credits |
| GET | `/api/history` | Conversion history |
| GET | `/api/health` | Health check |

## Project Structure

```
pdfforge/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry
│   │   ├── config.py            # Settings
│   │   ├── database.py          # SQLite async
│   │   ├── models.py            # DB models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT auth
│   │   ├── routers/
│   │   │   ├── auth.py          # Auth endpoints
│   │   │   ├── convert.py       # Conversion endpoints
│   │   │   └── history.py       # History endpoint
│   │   ├── services/
│   │   │   ├── converter.py     # Main conversion pipeline
│   │   │   ├── ocr_engine.py    # PaddleOCR + fallback
│   │   │   ├── docx_builder.py  # DOCX generation
│   │   │   ├── translator.py    # Translation service
│   │   │   ├── batch.py         # Batch processing
│   │   │   └── storage.py       # File management
│   │   └── utils/
│   │       ├── pdf_analyzer.py  # PDF analysis
│   │       └── quality_checker.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── dashboard/       # Dashboard
│   │   │   ├── convert/         # Convert page
│   │   │   ├── history/         # History
│   │   │   ├── docs/            # API docs
│   │   │   ├── login/           # Login
│   │   │   └── register/        # Register
│   │   ├── context/auth.tsx     # Auth context
│   │   └── lib/
│   │       ├── api.ts           # API client
│   │       └── utils.ts         # Utilities
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## License

MIT
