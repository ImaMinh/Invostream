# Kiến Trúc Hệ Thống Invostream

Tài liệu này mô tả chi tiết kiến trúc kỹ thuật của Invostream — từ luồng xử lý dữ liệu, các thành phần hệ thống, cho đến cách chúng giao tiếp với nhau.

---

## Tổng Quan Kiến Trúc

Invostream được thiết kế theo mô hình **event-driven microservices**, chia thành 3 lớp chính:

```mermaid
graph TB
    subgraph "Lớp Giao Diện (Presentation)"
        FE["React UI<br/>(Vite Dev Server)<br/>Port 5173"]
    end

    subgraph "Lớp Xử Lý (Application)"
        API["FastAPI Server<br/>Port 8000"]
        PIPE["Pipeline Engine<br/>(asyncio + ProcessPool)"]
        OCR["OCR Module<br/>(Azure AI)"]
        IMG["Image Preprocessor<br/>(OpenCV)"]
        TEL["Telemetry Service<br/>(aiokafka)"]
        DEDUP["Dedup Service<br/>(SHA-256)"]
    end

    subgraph "Lớp Dữ Liệu (Data)"
        PG["PostgreSQL 15<br/>(OLTP - Source of Truth)"]
        CH["ClickHouse<br/>(OLAP - Analytics)"]
        KF["Apache Kafka<br/>(Message Broker)"]
        DBZ["Debezium<br/>(CDC Connector)"]
        SQLITE["SQLite<br/>(Job Queue)"]
    end

    FE -->|HTTP/REST| API
    API --> PIPE
    PIPE --> DEDUP
    PIPE --> IMG
    IMG --> OCR
    PIPE -->|INSERT| PG
    TEL -->|Produce| KF
    PG -->|WAL| DBZ
    DBZ -->|CDC Events| KF
    KF -->|Materialized Views| CH
    API -->|Query Analytics| CH
    API -->|Query/Update Data| PG
    PIPE --> SQLITE
```

---

## Chi Tiết Từng Lớp

### 1. Lớp Giao Diện (Frontend)

**Công nghệ:** React 18, Vite 5, React Router DOM v6, Recharts, Lucide React

Frontend là một Single Page Application (SPA) giao tiếp với backend thông qua REST API.

#### Các trang chính:

| Route | Component | Chức năng | Data source |
|---|---|---|---|
| `/` | `Dashboard.jsx` | Analytics dashboard với biểu đồ real-time | ClickHouse (via API) |
| `/review` | `ReviewInvoices.jsx` | Danh sách hóa đơn, lọc theo status | PostgreSQL (via API) |
| `/review/:id` | `InvoiceDetail.jsx` | Chi tiết hóa đơn, form chỉnh sửa | PostgreSQL (via API) |
| `/upload` | `Upload.jsx` | Upload hóa đơn hàng loạt | FastAPI upload endpoint |

#### Luồng dữ liệu UI:

```mermaid
graph LR
    subgraph "Dashboard Page"
        D1["GET /api/dashboard/overview"]
        D2["GET /api/dashboard/accuracy"]
        D3["GET /api/dashboard/processing_metrics"]
    end

    subgraph "Review Pages"
        R1["GET /api/invoices/review-invoices"]
        R2["GET /api/invoices/invoice/:id"]
        R3["PUT /api/invoices/invoice/:id"]
    end

    subgraph "Upload Page"
        U1["POST /invoices/batch"]
    end

    D1 & D2 & D3 -->|ClickHouse| CH[(ClickHouse)]
    R1 & R2 & R3 -->|PostgreSQL| PG[(PostgreSQL)]
    U1 -->|Pipeline| PIPE[Pipeline Engine]
```

---

### 2. Lớp Xử Lý (Backend)

#### 2.1 FastAPI Server (`api/main.py`)

