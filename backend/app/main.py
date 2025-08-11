# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import io
import uuid
from .utils import infer_column_types, clean_dataframe, suggest_charts_for_df, safe_serialize

app = FastAPI(title="Excel Insights API")

# Allow frontend origin in prod set proper origin env var
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXT = (".xlsx", ".xls", ".csv")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not any(filename.lower().endswith(ext) for ext in ALLOWED_EXT):
        raise HTTPException(status_code=400, detail="Only .xlsx/.xls/.csv allowed")
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # try reading
    try:
        if filename.lower().endswith(".csv"):
            try:
                text = contents.decode('utf-8')
            except UnicodeDecodeError:
                text = contents.decode('latin-1')
            df = pd.read_csv(io.StringIO(text))
        else:
            df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    # Basic cleaning & type inference
    df = clean_dataframe(df)
    col_info = infer_column_types(df)

    # summary with extra stats
    memory_mb = round(df.memory_usage(deep=True).sum() / 1024**2, 2)
    duplicates = int(df.duplicated().sum())
    numeric_count = df.select_dtypes(include=np.number).shape[1]
    categorical_count = df.select_dtypes(exclude=np.number).shape[1]
    most_frequent_column = df.nunique().idxmin() if not df.empty else None
    last_updated = None
    for col in df.columns:
        if np.issubdtype(df[col].dtype, np.datetime64):
            try:
                last_updated = str(df[col].max().date())
            except Exception:
                pass
            break
    health_score = max(
        0,
        100 - (df.isna().sum().sum() / (df.shape[0] * df.shape[1]) * 100)
    )

    summary = {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "missing_total": int(df.isna().sum().sum()),
        "duplicates": duplicates,
        "memory_mb": memory_mb,
        "numeric_count": numeric_count,
        "categorical_count": categorical_count,
        "most_frequent_column": most_frequent_column,
        "last_updated": last_updated,
        "health_score": round(health_score, 2),
        "columns_info": col_info,
    }


    # generate chart suggestions + small data payloads for charts
    charts = suggest_charts_for_df(df, col_info)

    # correlation matrix for numeric columns (for heatmap)
    numeric_cols = [c["name"] for c in col_info if c["type"] == "numeric"]
    corr_matrix = None
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr().round(3)
        corr_matrix = {
            "columns": numeric_cols,
            "matrix": corr.fillna(0).values.tolist()
        }

    data_preview = df.head(20).to_dict(orient="records")

    result = {
        "id": str(uuid.uuid4()),
        "summary": summary,
        "charts": charts,
        "corr_matrix": corr_matrix,
        "data_preview": safe_serialize(data_preview),
    }
    return result
