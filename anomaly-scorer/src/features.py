import pandas as pd
import numpy as np
def build_features(df: pd.DataFrame, value_col: str = "value", window: int = 12) -> pd.DataFrame:
    df = df.copy()
    df["rolling_mean"] = df[value_col].rolling(window=window, min_periods=3).mean()
    df["rolling_std"] = df[value_col].rolling(window=window, min_periods=3).std().replace(0, np.nan)
    df["zscore"] = (df[value_col] - df["rolling_mean"]) / df["rolling_std"]
    return df.fillna(0.0)