Server chính, chịu trách nhiệm:
- **Lifespan management:** Khởi tạo connection pool PostgreSQL khi start, đóng khi shutdown.
- **Background worker:** Khởi tạo `main_process()` loop lắng nghe job queue ngay khi server start.
- **CORS:** Cho phép frontend (`localhost:5173`) giao tiếp.
- **Static files:** Mount thư mục `data/raw/` để serve file gốc.

```python
# Lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_pool()           # Khởi tạo asyncpg pool
    asyncio.create_task(main_process())  # Bắt đầu lắng nghe job queue
    yield
    await close_db_pool()          # Đóng pool khi shutdown
```

#### 2.2 Pipeline Engine (`pipeline/`)

Đây là phần lõi xử lý, chia thành 3 module:

##### `pipeline_ingest.py` — Ingestion Layer
- Nhận danh sách `UploadFile` từ API.
- Chia thành chunks (mỗi chunk 20 files) để xử lý song song.
- Gọi `batch_setup()` cho từng chunk.

##### `batch.py` — Batch Processing & Job Queue
- **Deduplication:** Tính SHA-256 hash cho mỗi file → kiểm tra database → loại bỏ trùng lặp.
- **Dedup trong cùng batch:** Sử dụng `seen_in_batch: set[str]` để tránh trùng lặp nội bộ.
- **Lưu file:** Ghi file gốc vào `data/raw/{batch_id}/`.
- **Enqueue:** Đẩy job vào `JOB_QUEUE` (asyncio.Queue).
- **Main Process Loop:** Vòng lặp vô hạn `while True`, lấy job → dispatch sang `ProcessPoolExecutor` → handle kết quả bất đồng bộ.

```mermaid
flowchart TD
    A["UploadFile[]"] --> B["chunk_files(20)"]
    B --> C["batch_setup()"]
    C --> D{"Compute SHA-256"}
    D --> E{"Hash exists in DB?"}
    E -->|Yes| F["Skip (DuplicateFileInfo)"]
    E -->|No| G["Save to disk"]
    G --> H["Enqueue to JOB_QUEUE"]
    H --> I["main_process() picks up"]
    I --> J["run_in_executor(worker)"]
    J --> K["handle_worker_result()"]
    K --> L["insert_invoice() → PostgreSQL"]
```

##### `runner.py` — Worker Process
- Chạy trong **child process** riêng biệt (qua `ProcessPoolExecutor`).
- Gọi `ingest_image()` → `extract_invoices()`.
- Trả kết quả dưới dạng `list[dict]` (serialize qua Pydantic `model_dump()`).

**Tại sao dùng `run_in_executor` thay vì `executor.submit`?**

`executor.submit()` sẽ block thread hiện tại của main process, khiến nó không thể lắng nghe batch tiếp theo. `loop.run_in_executor()` wrap submission thành Future trong async event loop, cho phép main process tiếp tục lắng nghe.

#### 2.3 Image Preprocessing (`image_process/`)

Pipeline xử lý ảnh tuần tự gồm 5 bước:

```mermaid
graph LR
    A["Raw Image"] --> B["Normalize DPI<br/>(300 DPI)"]
    B --> C["Grayscale"]
    C --> D["Deskew<br/>(Nắn thẳng)"]
    D --> E["Adaptive<br/>Thresholding"]
    E --> F["Denoise"]
    F --> G["Processed Image"]
    
    PDF["PDF File"] -.->|"Skip preprocessing"| G
```

> **Lưu ý:** File PDF được bỏ qua toàn bộ pipeline image processing vì Azure Document Intelligence xử lý PDF gốc tốt hơn ảnh đã qua xử lý.

#### 2.4 OCR Extraction (`ocr/extraction.py`)

