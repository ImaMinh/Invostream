# Invostream

**Invostream** là một hệ thống xử lý hóa đơn thời gian thực (real-time invoice processing pipeline) được xây dựng trên kiến trúc event-driven. Hệ thống tích hợp OCR thông minh (Azure Document Intelligence), pipeline streaming CDC (Change Data Capture), và giao diện "human-in-the-loop" cho phép con người duyệt và chỉnh sửa kết quả OCR trước khi chốt dữ liệu.

## Tính Năng Chính

- **OCR Bất đồng bộ & Đa tiến trình:** Xử lý hóa đơn hàng loạt với `ProcessPoolExecutor` và `asyncio.Queue` — API không bị block trong suốt quá trình OCR.
- **Chống trùng lặp thông minh (Deduplication):** Kiểm tra SHA-256 hash trước khi gọi Azure API, tiết kiệm chi phí cloud và tránh dữ liệu bị duplicate.
- **Streaming dữ liệu thời gian thực (CDC):** Debezium bắt mọi thay đổi từ PostgreSQL WAL → đẩy event qua Kafka → ClickHouse tự động ingest — không cần dual-write.
- **Dashboard phân tích hiệu năng cao:** ClickHouse (OLAP) native consume từ Kafka, cung cấp metrics real-time cho dashboard: throughput, latency, accuracy, backlog.
- **Human-in-the-loop:** Giao diện React cho phép người dùng review hóa đơn có confidence thấp, chỉnh sửa trường dữ liệu và approve.
- **Telemetry Pipeline:** Đo lường latency từng bước xử lý (upload → preprocessing → OCR → mapping → DB insert) và export non-blocking qua Kafka.

## Công Nghệ Sử Dụng

### Backend
| Thành phần | Công nghệ |
|---|---|
| Framework | FastAPI + Uvicorn |
| AI / OCR | Azure AI Document Intelligence |
| Tiền xử lý ảnh | OpenCV, Scikit-image, pdf2image |
| Cơ sở dữ liệu (OLTP) | PostgreSQL 15 (asyncpg, psycopg2-binary) |
| Connection Pool | asyncpg Pool (min=1, max=10) |
| Xử lý bất đồng bộ | asyncio Queue + ProcessPoolExecutor |
| Validation | Pydantic v2 |

### Hạ Tầng Dữ Liệu (CDC Pipeline)
| Thành phần | Công nghệ |
|---|---|
| Message Broker | Apache Kafka (Confluent 7.3.0) + Zookeeper |
| Change Data Capture | Debezium 2.4 (PostgreSQL Connector) |
| Cơ sở dữ liệu phân tích (OLAP) | ClickHouse (Star Schema - Kimball) |
| Telemetry Export | aiokafka (async producer → Kafka topic) |
| Giám sát Kafka | Kafdrop |

### Frontend
| Thành phần | Công nghệ |
|---|---|
| Framework | React 18 (Vite 5) |
| Routing | React Router DOM v6 |
| Biểu đồ | Recharts |
| Icons | Lucide React |

---

## Hướng Dẫn Cài Đặt & Chạy

### Yêu Cầu

- **Docker** & **Docker Compose** (v2+)
- **Azure Document Intelligence** API Key & Endpoint (để sử dụng OCR)
- **Git**

### Bước 1: Clone Project

```bash
git clone https://github.com/ImaMinh/Invostream.git
cd invostream
```

### Bước 2: Cấu Hình Biến Môi Trường

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

Mở file `.env` và điền thông tin Azure:

```env
# === Azure Document Intelligence (BẮT BUỘC) ===
DOCUMENTINTELLIGENCE_API_KEY='your_azure_api_key_here'
DOCUMENTINTELLIGENCE_ENDPOINT='https://your-resource.cognitiveservices.azure.com/'

# === PostgreSQL (mặc định, không cần sửa) ===
DATABASE_URL=postgresql+psycopg2://invostream_user:your_password@postgres:5432/invostream_postgresql_db
POSTGRES_USER=invostream_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=invostream_postgresql_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# === ClickHouse (mặc định, không cần sửa) ===
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=invostream_ch_pass
```

