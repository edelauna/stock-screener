DROP TABLE IF EXISTS EtfWeighting;
CREATE TABLE IF NOT EXISTS EtfWeighting (
    symbol TEXT,
    etf_symbol TEXT,
    weighting TEXT,
    PRIMARY KEY (symbol, etf_symbol)
);

CREATE INDEX idx_symbol ON EtfWeighting (symbol);