- Sử dụng **Azure AI Document Intelligence** với model `prebuilt-invoice`.
- Client async (`DocumentIntelligenceClient.aio`) — tất cả file trong batch được gửi **đồng thời** qua `asyncio.gather()`.
- Kết quả Azure trả về được map từ field name Azure → field name Pydantic model thông qua `FIELD_MAP`.
- **Line items** được xử lý riêng (`_extract_line_items()`) vì chúng là mảng lồng nhau.
- **Confidence scoring:** Nếu bất kỳ field nào có confidence < 0.8 hoặc value là None → status = `"review"`.
- Nếu extraction thất bại → trả về Invoice object với status = `"failed"` (không crash pipeline).

#### 2.5 Deduplication Service (`services/dedup/`)

Hệ thống chống trùng lặp 2 lớp:

| Lớp | Thời điểm | Cơ chế |
|---|---|---|
| **Lớp 1: Pre-OCR** | Trước khi enqueue job | `compute_hash()` → `find_existing()` kiểm tra trong PostgreSQL |
| **Lớp 2: DB-level** | Khi INSERT | `ON CONFLICT (content_hash) DO NOTHING` trong SQL |

```
File bytes → SHA-256 hash → Check DB → [Exists? Skip] → [New? Process & Insert]
                                         ↓ (safety net)
                                    INSERT ... ON CONFLICT DO NOTHING
```

#### 2.6 Telemetry Service (`services/telemetry/`)

Hệ thống đo lường hiệu năng non-blocking:

##### `tracer.py` — Instrumentation

Cung cấp 2 cơ chế đo lường:

1. **`@track_time(step_name)` decorator** — Wrap toàn bộ function:
   ```python
   @track_time("upload")
   async def ingest(folder: list[UploadFile]):
       ...
   ```

2. **`track_block(step_name, batch_id)` context manager** — Wrap một đoạn code cụ thể:
   ```python
   with track_block("ocr", batch_id):
       poller = await client.begin_analyze_document(...)
   ```

##### `exporter.py` — Kafka Producer

- Sử dụng **aiokafka** (async producer) để đẩy metric vào Kafka topic `invostream.telemetry`.
- **Non-blocking:** Sử dụng `asyncio.create_task()` để export metric mà không block pipeline chính.
- **Producer pool:** Cache producer theo event loop ID để tránh tạo lại connection.

---

### 3. Lớp Dữ Liệu (Data Layer)

#### 3.1 PostgreSQL — Source of Truth (OLTP)

**Image:** `debezium/postgres:15` (có WAL replication plugin `pgoutput` built-in)

##### Schema:

```mermaid
erDiagram
    invoices ||--o{ invoice_line_items : "has"
    
    invoices {
        UUID id PK
        VARCHAR job_id
        VARCHAR file_name
        VARCHAR status "success | review | failed"
        CHAR content_hash UK "SHA-256, unique"
        TEXT vendor_name
        TEXT customer_name
        NUMERIC invoice_total
        JSONB raw_fields "Azure raw output"
        INTEGER total_processing_time_ms
        TIMESTAMPTZ created_at
    }
    
    invoice_line_items {
        UUID id PK
        UUID invoice_id FK
        INTEGER line_number
        TEXT description
        NUMERIC quantity
        NUMERIC unit_price
        NUMERIC amount
        TIMESTAMPTZ created_at
    }
```

##### Connection Pool:

- **Library:** asyncpg (pure Python, async PostgreSQL driver)
- **Pool size:** min=1, max=10 connections
- **Pattern:** `async with get_db_connection() as conn`
- **Transactions:** `async with connection.transaction()` đảm bảo invoice + line items insert atomically.

#### 3.2 ClickHouse — Analytics Engine (OLAP)

**Schema:** Star Schema (Kimball-style)