> [!IMPORTANT]
> Bạn **bắt buộc** phải có Azure Document Intelligence API Key để hệ thống OCR hoạt động. Đăng ký tại [Azure Portal](https://portal.azure.com/).

### Bước 3: Khởi Chạy Toàn Bộ Hệ Thống

```bash
docker compose up -d --build
```

Lệnh này sẽ build và khởi chạy **8 container**:

| Container | Mô tả | Port |
|---|---|---|
| `invostream-postgres` | Cơ sở dữ liệu OLTP chính | `5432` |
| `invostream-zookeeper` | Quản lý cluster Kafka | `2181` (internal) |
| `invostream-kafka` | Message broker | `9092` |
| `invostream-debezium` | CDC connector (PostgreSQL → Kafka) | `8083` |
| `invostream-clickhouse` | Cơ sở dữ liệu OLAP cho analytics | `8123` (HTTP), `9000` (Native) |
| `invostream-kafdrop` | Giao diện giám sát Kafka | `9090` |
| `invostream-api` | FastAPI backend | `8000` |
| `invostream-frontend` | React UI (Vite dev server) | `5173` |

### Bước 4: Khởi Tạo Database

Sau khi tất cả container đã chạy, thực hiện các bước sau để khởi tạo schema:

#### 4a. Tạo bảng ClickHouse (Analytics)

```bash
# Tạo schema OLAP (Star Schema)
docker exec -i invostream-clickhouse clickhouse-client --multiquery < db/clickhouse/migrations/001_analytics_schema.sql

# Tạo Kafka pipeline (Kafka Engine Tables + Materialized Views)
docker exec -i invostream-clickhouse clickhouse-client --multiquery < db/clickhouse/migrations/002_kafka_pipeline.sql
```

#### 4b. Đăng ký Debezium Connector

Đợi khoảng 10-15 giây sau khi Debezium container ready, rồi chạy:

```bash
curl -i -X POST -H "Accept:application/json" -H "Content-Type:application/json" \
  http://localhost:8083/connectors/ \
  -d @db/debezium/debezium_postgres_source.json
```

Kiểm tra trạng thái connector:

```bash
curl http://localhost:8083/connectors/invostream-postgres-connector/status
```

> [!NOTE]
> Bảng PostgreSQL (`invoices`, `invoice_line_items`) sẽ được tự động tạo bởi FastAPI khi server khởi động lần đầu. Nếu muốn reset toàn bộ, xem phần [Reset Môi Trường Dev](#reset-môi-trường-dev).

### Bước 5: Truy Cập Giao Diện

Mở trình duyệt và truy cập các địa chỉ sau:

| Dịch vụ | URL | Mô tả |
|---|---|---|
| **Invostream UI** | [http://localhost:5173](http://localhost:5173) | Giao diện chính — upload, review, dashboard |
| **API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI cho FastAPI |
| **Kafdrop** | [http://localhost:9090](http://localhost:9090) | Giám sát Kafka topics & messages |
| **Debezium** | [http://localhost:8083/connectors](http://localhost:8083/connectors) | Trạng thái CDC connectors |
| **ClickHouse** | [http://localhost:8123/play](http://localhost:8123/play) | ClickHouse HTTP Play UI |

---

## Sử Dụng Giao Diện (UI)

Giao diện Invostream có 3 trang chính:

### 1. Analytics Dashboard (`/`)
- Hiển thị tổng quan OCR: số hóa đơn xử lý, tỷ lệ thành công, latency (avg/P95/P99).
- Biểu đồ xử lý theo ngày, accuracy theo thời gian.
- Thống kê hiệu năng pipeline: throughput, backlog, error rate.

### 2. Invoice Review (`/review`)
- Danh sách tất cả hóa đơn đã xử lý.
- Lọc theo trạng thái: `success`, `review`, `failed`.
- Click vào hóa đơn để xem chi tiết và chỉnh sửa (`/review/:id`).

### 3. Upload Invoices (`/upload`)
- Upload hàng loạt file hóa đơn (PDF, ảnh JPEG/PNG).
- Hệ thống tự động chống trùng lặp và bắt đầu xử lý OCR ngay lập tức.

---

## Reset Môi Trường Dev

Sử dụng script `reset_dev.sh` để xóa toàn bộ dữ liệu và reset schema:

```bash
# Reset toàn bộ (databases + files)
chmod +x scripts/reset_dev.sh
./scripts/reset_dev.sh

# Chỉ reset databases, giữ lại files
./scripts/reset_dev.sh --db-only
```

Script sẽ thực hiện:
1. Drop & recreate bảng PostgreSQL (`invoices`, `invoice_line_items`)
2. Drop & recreate toàn bộ schema ClickHouse (5 tables + 3 Kafka engines + 4 MVs)
3. Xóa SQLite job queue
4. Đăng ký lại Debezium connector
5. Xóa thư mục `data/raw/` và `data/thresholded/` (nếu không dùng `--db-only`)

> [!WARNING]
> Script này sẽ **XÓA TOÀN BỘ DỮ LIỆU**. Chỉ sử dụng để reset.

---

## Kiến Trúc Hệ Thống

```mermaid
sequenceDiagram
    participant FE as Frontend (React)
    participant API as FastAPI
    participant PI as pipeline_ingest
    participant Q as JOB_QUEUE (asyncio)
    participant WK as Worker Process
    participant PG as PostgreSQL (OLTP)
    participant DBZ as Debezium (CDC)
    participant KF as Kafka
    participant CH as ClickHouse (OLAP)

    FE->>API: POST /invoices/batch (Upload files)
    API->>PI: batch_setup(chunk)
    Note over PI: Compute SHA-256 Hash<br/>& Dedup Check
    PI->>Q: JOB_QUEUE.put(Job)
    API-->>FE: BatchUploadResponse

    Q->>WK: Fetch Job (via run_in_executor)
    Note over WK: 1. Image Preprocessing<br/>(Normalize, Grayscale,<br/>Deskew, Threshold, Denoise)<br/>2. Azure AI OCR Extraction
    WK-->>API: Extracted Invoice Data

    API->>PG: insert_invoice() (Transaction)

    Note over PG, CH: --- Real-Time CDC Pipeline ---
    PG-->>DBZ: WAL (Write-Ahead Log)
    DBZ-->>KF: Push Event to Kafka Topic
    KF-->>CH: Materialized View Auto-Ingest
```

---

## Cấu Trúc Thư Mục

```
invostream/
├── api/                          # FastAPI application
│   ├── main.py                   # Entry point, lifespan, CORS, routes
│   └── frontend/                 # API routes phục vụ frontend
│       ├── dashboard.py          # GET /api/dashboard/* (metrics từ ClickHouse)
│       └── invoices.py           # CRUD /api/invoices/* (data từ PostgreSQL)
├── pipeline/                     # Pipeline xử lý hóa đơn
│   ├── pipeline_ingest.py        # Chunking uploaded files (20 files/chunk)
│   ├── batch.py                  # Dedup, save to disk, enqueue jobs, main_process loop
│   └── runner.py                 # Worker process (preprocessing → OCR → return results)
├── ocr/
│   └── extraction.py             # Azure Document Intelligence client & field mapping
├── image_process/                # Tiền xử lý ảnh (OpenCV pipeline)
│   ├── ingest.py                 # Orchestrator: normalize → grayscale → deskew → threshold → denoise
│   ├── normalize.py              # Chuẩn hóa DPI (300dpi)
│   ├── grayscale.py              # Chuyển grayscale
│   ├── deskew_step.py            # Nắn thẳng ảnh bị nghiêng
│   ├── adaptive_thresholding.py  # Adaptive thresholding
│   └── denoise.py                # Khử nhiễu
├── models/                       # Pydantic models
│   ├── invoice.py                # Invoice & InvoiceLineItem schema
│   └── batch.py                  # BatchUploadResponse, DuplicateFileInfo
├── services/
│   ├── dedup/
│   │   └── deduplication.py      # SHA-256 hash + DB lookup
│   └── telemetry/
│       ├── tracer.py             # @track_time decorator & track_block context manager
│       └── exporter.py           # Async Kafka producer (aiokafka)
├── db/
│   ├── postgresql/
│   │   ├── pool.py               # asyncpg connection pool
│   │   ├── invoices.py           # INSERT/SELECT/UPDATE invoices
│   │   └── migrations/           # SQL migration files
│   ├── clickhouse/
│   │   ├── client.py             # clickhouse-connect client
│   │   ├── analytics.py          # Dual-write functions (legacy, replaced by CDC)
│   │   └── migrations/
│   │       ├── 001_analytics_schema.sql  # Star Schema (5 tables)
│   │       └── 002_kafka_pipeline.sql    # Kafka Engine + Materialized Views
│   ├── debezium/
│   │   ├── debezium_postgres_source.json # Connector config
│   │   └── register.sh           # Script đăng ký connector
│   └── sqlite/
│       ├── job_queue.py          # Job queue management
│       └── sqlite.py             # SQLite connection
├── frontend/                     # React SPA
│   ├── Dockerfile                # Node 18 Alpine + Vite dev server
│   ├── src/
│   │   ├── App.jsx               # Router: /, /review, /review/:id, /upload
│   │   ├── index.css             # Global styles
│   │   └── pages/
│   │       ├── Dashboard.jsx     # Analytics dashboard (Recharts)
│   │       ├── ReviewInvoices.jsx# Danh sách hóa đơn cần review
│   │       ├── InvoiceDetail.jsx # Chi tiết & chỉnh sửa hóa đơn
│   │       └── Upload.jsx        # Upload hóa đơn hàng loạt
├── scripts/
│   └── reset_dev.sh              # Nuclear reset cho development
├── data/                         # Thư mục lưu file upload (mounted volume)
├── docker-compose.yml            # Orchestration 8 services
├── Dockerfile                    # Backend (Python 3.12-slim)
├── requirements.txt              # Python dependencies
└── .env.example                  # Template biến môi trường
```

---

## API Endpoints

### Upload & Processing
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/invoices/batch` | Upload hàng loạt hóa đơn |

### Dashboard (ClickHouse)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/dashboard/overview` | Tổng quan OCR + can thiệp thủ công |
| `GET` | `/api/dashboard/accuracy` | Accuracy theo field, document, thời gian |
| `GET` | `/api/dashboard/processing_metrics` | Hiệu năng: step times, throughput, backlog |

### Invoice Management (PostgreSQL)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/invoices/review-invoices` | Danh sách hóa đơn |
| `GET` | `/api/invoices/invoice/{id}` | Chi tiết một hóa đơn |
| `PUT` | `/api/invoices/invoice/{id}` | Cập nhật/approve hóa đơn |

---

## Xử Lý Sự Cố Thường Gặp

### Port 5432 đã bị chiếm
```bash
# Kiểm tra process nào đang dùng port
sudo lsof -i :5432

# Dừng PostgreSQL local (nếu có)
sudo systemctl stop postgresql
```

### Debezium connector không hoạt động
```bash
# Kiểm tra status
curl http://localhost:8083/connectors/invostream-postgres-connector/status

# Xóa và đăng ký lại
curl -X DELETE http://localhost:8083/connectors/invostream-postgres-connector
curl -i -X POST -H "Accept:application/json" -H "Content-Type:application/json" \
  http://localhost:8083/connectors/ -d @db/debezium/debezium_postgres_source.json
```

### Dọn dẹp Docker khi hết dung lượng
```bash
# Xóa tất cả image, container, volume không sử dụng
docker system prune -a --volumes
```

---

## License

MIT
