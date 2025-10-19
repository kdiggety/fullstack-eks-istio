from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
from features import build_features
from model import ZScoreModel

app = FastAPI()
model = ZScoreModel(threshold=3.0)

class SeriesIn(BaseModel):
    timestamps: list
    values: list

@app.get("/health")
def health(): return {"ok": True}

@app.post("/score")
def score(series: SeriesIn):
    df = pd.DataFrame({"ts": series.timestamps, "value": series.values})
    feats = build_features(df, value_col="value")
    scores = model.score(feats["zscore"].tolist())
    return {"anomalies": scores, "z": [round(float(z),3) for z in feats["zscore"].tolist()]}
