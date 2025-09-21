-- pgvector eklentisini aktifleştir
CREATE EXTENSION IF NOT EXISTS vector;

-- UUID eklentisini de ekleyelim (genellikle yararlıdır)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigram eklentisi (metin araması için yararlı)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