```mermaid
graph TB
    subgraph "Fact Tables"
        IF["invoice_facts<br/>(MergeTree)<br/>1 row per invoice"]
        PM["processing_metrics<br/>(MergeTree)<br/>1 row per pipeline step"]
        FC["field_confidence<br/>(MergeTree)<br/>1 row per extracted field"]
        LIF["line_item_facts<br/>(MergeTree)<br/>1 row per line item"]
    end

    subgraph "Dimension Tables"
        DT["dim_templates<br/>(ReplacingMergeTree)<br/>OCR model versions"]
    end

    subgraph "Kafka Engine Tables"
        KIS["kafka_invoices_source"]
        KLS["kafka_line_items_source"]
        KTS["kafka_telemetry_source"]
    end

    subgraph "Materialized Views"
        MV1["mv_kafka_to_invoice_facts"]
        MV2["mv_kafka_to_field_confidence"]
        MV3["mv_kafka_to_line_item_facts"]
        MV4["mv_kafka_to_processing_metrics"]
    end

    KIS --> MV1 --> IF
    KIS --> MV2 --> FC
    KLS --> MV3 --> LIF
    KTS --> MV4 --> PM
```

##### Tại sao Star Schema?

Dashboard queries luôn theo pattern: `GROUP BY time, template, vendor → SUM/AVG/COUNT`. Star Schema cho phép ClickHouse chỉ scan các column cần thiết — đúng thế mạnh của columnar storage.

##### Partitioning:

Tất cả fact tables được partition theo `toYYYYMM(created_at)`, giúp:
- Xóa dữ liệu cũ dễ dàng (drop partition).
- Query gần đây nhanh hơn (chỉ scan partition hiện tại).

#### 3.3 Apache Kafka — Message Broker

**Topics:**

| Topic | Producer | Consumer | Nội dung |
|---|---|---|---|
| `invostream.public.invoices` | Debezium | ClickHouse (Kafka Engine) | CDC events khi INSERT/UPDATE invoices |
| `invostream.public.invoice_line_items` | Debezium | ClickHouse (Kafka Engine) | CDC events khi INSERT/UPDATE line items |
| `invostream.telemetry` | aiokafka (Python) | ClickHouse (Kafka Engine) | Step-level latency metrics |

#### 3.4 Debezium — Change Data Capture

```mermaid
sequenceDiagram
    participant PG as PostgreSQL
    participant WAL as WAL (pgoutput)
    participant DBZ as Debezium Connect
    participant KF as Kafka
    participant CH as ClickHouse

    PG->>WAL: INSERT INTO invoices (...)
    WAL->>DBZ: Stream WAL records
    DBZ->>DBZ: ExtractNewRecordState (SMT)
    DBZ->>KF: Produce to invostream.public.invoices
    KF->>CH: Kafka Engine auto-consume
    CH->>CH: Materialized View transforms & inserts
```

##### Cấu hình quan trọng:

| Config | Giá trị | Giải thích |
|---|---|---|
| `plugin.name` | `pgoutput` | PostgreSQL native replication protocol |
| `table.include.list` | `public.invoices, public.invoice_line_items` | Chỉ capture 2 bảng này |
| `transforms.unwrap.type` | `ExtractNewRecordState` | Unwrap envelope, chỉ lấy `after` state |
| `decimal.handling.mode` | `double` | Convert NUMERIC → Float64 cho ClickHouse |
| `key/value.converter` | `JsonConverter` | JSON format cho Kafka messages |

#### 3.5 SQLite — Job Queue

Lưu trữ trạng thái job queue (batch tracking, file paths) cục bộ. Nhẹ, không cần server riêng.

---

## Luồng Xử Lý End-to-End

### Luồng 1: Upload & OCR Processing

