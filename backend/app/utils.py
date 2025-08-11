import pandas as pd
import numpy as np
from pandas.api import types as ptypes

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns=lambda c: str(c).strip())
    df = df.dropna(axis=1, how='all')
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype(str).str.strip().replace({'': pd.NA})
    return df

def try_parse_date(series: pd.Series, threshold=0.8):
    parsed = pd.to_datetime(series, errors='coerce', infer_datetime_format=True)
    success_rate = parsed.notna().sum() / max(1, len(series))
    if success_rate >= threshold:
        return parsed
    return series

def infer_column_types(df: pd.DataFrame):
    info = []
    for col in df.columns:
        series = df[col]
        dtype = str(series.dtype)
        parsed = try_parse_date(series)
        if ptypes.is_datetime64_any_dtype(parsed):
            detected = "datetime"
            series_to_count = parsed
        elif ptypes.is_numeric_dtype(series):
            detected = "numeric"
            series_to_count = series
        else:
            nunique = series.nunique(dropna=True)
            if nunique <= 50:
                detected = "categorical"
            else:
                detected = "text"
            series_to_count = series

        info.append({
            "name": col,
            "dtype": dtype,
            "type": detected,
            "unique": int(series.nunique(dropna=True)),
            "missing": int(series.isna().sum())
        })
    return info

def top_k_counts(series: pd.Series, k=10):
    vc = series.value_counts(dropna=True).head(k)
    return [{"key": str(idx), "value": int(v)} for idx, v in vc.items()]

def suggest_charts_for_df(df: pd.DataFrame, col_info):
    charts = []
    date_cols = [c["name"] for c in col_info if c["type"] == "datetime"]
    numeric_cols = [c["name"] for c in col_info if c["type"] == "numeric"]
    categorical_cols = [c["name"] for c in col_info if c["type"] == "categorical"]

    # 1) Trend lines for datetime + numeric
    if date_cols and numeric_cols:
        dcol = date_cols[0]
        for ncol in numeric_cols[:5]:
            tmp = df[[dcol, ncol]].dropna()
            if tmp.empty: 
                continue
            try:
                tmp[dcol] = pd.to_datetime(tmp[dcol], errors='coerce')
                grp = tmp.set_index(dcol).resample('M').mean().reset_index()
                data = [{"x": row[dcol].strftime("%Y-%m"), "y": (row[ncol] if pd.notna(row[ncol]) else None)} for _, row in grp.iterrows()]
            except:
                data = tmp.to_dict(orient='records')
            charts.append({
                "id": f"line_{dcol}_{ncol}",
                "type": "line",
                "title": f"Trend: {ncol} over {dcol}",
                "x": dcol,
                "y": ncol,
                "data": data
            })
            # Area chart variant
            charts.append({
                "id": f"area_{dcol}_{ncol}",
                "type": "area",
                "title": f"Area: {ncol} over {dcol}",
                "x": dcol,
                "y": ncol,
                "data": data
            })

    # 2) Bar & Pie for categorical + numeric
    for c in categorical_cols[:6]:
        for n in numeric_cols[:3]:
            tmp = df[[c, n]].dropna()
            if tmp.empty: 
                continue
            agg_sum = tmp.groupby(c)[n].sum().reset_index().sort_values(n, ascending=False).head(12)
            agg_mean = tmp.groupby(c)[n].mean().reset_index().sort_values(n, ascending=False).head(12)
            sum_data = [{"category": str(row[c]), "value": float(row[n])} for _, row in agg_sum.iterrows()]
            mean_data = [{"category": str(row[c]), "value": float(row[n])} for _, row in agg_mean.iterrows()]

            charts.append({
                "id": f"bar_sum_{c}_{n}",
                "type": "bar",
                "title": f"Total {n} by {c}",
                "category": c,
                "value": n,
                "data": sum_data
            })
            charts.append({
                "id": f"bar_mean_{c}_{n}",
                "type": "bar",
                "title": f"Average {n} by {c}",
                "category": c,
                "value": n,
                "data": mean_data
            })

        # Pie & Donut charts for category distribution
        topk = top_k_counts(df[c], k=10)
        if topk:
            charts.append({
                "id": f"pie_{c}",
                "type": "pie",
                "title": f"Distribution: {c}",
                "data": topk
            })
            charts.append({
                "id": f"donut_{c}",
                "type": "donut",
                "title": f"Donut Chart: {c}",
                "data": topk
            })

    # 3) Scatterplots for correlated numeric pairs
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr().abs().unstack().dropna()
        corr = corr[corr < 1]
        top_pairs = corr.sort_values(ascending=False).head(8)
        seen = set()
        for (a, b), val in top_pairs.items():
            key = tuple(sorted((a, b)))
            if key in seen: 
                continue
            seen.add(key)
            tmp = df[[a, b]].dropna()
            data = [{"x": float(r[a]), "y": float(r[b])} for _, r in tmp.iterrows()]
            charts.append({
                "id": f"scatter_{a}_{b}",
                "type": "scatter",
                "title": f"Scatter: {a} vs {b} (corr={float(val):.2f})",
                "x": a,
                "y": b,
                "data": data
            })
            # Bubble chart variant (size based on correlation strength)
            charts.append({
                "id": f"bubble_{a}_{b}",
                "type": "bubble",
                "title": f"Bubble: {a} vs {b}",
                "x": a,
                "y": b,
                "size": abs(float(val)),
                "data": data
            })

    # 4) Histograms & Box plots for numeric columns
    for n in numeric_cols[:8]:
        arr = df[n].dropna().astype(float).tolist()
        charts.append({
            "id": f"hist_{n}",
            "type": "histogram",
            "title": f"Histogram: {n}",
            "data": arr
        })
        charts.append({
            "id": f"box_{n}",
            "type": "box",
            "title": f"Box Plot: {n}",
            "data": arr
        })

    return charts

def safe_serialize(obj):
    import json
    return json.loads(json.dumps(obj, default=str))