```mermaid
sequenceDiagram
    actor User
    participant FE as React UI
    participant API as FastAPI
    participant DEDUP as Dedup Service
    participant Q as JOB_QUEUE
    participant WK as Worker (Child Process)
    participant IMG as Image Processor
    participant OCR as Azure AI OCR
    participant PG as PostgreSQL

    User->>FE: Upload invoices
    FE->>API: POST /invoices/batch
    
    loop Mỗi chunk (20 files)
        API->>API: Read file bytes
        API->>DEDUP: compute_hash() + find_existing()
        DEDUP->>PG: SELECT content_hash WHERE hash IN (...)
        PG-->>DEDUP: Existing hashes
        DEDUP-->>API: Novel files + Duplicate list
        
        opt Có file mới
            API->>API: Save to data/raw/{batch_id}/
            API->>Q: JOB_QUEUE.put(job)
        end
    end
    
    API-->>FE: BatchUploadResponse

    Note over Q, WK: Background Processing (async)
    
    Q->>WK: main_process() picks up job
    
    loop Mỗi file
        WK->>IMG: process_image()
        Note over IMG: DPI → Grayscale → Deskew<br/>→ Threshold → Denoise
        IMG-->>WK: Processed image path
    end
    
    WK->>OCR: extract_invoices() [asyncio.gather]
    Note over OCR: Azure prebuilt-invoice model<br/>Concurrent API calls
    OCR-->>WK: List[Invoice]
    
    WK-->>API: Extracted data (via Future)
    
    loop Mỗi invoice
        API->>PG: INSERT INTO invoices (...)<br/>ON CONFLICT DO NOTHING
        API->>PG: INSERT INTO invoice_line_items (...)
    end
```

### Luồng 2: CDC → Analytics Pipeline

```mermaid
sequenceDiagram
    participant PG as PostgreSQL
    participant DBZ as Debezium
    participant KF as Kafka
    participant CH_KE as ClickHouse<br/>Kafka Engine
    participant CH_MV as ClickHouse<br/>Materialized Views
    participant CH_FT as ClickHouse<br/>Fact Tables

    PG->>DBZ: WAL record (new invoice)
    DBZ->>KF: Produce to invostream.public.invoices
    KF->>CH_KE: kafka_invoices_source consumes
    CH_KE->>CH_MV: Trigger mv_kafka_to_invoice_facts
    CH_MV->>CH_MV: Compute avg_confidence, min_confidence<br/>from raw_fields JSON
    CH_MV->>CH_FT: INSERT INTO invoice_facts
    
    CH_KE->>CH_MV: Trigger mv_kafka_to_field_confidence
    CH_MV->>CH_MV: ARRAY JOIN to explode raw_fields
    CH_MV->>CH_FT: INSERT INTO field_confidence
```

### Luồng 3: Telemetry Pipeline

```mermaid
sequenceDiagram
    participant CODE as Python Code
    participant TRACER as @track_time / track_block
    participant EXPORTER as aiokafka Producer
    participant KF as Kafka
    participant CH as ClickHouse

    CODE->>TRACER: Enter instrumented block
    TRACER->>TRACER: Record start_time
    CODE->>CODE: Execute business logic
    TRACER->>TRACER: Compute duration_ms
    TRACER->>EXPORTER: asyncio.create_task(export_metric)
    Note over TRACER, EXPORTER: Non-blocking!
    EXPORTER->>KF: Produce to invostream.telemetry
    KF->>CH: kafka_telemetry_source → mv → processing_metrics
```

### Luồng 4: Human-in-the-Loop Review

```mermaid
sequenceDiagram
    actor Reviewer
    participant FE as React UI
    participant API as FastAPI
    participant PG as PostgreSQL
    participant DBZ as Debezium
    participant CH as ClickHouse

    Reviewer->>FE: Mở /review
    FE->>API: GET /api/invoices/review-invoices
    API->>PG: SELECT id, vendor_name, status, ...
    PG-->>API: Invoice list
    API-->>FE: JSON response
    
    Reviewer->>FE: Click invoice (status=review)
    FE->>API: GET /api/invoices/invoice/{id}
    API->>PG: SELECT * FROM invoices WHERE id = $1
    PG-->>API: Full invoice data
    API-->>FE: Invoice detail
    
    Reviewer->>FE: Sửa fields + Save
    FE->>API: PUT /api/invoices/invoice/{id}
    API->>PG: UPDATE invoices SET ... status='success'
    PG-->>API: Updated row
    
    Note over PG, CH: CDC tự động sync
    PG->>DBZ: WAL captures UPDATE
    DBZ->>CH: Update analytics data
```

---

## Các Quyết Định Thiết Kế Quan Trọng

### 1. CDC thay vì Dual-Write

**Ban đầu:** Hệ thống dùng dual-write — sau khi INSERT vào PostgreSQL, gọi thêm `insert_analytics()` để write trực tiếp vào ClickHouse.

**Hiện tại:** Chuyển sang CDC (Debezium → Kafka → ClickHouse native consume). Lý do:
- **Consistency:** Không bao giờ mất dữ liệu — nếu ClickHouse down, Kafka giữ message cho đến khi ClickHouse recover.
- **Đơn giản hóa code:** Chỉ cần write 1 lần vào PostgreSQL, phần còn lại tự động.
- **Decoupling:** PostgreSQL không cần biết ClickHouse tồn tại.

### 2. asyncio.Queue + ProcessPoolExecutor

**Vấn đề:** OCR là CPU-intensive + I/O-intensive, nếu chạy trên main thread sẽ block toàn bộ API.

**Giải pháp:**
- `asyncio.Queue` để decouple upload request khỏi processing.
- `ProcessPoolExecutor` để spawn child processes cho OCR (tận dụng multi-core CPU).
- `asyncio.create_task(handle_worker_result(...))` để handle kết quả mà không block main loop.

### 3. Materialized Views cho Realtime Analytics

ClickHouse Kafka Engine + Materialized Views cho phép:
- **Zero-latency ingestion:** Data từ Kafka được insert vào fact tables ngay khi arrive.
- **Transform on-the-fly:** Materialized Views tính `avg_confidence`, `min_confidence` từ `raw_fields` JSON ngay trong quá trình ingest.
- **No consumer code needed:** Không cần viết consumer bằng Python — ClickHouse tự consume natively.

### 4. Confidence-based Review System

Thay vì tất cả hóa đơn đều cần review, hệ thống tự phân loại:
- `status = "success"` → Tất cả fields có confidence ≥ 0.8 → Tự động approve.
- `status = "review"` → Có field confidence < 0.8 hoặc value = None → Cần human review.
- `status = "failed"` → OCR extraction thất bại hoàn toàn.

---

## Monitoring & Observability

| Công cụ | URL | Chức năng |
|---|---|---|
| **Kafdrop** | `http://localhost:9090` | Xem Kafka topics, messages, consumer groups |
| **ClickHouse Play** | `http://localhost:8123/play` | Chạy SQL queries trực tiếp trên ClickHouse |
| **Debezium REST** | `http://localhost:8083/connectors` | Kiểm tra trạng thái CDC connectors |
| **FastAPI Docs** | `http://localhost:8000/docs` | Swagger UI cho tất cả API endpoints |
| **Console Logs** | `docker logs invostream-api` | Server logs, pipeline progress, telemetry |

---

## Hạn Chế Hiện Tại & Hướng Phát Triển

### Hạn chế
- **Chưa có authentication/authorization** — API và UI đều public.
- **Chưa có retry mechanism** — Nếu Azure OCR timeout, file bị mark `failed` và không tự retry.
- **Telemetry thiếu correlation** — Các metric chưa được liên kết theo `batch_id` hoặc `invoice_id` trong processing_metrics.
- **Frontend chưa auto-refresh** — Dashboard cần refresh thủ công để thấy data mới (chưa có WebSocket/SSE).
- **Chưa có migration tooling** — Schema changes phải chạy SQL thủ công.

### Hướng phát triển
- **WebSocket real-time updates** cho dashboard và upload progress.
- **Retry queue** với exponential backoff cho failed OCR jobs.
- **Custom OCR model training** — hỗ trợ fine-tune model cho từng loại hóa đơn.
- **Grafana integration** cho monitoring toàn diện (đã có config sẵn trong docker-compose, chưa bật).
- **CI/CD pipeline** với automated testing.
- **Rate limiting & API key authentication**.
